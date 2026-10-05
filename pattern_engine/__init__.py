# -*- coding: utf-8 -*-
"""
Pattern Engine Package
Công cụ tự động phát hiện, kiểm thử quá khứ (Backtest) và trực quan hóa đường cầu xổ số miền Bắc.
"""
from .data_model import (
    DigitCoord, ALL_COORDS, COORD_BY_INDEX, COORD_BY_LABEL,
    DatasetSnapshot, build_dataset_snapshot, extract_draw_digits
)
from .primitives import (
    RuleSpecification, OperationType, TargetType
)
from .scorer import (
    evaluate_pattern_statistics, calculate_wilson_lower_bound,
    get_baseline_probability, calculate_bayesian_smoothed_rate
)
from .backtest import (
    backtest_rule, BacktestResult, DayEvaluationRecord
)
from .miner import PatternMiner
from .visualizer import generate_visualization_payload

__all__ = [
    "DigitCoord", "ALL_COORDS", "COORD_BY_INDEX", "COORD_BY_LABEL",
    "DatasetSnapshot", "build_dataset_snapshot", "extract_draw_digits",
    "RuleSpecification", "OperationType", "TargetType",
    "evaluate_pattern_statistics", "calculate_wilson_lower_bound",
    "get_baseline_probability", "calculate_bayesian_smoothed_rate",
    "backtest_rule", "BacktestResult", "DayEvaluationRecord",
    "PatternMiner", "generate_visualization_payload"
]
