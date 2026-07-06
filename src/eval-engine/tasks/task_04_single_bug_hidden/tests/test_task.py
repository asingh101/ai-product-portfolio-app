import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import remove_duplicates


def test_no_duplicates():
    assert remove_duplicates([1, 2, 3]) == [1, 2, 3]


def test_preserves_order():
    assert remove_duplicates([3, 1, 2, 1, 3]) == [3, 1, 2]


def test_all_duplicates():
    assert remove_duplicates([5, 5, 5]) == [5]


def test_empty():
    assert remove_duplicates([]) == []


def test_strings():
    assert remove_duplicates(["b", "a", "b", "c", "a"]) == ["b", "a", "c"]
