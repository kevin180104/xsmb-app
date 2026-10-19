import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch
import config
import database
from pattern_engine.service import scan_patterns_service


class PredictionHistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.binding = patch.object(config, 'DB_PATH', str(Path(self.temp.name) / 'history.db'))
        self.binding.start()
        self.addCleanup(self.binding.stop)
        database.init_db()
        for i in range(75):
            day = (date(2025, 12, 1) + timedelta(days=i)).isoformat()
            database.save_top3_snapshot(target_date=day, patterns=[])

    def test_pagination_reaches_all_dates_across_year_boundary(self):
        dates, cursor = [], None
        while True:
            page = database.list_top3_history(before=cursor)
            dates.extend(row['target_date'] for row in page['dates'])
            cursor = page['next_before']
            if not cursor:
                break
        self.assertEqual(len(dates), 75)
        self.assertEqual(len(set(dates)), 75)
        self.assertEqual(dates, sorted(dates, reverse=True))

    def test_range_and_empty_results(self):
        page = database.list_top3_history(start='2025-12-30', end='2026-01-02')
        self.assertEqual(len(page['dates']), 4)
        self.assertEqual(database.list_top3_history(start='2027-01-01')['dates'], [])

    def test_history_never_creates_or_overwrites_predictions(self):
        with database.get_connection() as conn:
            before = [tuple(row) for row in conn.execute('SELECT * FROM daily_top3_snapshots ORDER BY target_date')]
        self.assertEqual(scan_patterns_service(anchor_date='2025-12-01', saved_only=True, force_refresh=True)['status'], 'SUCCESS')
        self.assertEqual(scan_patterns_service(anchor_date='2020-01-01', saved_only=True)['status'], 'NOT_FOUND')
        with database.get_connection() as conn:
            after = [tuple(row) for row in conn.execute('SELECT * FROM daily_top3_snapshots ORDER BY target_date')]
        self.assertEqual(before, after)


if __name__ == '__main__':
    unittest.main()
