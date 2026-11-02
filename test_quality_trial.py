"""Tests isolate the DB; never alter tracked history or contact the crawler."""
import gc
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

os.environ['XSMB_DISABLE_BACKGROUND_SYNC'] = '1'
import config
import database
from pattern_engine import trial


def pattern(rank=1, **metrics):
    return {"patternId": str(rank), "currentStreak": 4, "occurrences": 59,
            "nextPrediction": ["12", "21"], "name": "Test",
            "metrics": {"testHitRate": .65, "trainHitRate": .60,
                        "wilsonLower": .50, "baseline": .4492,
                        "isOverfit": False, **metrics}}


class QualityTrialTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_path = config.DB_PATH
        config.DB_PATH = os.path.join(self.temp.name, 'test.db')
        database.init_db()
        trial.init_table()

    def tearDown(self):
        config.DB_PATH = self.old_path
        gc.collect()
        self.temp.cleanup()

    def draws(self, target='2026-11-02'):
        day = datetime.fromisoformat(target).date()
        return [{"draw_date": (day - timedelta(days=i + 1)).isoformat(),
                 "loto_2digit": ['01'] * 27} for i in range(60)]

    def capture(self, now, draws=None, patterns=None):
        with patch.object(database, 'get_recent_results', return_value=draws or self.draws()), \
             patch.object(database, 'get_result_by_date', return_value=None), \
             patch.object(trial, 'build_dataset_snapshot'), \
             patch.object(trial, 'PatternMiner') as miner:
            miner.return_value.auto_discover.return_value = {"patterns": patterns if patterns is not None else [pattern()]}
            return trial.capture_upcoming(now)

    def test_selects_first_qualified_and_explains_rejection(self):
        p = trial.choose([pattern(1, testHitRate=.4), pattern(2)])
        self.assertEqual(p['baseline']['rank'], 1)
        self.assertEqual(p['selected']['rank'], 2)
        self.assertTrue(p['candidates'][0]['reasons'])

    def test_no_candidate_is_skip_and_bad_metrics_fail_closed(self):
        for kwargs in ({'isOverfit': True}, {'wilsonLower': .4},
                       {'testHitRate': float('nan')}, {'baseline': None},
                       {'trainHitRate': .9, 'testHitRate': .6}):
            self.assertIsNone(trial.choose([pattern(**kwargs)])['selected'])
        self.assertIsNone(trial.choose([])['selected'])

    def test_pre_draw_freeze_including_skips(self):
        now = datetime(2026, 11, 2, 17, 59, tzinfo=trial.VN)
        self.assertEqual(self.capture(now, patterns=[pattern(testHitRate=.4)]), 'saved')
        self.assertEqual(self.capture(now, patterns=[pattern()]), 'already_saved')
        data = trial.report()
        self.assertEqual(data['total_days'], 1)
        self.assertEqual(data['filtered']['skipped'], 1)
        self.assertEqual(data['baseline']['pending'], 1)

    def test_cutoff_stale_missing_partial_history(self):
        self.assertEqual(self.capture(datetime(2026, 11, 2, 18, tzinfo=trial.VN)), 'closed')
        self.assertEqual(self.capture(datetime(2026, 11, 3, 10, tzinfo=trial.VN)), 'stale_history')
        draws = self.draws(); draws[10]['draw_date'] = '2000-01-01'
        self.assertEqual(self.capture(datetime(2026, 11, 2, 10, tzinfo=trial.VN), draws), 'missing_draw')
        draws = self.draws(); draws[0]['loto_2digit'] = ['01'] * 26
        self.assertEqual(self.capture(datetime(2026, 11, 2, 10, tzinfo=trial.VN), draws), 'incomplete_draw')

    def test_utc_clock_uses_vietnam_cutoff(self):
        self.assertEqual(self.capture(datetime(2026, 11, 2, 11, tzinfo=timezone.utc)), 'closed')
        with self.assertRaises(ValueError):
            self.capture(datetime(2026, 11, 2, 10))

    def test_source_draws_do_not_include_target(self):
        self.assertEqual(self.capture(datetime(2026, 11, 1, 20, tzinfo=trial.VN)), 'saved')
        row = trial.report()['rows'][0]
        self.assertEqual(row['target_date'], '2026-11-02')
        self.assertEqual(row['source_date'], '2026-11-01')

    def test_day1_stop_multiple_hits_and_pending_maturity(self):
        pick = {'numbers': ['12', '21']}
        first = ['12', '12', '21']
        self.assertEqual(trial.evaluate(pick, '2026-11-02', {'2026-11-02': first})['status'], 'pending')
        ev = trial.evaluate(pick, '2026-11-02', {'2026-11-02': first, '2026-11-03': ['21']})
        self.assertEqual(ev['hits'], 3)
        self.assertEqual(ev['days_used'], 1)
        self.assertEqual(trial.summarize([ev], 10, 70)['money'], {'cost': 20, 'returned': 210, 'net': 190})

    def test_day2_rescue_cost_and_loss_streak(self):
        p = {'numbers': ['12', '21']}
        ev = trial.evaluate(p, '2026-11-02', {'2026-11-02': [], '2026-11-03': ['12']})
        self.assertEqual(ev['days_used'], 2)
        self.assertFalse(ev['day1_hit'])
        loss = trial.evaluate(p, '2026-11-02', {'2026-11-02': [], '2026-11-03': []})
        skip = trial.evaluate(None, '2026-11-02', {})
        s = trial.summarize([loss, skip, loss, ev], 10, 70)
        self.assertEqual(s['max_miss_streak'], 2)
        self.assertEqual(s['money']['net'], -50)
        self.assertEqual(s['completed'], 3)

    def test_money_validation(self):
        for args in ((0, 70), (10, None), (float('inf'), 70), (10, -1)):
            with self.assertRaises(ValueError):
                trial.report(*args)

    def test_outcome_arriving_during_scan_cannot_create_record(self):
        with patch.object(database, 'get_recent_results', return_value=self.draws()), \
             patch.object(database, 'get_result_by_date', return_value=None), \
             patch.object(trial, 'build_dataset_snapshot'), \
             patch.object(trial, 'PatternMiner') as miner:
            def scan(**kwargs):
                with database.get_connection() as conn:
                    conn.execute("INSERT INTO xsmb_results(draw_date,date_display) VALUES ('2026-11-02','02/11/2026')")
                return {'patterns': [pattern()]}
            miner.return_value.auto_discover.side_effect = scan
            self.assertEqual(trial.capture_upcoming(datetime(2026, 11, 2, 10, tzinfo=trial.VN)), 'closed')
            self.assertEqual(trial.report()['total_days'], 0)

    def test_report_matures_without_rewriting_decision_and_matches_days(self):
        now = datetime(2026, 11, 2, 10, tzinfo=trial.VN)
        self.capture(now, patterns=[pattern(testHitRate=.4), pattern(2)])
        before = trial.report()['rows'][0]['decision']
        actual = [{'draw_date': '2026-11-02', 'loto_2digit': ['12'] + ['00'] * 26},
                  {'draw_date': '2026-11-03', 'loto_2digit': ['00'] * 27}]
        with patch.object(database, 'get_recent_results', return_value=actual):
            r = trial.report(10, 70)
        self.assertEqual(r['rows'][0]['decision'], before)
        self.assertEqual(r['filtered']['wins'], 1)
        self.assertEqual(r['filtered']['hit_rate'], 100)
        self.assertEqual(r['baseline_same_days']['completed'], 1)
        self.assertEqual(r['filtered']['money']['net'], 50)

    def test_flask_routes_and_template(self):
        import app
        client = app.app.test_client()
        self.assertEqual(client.get('/api/quality-trial').status_code, 200)
        self.assertEqual(client.get('/api/quality-trial?stake=nan&payout=70').status_code, 400)
        self.assertEqual(client.get('/api/quality-trial?stake=10').status_code, 400)
        with patch.object(trial, 'capture_upcoming', return_value='stale_history'):
            self.assertEqual(client.post('/api/quality-trial/capture').json['status'], 'stale_history')
        with patch.object(database, 'get_recent_results', return_value=[]):
            page = client.get('/')
        self.assertEqual(page.status_code, 200)
        self.assertIn('quality-trial', page.get_data(as_text=True))


if __name__ == '__main__':
    unittest.main()
