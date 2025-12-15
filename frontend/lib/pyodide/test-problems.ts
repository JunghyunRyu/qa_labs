/**
 * Pyodide PoC 테스트용 문제 데이터
 *
 * 실제 QA Arena 문제 패턴을 반영한 테스트 케이스들
 */

export interface TestProblem {
  id: string;
  title: string;
  difficulty: 'Very Easy' | 'Easy' | 'Medium' | 'Hard';
  goldenCode: string;
  testCode: string;
  buggyImplementations: Array<{
    id: string;
    code: string;
    bugDescription: string;
  }>;
}

// 문제 1: 리스트 합계 (Very Easy)
export const PROBLEM_SUM_LIST: TestProblem = {
  id: 'sum-list',
  title: '리스트 합계 계산',
  difficulty: 'Very Easy',
  goldenCode: `def sum_list(values: list) -> int:
    """리스트의 모든 요소 합계를 반환합니다."""
    if not values:
        return 0
    return sum(values)
`,
  testCode: `import pytest
from target import sum_list

def test_basic_sum():
    assert sum_list([1, 2, 3]) == 6

def test_empty_list():
    assert sum_list([]) == 0

def test_single_element():
    assert sum_list([5]) == 5

def test_negative_numbers():
    assert sum_list([-1, -2, -3]) == -6

def test_mixed_numbers():
    assert sum_list([1, -1, 2, -2]) == 0
`,
  buggyImplementations: [
    {
      id: 'sum-list-bug1',
      code: `def sum_list(values: list) -> int:
    """리스트의 모든 요소 합계를 반환합니다."""
    if not values:
        return 0
    return sum(values) + 1  # BUG: 항상 1을 더함
`,
      bugDescription: '항상 결과에 1을 더함',
    },
    {
      id: 'sum-list-bug2',
      code: `def sum_list(values: list) -> int:
    """리스트의 모든 요소 합계를 반환합니다."""
    if not values:
        return 1  # BUG: 빈 리스트일 때 1 반환
    return sum(values)
`,
      bugDescription: '빈 리스트일 때 1 반환',
    },
    {
      id: 'sum-list-bug3',
      code: `def sum_list(values: list) -> int:
    """리스트의 모든 요소 합계를 반환합니다."""
    return sum(values[1:])  # BUG: 첫 번째 요소 제외
`,
      bugDescription: '첫 번째 요소를 제외하고 합산',
    },
  ],
};

// 문제 2: 문자열 뒤집기 (Easy)
export const PROBLEM_REVERSE_STRING: TestProblem = {
  id: 'reverse-string',
  title: '문자열 뒤집기',
  difficulty: 'Easy',
  goldenCode: `def reverse_string(s: str) -> str:
    """문자열을 뒤집어 반환합니다."""
    if s is None:
        raise ValueError("Input cannot be None")
    return s[::-1]
`,
  testCode: `import pytest
from target import reverse_string

def test_basic_reverse():
    assert reverse_string("hello") == "olleh"

def test_empty_string():
    assert reverse_string("") == ""

def test_single_char():
    assert reverse_string("a") == "a"

def test_palindrome():
    assert reverse_string("radar") == "radar"

def test_with_spaces():
    assert reverse_string("hello world") == "dlrow olleh"

def test_none_input():
    with pytest.raises(ValueError):
        reverse_string(None)
`,
  buggyImplementations: [
    {
      id: 'reverse-bug1',
      code: `def reverse_string(s: str) -> str:
    """문자열을 뒤집어 반환합니다."""
    if s is None:
        raise ValueError("Input cannot be None")
    return s[:-1][::-1]  # BUG: 마지막 문자 누락
`,
      bugDescription: '마지막 문자를 누락시킴',
    },
    {
      id: 'reverse-bug2',
      code: `def reverse_string(s: str) -> str:
    """문자열을 뒤집어 반환합니다."""
    if s is None:
        return ""  # BUG: None일 때 예외 발생 안 함
    return s[::-1]
`,
      bugDescription: 'None 입력 시 예외를 발생시키지 않음',
    },
    {
      id: 'reverse-bug3',
      code: `def reverse_string(s: str) -> str:
    """문자열을 뒤집어 반환합니다."""
    if s is None:
        raise ValueError("Input cannot be None")
    if len(s) <= 1:
        return ""  # BUG: 빈 문자열/단일 문자 처리 오류
    return s[::-1]
`,
      bugDescription: '빈 문자열/단일 문자 처리 오류',
    },
  ],
};

// 문제 3: 최대값 찾기 (Easy)
export const PROBLEM_FIND_MAX: TestProblem = {
  id: 'find-max',
  title: '리스트에서 최대값 찾기',
  difficulty: 'Easy',
  goldenCode: `def find_max(numbers: list) -> int:
    """리스트에서 최대값을 찾아 반환합니다."""
    if not numbers:
        raise ValueError("List cannot be empty")
    return max(numbers)
`,
  testCode: `import pytest
from target import find_max

def test_basic_max():
    assert find_max([1, 5, 3, 9, 2]) == 9

def test_single_element():
    assert find_max([42]) == 42

def test_all_same():
    assert find_max([7, 7, 7]) == 7

def test_negative_numbers():
    assert find_max([-5, -1, -10]) == -1

def test_mixed_numbers():
    assert find_max([-3, 0, 5, -1]) == 5

def test_empty_list():
    with pytest.raises(ValueError):
        find_max([])
`,
  buggyImplementations: [
    {
      id: 'max-bug1',
      code: `def find_max(numbers: list) -> int:
    """리스트에서 최대값을 찾아 반환합니다."""
    if not numbers:
        raise ValueError("List cannot be empty")
    return numbers[0]  # BUG: 항상 첫 번째 요소 반환
`,
      bugDescription: '항상 첫 번째 요소를 반환',
    },
    {
      id: 'max-bug2',
      code: `def find_max(numbers: list) -> int:
    """리스트에서 최대값을 찾아 반환합니다."""
    if not numbers:
        return 0  # BUG: 빈 리스트일 때 예외 발생 안 함
    return max(numbers)
`,
      bugDescription: '빈 리스트일 때 예외를 발생시키지 않음',
    },
    {
      id: 'max-bug3',
      code: `def find_max(numbers: list) -> int:
    """리스트에서 최대값을 찾아 반환합니다."""
    if not numbers:
        raise ValueError("List cannot be empty")
    result = numbers[0]
    for n in numbers:
        if n > result:
            result = n
    return result - 1  # BUG: 결과에서 1을 뺌
`,
      bugDescription: '최대값에서 1을 뺀 값 반환',
    },
  ],
};

