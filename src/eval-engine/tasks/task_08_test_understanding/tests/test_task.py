import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import merge_sorted


def test_equal_length():
    assert merge_sorted([1, 3, 5], [2, 4, 6]) == [1, 2, 3, 4, 5, 6]


def test_unequal_length():
    assert merge_sorted([1, 2], [3, 4, 5]) == [1, 2, 3, 4, 5]


def test_first_empty():
    assert merge_sorted([], [1, 2, 3]) == [1, 2, 3]


def test_second_empty():
    assert merge_sorted([1, 2, 3], []) == [1, 2, 3]


def test_interleaved():
    assert merge_sorted([1, 4, 7], [2, 5]) == [1, 2, 4, 5, 7]
