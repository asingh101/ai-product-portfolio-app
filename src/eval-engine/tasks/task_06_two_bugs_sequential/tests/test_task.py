import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import find_second_largest


def test_all_same_returns_none():
    assert find_second_largest([5, 5, 5]) is None


def test_basic():
    assert find_second_largest([3, 1, 4, 1, 5]) == 4


def test_two_elements():
    assert find_second_largest([10, 20]) == 10


def test_single_returns_none():
    assert find_second_largest([7]) is None


def test_already_sorted():
    assert find_second_largest([1, 2, 3, 4, 5]) == 4
