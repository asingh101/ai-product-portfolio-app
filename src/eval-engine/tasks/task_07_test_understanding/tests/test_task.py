import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import filter_and_double


def test_includes_threshold_value():
    # Items equal to threshold ARE included (>= not >)
    assert filter_and_double([1, 5, 3, 5, 2], 5) == [10, 10]


def test_above_threshold():
    assert filter_and_double([1, 2, 3, 6, 7], 5) == [12, 14]


def test_none_qualify():
    assert filter_and_double([1, 2, 3], 10) == []


def test_all_qualify():
    assert filter_and_double([4, 5, 6], 4) == [8, 10, 12]


def test_empty_input():
    assert filter_and_double([], 3) == []
