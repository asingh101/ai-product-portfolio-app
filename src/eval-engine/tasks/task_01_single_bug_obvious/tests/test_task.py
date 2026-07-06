import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import sum_list


def test_sum_empty():
    assert sum_list([]) == 0


def test_sum_single():
    assert sum_list([5]) == 5


def test_sum_positive():
    assert sum_list([1, 2, 3, 4, 5]) == 15


def test_sum_negative():
    assert sum_list([-1, -2, 3]) == 0


def test_sum_mixed():
    assert sum_list([10, -5, 3, -8, 2]) == 2
