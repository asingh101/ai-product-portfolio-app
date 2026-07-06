import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from starter.module import capitalize_words


def test_basic():
    assert capitalize_words("hello world") == "Hello World"


def test_already_capitalized():
    assert capitalize_words("Hello World") == "Hello World"


def test_multiple_spaces():
    assert capitalize_words("foo  bar") == "Foo  Bar"


def test_with_punctuation():
    assert capitalize_words("hello world!") == "Hello World!"


def test_single_word():
    assert capitalize_words("python") == "Python"
