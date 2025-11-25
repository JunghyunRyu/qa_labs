"""Sample user test code for testing."""

import pytest
from target import sum_list


def test_sum_list_basic():
    """기본적인 양수 리스트 테스트."""
    assert sum_list([1, 2, 3]) == 6
    assert sum_list([10, 20, 30]) == 60


def test_sum_list_empty():
    """빈 리스트 테스트."""
    assert sum_list([]) == 0


def test_sum_list_negative():
    """음수가 포함된 리스트 테스트."""
    assert sum_list([-1, 1, 2]) == 2
    assert sum_list([-5, -3, -2]) == -10


def test_sum_list_single():
    """단일 요소 리스트 테스트."""
    assert sum_list([5]) == 5
    assert sum_list([0]) == 0

