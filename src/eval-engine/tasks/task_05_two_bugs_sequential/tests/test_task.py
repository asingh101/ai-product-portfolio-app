import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import calculate_grade


def test_empty_is_f():
    assert calculate_grade([]) == 'F'


def test_grade_a():
    assert calculate_grade([95, 90, 100]) == 'A'


def test_grade_b():
    assert calculate_grade([85, 80, 82]) == 'B'


def test_grade_c():
    assert calculate_grade([72, 75, 70]) == 'C'


def test_grade_d_exact():
    assert calculate_grade([60]) == 'D'


def test_grade_f():
    assert calculate_grade([50, 55, 45]) == 'F'
