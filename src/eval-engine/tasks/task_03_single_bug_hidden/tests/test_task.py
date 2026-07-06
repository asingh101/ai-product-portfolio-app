import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import count_vowels


def test_lowercase():
    assert count_vowels("hello") == 2


def test_uppercase():
    assert count_vowels("AEIOU") == 5


def test_mixed_case():
    assert count_vowels("Python") == 1


def test_empty():
    assert count_vowels("") == 0


def test_no_vowels():
    assert count_vowels("rhythm") == 0
