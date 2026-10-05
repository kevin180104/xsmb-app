# -*- coding: utf-8 -*-
"""
Pattern Engine - Service Layer
Quản lý vòng đời snapshot bộ nhớ đệm (In-memory caching),
xử lý các yêu cầu API và kết nối giữa Flask routes với core algorithms.
"""
from typing import Dict, Any, Optional
import time
import database
from .data_model import build_dataset_snapshot, DatasetSnapshot, ALL_COORDS, COORD_BY_INDEX
from .primitives import RuleSpecification, OperationType, TargetType
from .backtest import backtest_rule, BacktestResult
from .miner import PatternMiner
from .visualizer import generate_visualization_payload

# Bộ nhớ đệm In-memory
_SNAPSHOT_CACHE: Optional[DatasetSnapshot] = None
_CACHE_TIMESTAMP: float = 0.0
_SCAN_RESULTS_CACHE: Dict[str, Any] = {}

def get_cached_snapshot(force_refresh: bool = False, limit_draws: Optional[int] = None) -> DatasetSnapshot:
    """
    Lấy hoặc khởi tạo DatasetSnapshot từ database.
    Tự động tái sử dụng nếu chưa có kỳ quay mới.
    """
    global _SNAPSHOT_CACHE, _CACHE_TIMESTAMP, _SCAN_RESULTS_CACHE
    now = time.time()
    
    # Refresh nếu bị ép buộc hoặc cache đã tồn tại quá 10 phút
    if force_refresh or _SNAPSHOT_CACHE is None or (now - _CACHE_TIMESTAMP > 600):
        draws = database.get_recent_results(limit=1000)
        _SNAPSHOT_CACHE = build_dataset_snapshot(draws)
        _CACHE_TIMESTAMP = now
        _SCAN_RESULTS_CACHE.clear()

    if limit_draws and limit_draws < _SNAPSHOT_CACHE.total_draws:
        # Nếu người dùng muốn giới hạn N ngày (ví dụ 30, 60 ngày)
        draws_slice = _SNAPSHOT_CACHE.draw_records[-limit_draws:]
        return build_dataset_snapshot(draws_slice)

    return _SNAPSHOT_CACHE

def invalidate_pattern_cache():
    """Hủy cache khi có kết quả mới được cập nhật (Section XIV Live Scanner)"""
    global _SNAPSHOT_CACHE, _SCAN_RESULTS_CACHE
    _SNAPSHOT_CACHE = None
    _SCAN_RESULTS_CACHE.clear()

def scan_patterns_service(
    days: str = "60",
    min_occurrences: int = 10,
    min_confidence: float = 0.40,
    min_streak: int = 0,
    target_type: str = "loto_2digit",
    day_offset: int = 1,
    top_n: int = 30
) -> Dict[str, Any]:
    """
    Dịch vụ quét tự động tìm đường cầu.
    """
    limit_draws = None
    if days != "all":
        try:
            limit_draws = int(days)
        except ValueError:
            limit_draws = 60

    cache_key = f"{days}_{min_occurrences}_{min_confidence}_{min_streak}_{target_type}_{day_offset}_{top_n}"
    if cache_key in _SCAN_RESULTS_CACHE:
        return _SCAN_RESULTS_CACHE[cache_key]

    snapshot = get_cached_snapshot(limit_draws=limit_draws)
    miner = PatternMiner(snapshot)
    results = miner.auto_discover(
        min_occurrences=min_occurrences,
        min_confidence=min_confidence,
        min_streak=min_streak,
        target_type_str=target_type,
        day_offset=day_offset,
        top_n=top_n
    )

    _SCAN_RESULTS_CACHE[cache_key] = results
    return results

def get_pattern_visualization_service(
    pos_a: int,
    pos_b: int,
    operation_str: str = "CONCAT_PAIR",
    target_type_str: str = "loto_2digit",
    day_offset: int = 1,
    num_display_draws: int = 8
) -> Dict[str, Any]:
    """
    Dịch vụ tạo dữ liệu trực quan hóa đồ họa SVG cho 1 pattern.
    """
    snapshot = get_cached_snapshot()
    op = OperationType(operation_str)
    target_type = TargetType(target_type_str)
    rule_id = f"P_{op.value}_{pos_a}_{pos_b}"

    rule = RuleSpecification(
        rule_id=rule_id,
        pos_a=pos_a,
        pos_b=pos_b,
        operation=op,
        target_type=target_type,
        day_offset=day_offset
    )

    bt = backtest_rule(snapshot, rule)
    if not bt:
        return {
            "status": "ERROR",
            "message": "Không đủ dữ liệu lịch sử để kiểm thử đường cầu này."
        }

    payload = generate_visualization_payload(
        snapshot=snapshot,
        backtest_res=bt,
        num_display_draws=num_display_draws
    )
    payload["status"] = "SUCCESS"
    return payload
