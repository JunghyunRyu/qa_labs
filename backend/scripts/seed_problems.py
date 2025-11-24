"""Seed script for sample problems."""

import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal
from app.models.problem import Problem
from app.models.buggy_implementation import BuggyImplementation


def seed_problems():
    """Seed sample problems."""
    db: Session = SessionLocal()
    try:
        # Check if problems already exist
        existing_count = db.query(Problem).count()
        if existing_count > 0:
            print(f"Already {existing_count} problems exist. Skipping seed.")
            return

        # Problem 1: Sum List
        problem1 = Problem(
            slug="sum-list",
            title="리스트 합계 계산 함수 테스트",
            description_md="""## 문제 설명

정수 리스트를 입력받아 합을 계산하는 함수 `sum_list`에 대한 테스트를 작성하세요.

### 함수 시그니처
```python
def sum_list(values: list[int]) -> int:
    pass
```

### 요구사항
- 정상적인 양수 리스트에 대한 테스트
- 음수가 포함된 리스트에 대한 테스트
- 빈 리스트에 대한 테스트
- 경계값 테스트 (0 포함, 큰 수 포함)

### 테스트 작성 가이드
pytest를 사용하여 테스트를 작성하세요. `target.py`에서 `sum_list` 함수를 임포트하여 사용합니다.
""",
            function_signature="def sum_list(values: list[int]) -> int:",
            golden_code="""def sum_list(values: list[int]) -> int:
    return sum(values)
""",
            difficulty="Easy",
            skills=["boundary", "negative_values", "empty_input"],
        )
        db.add(problem1)
        db.flush()

        # Buggy implementations for problem1
        buggy1_1 = BuggyImplementation(
            problem_id=problem1.id,
            buggy_code="""def sum_list(values: list[int]) -> int:
    if not values:
        return 0
    return sum(values[1:])  # 첫 번째 요소를 제외하는 버그
""",
            bug_description="빈 리스트는 처리하지만 첫 번째 요소를 제외하는 버그",
            weight=2,
        )
        db.add(buggy1_1)

        buggy1_2 = BuggyImplementation(
            problem_id=problem1.id,
            buggy_code="""def sum_list(values: list[int]) -> int:
    return sum(v for v in values if v > 0)  # 음수를 무시하는 버그
""",
            bug_description="음수를 무시하고 양수만 합산하는 버그",
            weight=3,
        )
        db.add(buggy1_2)

        buggy1_3 = BuggyImplementation(
            problem_id=problem1.id,
            buggy_code="""def sum_list(values: list[int]) -> int:
    if len(values) == 0:
        raise ValueError("Empty list")
    return sum(values)  # 빈 리스트에서 예외 발생
""",
            bug_description="빈 리스트에서 예외를 발생시키는 버그",
            weight=2,
        )
        db.add(buggy1_3)

        # Problem 2: Find Maximum
        problem2 = Problem(
            slug="find-maximum",
            title="최대값 찾기 함수 테스트",
            description_md="""## 문제 설명

정수 리스트에서 최대값을 찾는 함수 `find_maximum`에 대한 테스트를 작성하세요.

### 함수 시그니처
```python
def find_maximum(values: list[int]) -> int:
    pass
```

### 요구사항
- 정상적인 리스트에 대한 테스트
- 음수만 포함된 리스트에 대한 테스트
- 단일 요소 리스트에 대한 테스트
- 빈 리스트에 대한 예외 처리 테스트

### 테스트 작성 가이드
pytest를 사용하여 테스트를 작성하세요. `target.py`에서 `find_maximum` 함수를 임포트하여 사용합니다.
""",
            function_signature="def find_maximum(values: list[int]) -> int:",
            golden_code="""def find_maximum(values: list[int]) -> int:
    if not values:
        raise ValueError("Empty list")
    return max(values)
""",
            difficulty="Medium",
            skills=["boundary", "exception", "negative_values"],
        )
        db.add(problem2)
        db.flush()

        # Buggy implementations for problem2
        buggy2_1 = BuggyImplementation(
            problem_id=problem2.id,
            buggy_code="""def find_maximum(values: list[int]) -> int:
    if not values:
        return 0  # 빈 리스트에서 0을 반환하는 버그
    return max(values)
""",
            bug_description="빈 리스트에서 0을 반환하는 버그 (예외를 발생시켜야 함)",
            weight=3,
        )
        db.add(buggy2_1)

        buggy2_2 = BuggyImplementation(
            problem_id=problem2.id,
            buggy_code="""def find_maximum(values: list[int]) -> int:
    if not values:
        raise ValueError("Empty list")
    return max(v for v in values if v > 0)  # 양수만 고려하는 버그
""",
            bug_description="양수만 고려하여 음수 리스트에서 잘못된 결과 반환",
            weight=2,
        )
        db.add(buggy2_2)

        # Problem 3: Count Even Numbers
        problem3 = Problem(
            slug="count-even-numbers",
            title="짝수 개수 세기 함수 테스트",
            description_md="""## 문제 설명

정수 리스트에서 짝수의 개수를 세는 함수 `count_even_numbers`에 대한 테스트를 작성하세요.

### 함수 시그니처
```python
def count_even_numbers(values: list[int]) -> int:
    pass
```

### 요구사항
- 정상적인 리스트에 대한 테스트
- 홀수만 포함된 리스트에 대한 테스트
- 짝수만 포함된 리스트에 대한 테스트
- 빈 리스트에 대한 테스트
- 0을 포함한 리스트에 대한 테스트 (0은 짝수)

### 테스트 작성 가이드
pytest를 사용하여 테스트를 작성하세요. `target.py`에서 `count_even_numbers` 함수를 임포트하여 사용합니다.
""",
            function_signature="def count_even_numbers(values: list[int]) -> int:",
            golden_code="""def count_even_numbers(values: list[int]) -> int:
    return sum(1 for v in values if v % 2 == 0)
""",
            difficulty="Easy",
            skills=["boundary", "edge_cases", "empty_input"],
        )
        db.add(problem3)
        db.flush()

        # Buggy implementations for problem3
        buggy3_1 = BuggyImplementation(
            problem_id=problem3.id,
            buggy_code="""def count_even_numbers(values: list[int]) -> int:
    return sum(1 for v in values if v % 2 == 0 and v > 0)  # 양수 짝수만 세는 버그
""",
            bug_description="양수 짝수만 세어서 음수 짝수나 0을 무시하는 버그",
            weight=2,
        )
        db.add(buggy3_1)

        buggy3_2 = BuggyImplementation(
            problem_id=problem3.id,
            buggy_code="""def count_even_numbers(values: list[int]) -> int:
    if not values:
        return -1  # 빈 리스트에서 -1을 반환하는 버그
    return sum(1 for v in values if v % 2 == 0)
""",
            bug_description="빈 리스트에서 -1을 반환하는 버그 (0을 반환해야 함)",
            weight=1,
        )
        db.add(buggy3_2)

        db.commit()
        print("Successfully seeded 3 problems with buggy implementations!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding problems: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_problems()

