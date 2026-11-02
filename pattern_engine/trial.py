"""Prospective paper trial. v1 rules are fixed; never backfill or rewrite picks."""
import json
from contextlib import closing
import math
from datetime import datetime, timedelta, timezone

import database
from .data_model import build_dataset_snapshot
from .miner import PatternMiner

VERSION = "quality-v1"
VN = timezone(timedelta(hours=7))
RULES = {
    "days": 60, "exact_streak": 4, "top_n": 50,
    "min_occurrences": 40, "min_test_rate": 0.50,
    "max_train_test_drop": 0.10,
    "require_wilson_above_baseline": True,
    "cutoff": "18:00 Asia/Ho_Chi_Minh",
}


def init_table():
    with closing(database.get_connection()) as conn, conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS quality_trial_snapshots (
            version TEXT NOT NULL, target_date TEXT NOT NULL,
            source_date TEXT NOT NULL, created_at TEXT NOT NULL,
            payload TEXT NOT NULL, PRIMARY KEY (version, target_date)
        )""")


def quality_reasons(pattern):
    m = pattern.get("metrics", {})
    required = ("testHitRate", "trainHitRate", "wilsonLower", "baseline")
    if any(not isinstance(m.get(k), (int, float)) or
           not math.isfinite(m[k]) or not 0 <= m[k] <= 1 for k in required):
        return ["Thiếu thông tin chất lượng cầu"]
    reasons = []
    if pattern.get("occurrences", 0) < RULES["min_occurrences"]:
        reasons.append("Chưa đủ 40 kỳ đối chiếu")
    if m.get("isOverfit") is not False:
        reasons.append("Chưa đạt kiểm tra độ ổn định")
    if m["testHitRate"] < RULES["min_test_rate"]:
        reasons.append("Tỉ lệ ở phần lịch sử kiểm tra dưới 50%")
    if m["testHitRate"] < m["trainHitRate"] - RULES["max_train_test_drop"]:
        reasons.append("Tỉ lệ gần đây giảm quá 10 điểm phần trăm")
    if m["wilsonLower"] <= m["baseline"]:
        reasons.append("Mức trúng thận trọng chưa vượt mốc so sánh")
    return reasons


def choose(patterns):
    candidates = []
    for rank, p in enumerate(patterns, 1):
        nums = sorted(set(p.get("nextPrediction", [])))
        if p.get("currentStreak") != 4 or not 1 <= len(nums) <= 2:
            continue
        if any(not isinstance(n, str) or len(n) != 2 or not n.isascii() or
               not n.isdigit() for n in nums):
            continue
        reasons = quality_reasons(p)
        candidates.append({"rank": rank, "numbers": nums,
                           "pattern_id": p.get("patternId"),
                           "name": p.get("name"), "metrics": p.get("metrics", {}),
                           "occurrences": p.get("occurrences", 0),
                           "reasons": reasons})
    selected = next((p for p in candidates if not p["reasons"]), None)
    return {"rules": RULES, "baseline": candidates[0] if candidates else None,
            "selected": selected, "candidates": candidates,
            "reason": "Có cầu đạt toàn bộ điều kiện" if selected else
                      "Bỏ ngày: không có cầu đạt toàn bộ điều kiện"}


def capture_upcoming(now=None):
    """Only current/next day, with complete contiguous prior draws and no outcome."""
    injected_now = now is not None
    now = now or datetime.now(VN)
    if now.tzinfo is None:
        raise ValueError("now must include a timezone")
    now = now.astimezone(VN)
    draws = database.get_recent_results(limit=60)
    if len(draws) < 60:
        return "insufficient_history"
    latest = datetime.strptime(draws[0]["draw_date"], "%Y-%m-%d").date()
    target = latest + timedelta(days=1)
    if target not in (now.date(), now.date() + timedelta(days=1)):
        return "stale_history"
    cutoff = datetime.combine(target, datetime.min.time(), tzinfo=VN).replace(hour=18)
    if now >= cutoff or database.get_result_by_date(target.isoformat()):
        return "closed"
    with closing(database.get_connection()) as conn, conn:
        if conn.execute("SELECT 1 FROM quality_trial_snapshots WHERE version=? AND target_date=?",
                        (VERSION, target.isoformat())).fetchone():
            return "already_saved"
    for i, draw in enumerate(draws):
        if draw["draw_date"] != (latest - timedelta(days=i)).isoformat():
            return "missing_draw"
        nums = draw.get("loto_2digit", [])
        if len(nums) != 27 or any(not isinstance(n, str) or len(n) != 2 or
                                  not n.isascii() or not n.isdigit() for n in nums):
            return "incomplete_draw"
    scan = PatternMiner(build_dataset_snapshot(draws)).auto_discover(
        min_occurrences=10, min_confidence=0.40, min_streak=0,
        exact_streak=4, target_type_str="loto_2digit", day_offset=1, top_n=50)
    payload = choose(scan.get("patterns", []))
    # Check the clock again after computation; do not cross the cutoff while mining.
    stamp = now if injected_now else datetime.now(VN)
    if stamp >= cutoff:
        return "closed"
    with closing(database.get_connection()) as conn, conn:
        # Serialize with result writers and freeze the first decision, including skips.
        conn.execute("BEGIN IMMEDIATE")
        stamp = now if injected_now else datetime.now(VN)
        if stamp >= cutoff:
            return "closed"
        if conn.execute("SELECT 1 FROM xsmb_results WHERE draw_date=?",
                        (target.isoformat(),)).fetchone():
            return "closed"
        conn.execute("INSERT OR IGNORE INTO quality_trial_snapshots VALUES (?, ?, ?, ?, ?)",
                     (VERSION, target.isoformat(), latest.isoformat(), stamp.isoformat(),
                      json.dumps(payload, ensure_ascii=False)))
    return "saved"


def evaluate(pick, target, actual):
    if pick is None:
        return {"status": "skip", "numbers": [], "hit": None, "hits": 0, "days_used": 0}
    nums = pick["numbers"]
    d2 = (datetime.strptime(target, "%Y-%m-%d").date() + timedelta(days=1)).isoformat()
    first, second = actual.get(target), actual.get(d2)
    # Require both days even if day 1 won: all comparisons have the same maturity.
    if first is None or second is None:
        return {"status": "pending", "numbers": nums, "hit": None, "hits": 0, "days_used": 0}
    count1 = sum(first.count(n) for n in nums)
    count2 = sum(second.count(n) for n in nums) if not count1 else 0
    return {"status": "win" if count1 or count2 else "lose", "numbers": nums,
            "hit": bool(count1 or count2), "hits": count1 + count2,
            "day1_hit": bool(count1), "days_used": 1 if count1 else 2}


def summarize(evaluations, stake=None, payout=None):
    settled = [e for e in evaluations if e["status"] in ("win", "lose")]
    wins = sum(e["hit"] for e in settled)
    longest = current = 0
    for e in evaluations:
        if e["status"] == "lose":
            current += 1
            longest = max(longest, current)
        elif e["status"] == "win":
            current = 0
    result = {"selected": sum(e["status"] != "skip" for e in evaluations),
              "skipped": sum(e["status"] == "skip" for e in evaluations),
              "pending": sum(e["status"] == "pending" for e in evaluations),
              "completed": len(settled), "wins": wins,
              "hit_rate": round(100 * wins / len(settled), 1) if settled else None,
              "max_miss_streak": longest,
              "single_windows": sum(len(e["numbers"]) == 1 for e in settled),
              "pair_windows": sum(len(e["numbers"]) == 2 for e in settled)}
    if stake is not None and payout is not None:
        cost = sum(len(e["numbers"]) * e["days_used"] * stake for e in settled)
        returned = sum(e["hits"] * payout for e in settled)
        result["money"] = {"cost": cost, "returned": returned, "net": returned - cost}
    return result


def report(stake=None, payout=None):
    for value in (stake, payout):
        if value is not None and (not math.isfinite(value) or value <= 0 or value > 1e12):
            raise ValueError("Mức tiền phải lớn hơn 0 và không quá 1.000 tỷ")
    if (stake is None) != (payout is None):
        raise ValueError("Cần nhập cả tiền mỗi số mỗi ngày và tiền nhận mỗi nháy")
    with closing(database.get_connection()) as conn, conn:
        saved = conn.execute("SELECT * FROM quality_trial_snapshots WHERE version=? ORDER BY target_date",
                             (VERSION,)).fetchall()
    actual = {r["draw_date"]: r["loto_2digit"] for r in database.get_recent_results(limit="all")
              if len(r.get("loto_2digit", [])) == 27}
    rows = []
    for s in saved:
        p = json.loads(s["payload"])
        rows.append({"target_date": s["target_date"], "created_at": s["created_at"],
                     "source_date": s["source_date"], "decision": p,
                     "filtered": evaluate(p["selected"], s["target_date"], actual),
                     "baseline": evaluate(p["baseline"], s["target_date"], actual)})
    selected_rows = [r for r in rows if r["filtered"]["status"] != "skip"]
    return {"version": VERSION, "rules": RULES, "total_days": len(rows),
            "filtered": summarize([r["filtered"] for r in rows], stake, payout),
            "baseline": summarize([r["baseline"] for r in rows], stake, payout),
            "baseline_same_days": summarize([r["baseline"] for r in selected_rows], stake, payout),
            "rows": list(reversed(rows))}
