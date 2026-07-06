import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import parse_csv_line


def test_basic():
    assert parse_csv_line("a,b,c") == ["a", "b", "c"]


def test_quoted_field_with_comma():
    assert parse_csv_line('"hello, world",foo') == ["hello, world", "foo"]


def test_empty_last_field():
    assert parse_csv_line("a,b,") == ["a", "b", ""]


def test_empty_middle_field():
    assert parse_csv_line("a,,c") == ["a", "", "c"]


def test_whitespace_stripping():
    assert parse_csv_line(" a , b , c ") == ["a", "b", "c"]