// 문제 4: 이메일 검증 (Medium)
export const PROBLEM_VALIDATE_EMAIL: TestProblem = {
  id: 'validate-email',
  title: '이메일 주소 검증',
  difficulty: 'Medium',
  goldenCode: `import re

def validate_email(email: str) -> bool:
    """이메일 주소의 유효성을 검증합니다."""
    if not email or not isinstance(email, str):
        return False

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
`,
  testCode: `import pytest
from target import validate_email

def test_valid_email():
    assert validate_email("user@example.com") == True

def test_valid_email_with_subdomain():
    assert validate_email("user@mail.example.com") == True

def test_valid_email_with_plus():
    assert validate_email("user+tag@example.com") == True

def test_invalid_no_at():
    assert validate_email("userexample.com") == False

def test_invalid_no_domain():
    assert validate_email("user@") == False

def test_invalid_no_tld():
    assert validate_email("user@example") == False

def test_empty_string():
    assert validate_email("") == False

def test_none_input():
    assert validate_email(None) == False

def test_invalid_special_chars():
    assert validate_email("user<>@example.com") == False
`,
  buggyImplementations: [
    {
      id: 'email-bug1',
      code: `import re

def validate_email(email: str) -> bool:
    """이메일 주소의 유효성을 검증합니다."""
    if not email or not isinstance(email, str):
        return False

    return '@' in email  # BUG: @ 문자만 확인
`,
      bugDescription: '@ 문자 존재 여부만 확인',
    },
    {
      id: 'email-bug2',
      code: `import re

def validate_email(email: str) -> bool:
    """이메일 주소의 유효성을 검증합니다."""
    if not email or not isinstance(email, str):
        return True  # BUG: None/빈 문자열일 때 True 반환

    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
`,
      bugDescription: 'None/빈 문자열일 때 True 반환',
    },
    {
      id: 'email-bug3',
      code: `import re

def validate_email(email: str) -> bool:
    """이메일 주소의 유효성을 검증합니다."""
    if not email or not isinstance(email, str):
        return False

    pattern = r'^[a-zA-Z0-9]+@[a-zA-Z0-9]+\\.[a-zA-Z]{2,}$'  # BUG: ._%+- 문자 누락
    return bool(re.match(pattern, email))
`,
      bugDescription: '특수문자(._%+-)를 허용하지 않음',
    },
  ],
};

// 문제 5: 팩토리얼 계산 (Medium)
export const PROBLEM_FACTORIAL: TestProblem = {
  id: 'factorial',
  title: '팩토리얼 계산',
  difficulty: 'Medium',
  goldenCode: `def factorial(n: int) -> int:
    """n의 팩토리얼을 계산합니다."""
    if not isinstance(n, int):
        raise TypeError("Input must be an integer")
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n <= 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
`,
  testCode: `import pytest
from target import factorial

def test_factorial_zero():
    assert factorial(0) == 1

def test_factorial_one():
    assert factorial(1) == 1

def test_factorial_five():
    assert factorial(5) == 120

def test_factorial_ten():
    assert factorial(10) == 3628800

def test_negative_number():
    with pytest.raises(ValueError):
        factorial(-1)

def test_non_integer():
    with pytest.raises(TypeError):
        factorial(3.5)
`,
  buggyImplementations: [
    {
      id: 'factorial-bug1',
      code: `def factorial(n: int) -> int:
    """n의 팩토리얼을 계산합니다."""
    if not isinstance(n, int):
        raise TypeError("Input must be an integer")
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers")
    if n <= 1:
        return 1
    result = 1
    for i in range(2, n):  # BUG: n 미포함
        result *= i
    return result
`,
      bugDescription: 'n을 포함하지 않고 계산',
    },
    {
      id: 'factorial-bug2',
      code: `def factorial(n: int) -> int:
    """n의 팩토리얼을 계산합니다."""
    if not isinstance(n, int):
        raise TypeError("Input must be an integer")
    if n < 0:
        return 0  # BUG: 음수일 때 예외 발생 안 함
    if n <= 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
`,
      bugDescription: '음수 입력 시 예외를 발생시키지 않음',
    },
    {
      id: 'factorial-bug3',
      code: `def factorial(n: int) -> int:
    """n의 팩토리얼을 계산합니다."""
    if n < 0:  # BUG: 타입 체크 누락
        raise ValueError("Factorial is not defined for negative numbers")
    if n <= 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
`,
      bugDescription: '정수 타입 체크 누락',
    },
  ],
};

// 모든 테스트 문제 목록
export const ALL_TEST_PROBLEMS: TestProblem[] = [
  PROBLEM_SUM_LIST,
  PROBLEM_REVERSE_STRING,
  PROBLEM_FIND_MAX,
  PROBLEM_VALIDATE_EMAIL,
  PROBLEM_FACTORIAL,
];
