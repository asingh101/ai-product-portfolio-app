import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import get_max


def test_empty_returns_none():
    assert get_max([]) is None


def test_single_element():
    assert get_max([7]) == 7


def test_basic_max():
    assert get_max([3, 1, 4, 1, 5, 9, 2, 6]) == 9


def test_all_negative():
    assert get_max([-5, -2, -8, -1]) == -1


def test_duplicates():
    assert get_max([4, 4, 4]) == 4
