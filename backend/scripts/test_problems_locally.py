#!/usr/bin/env python3
"""로컬 환경에서 문제를 검증하는 스크립트.

Docker 없이 직접 pytest를 실행하여 빠르게 문제를 검증합니다.
"""

import argparse
import subprocess
import sys
import time
from pathlib import Path
from typing import Dict, Any, List
from multiprocessing import Pool, cpu_count

# 스크립트 디렉토리를 Python path에 추가
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent))

from scripts.validation_utils import (
    ProblemLoader,
    TestEnvironment,
    ResultCollector,
    ProgressReporter,
    DEFAULT_TIMEOUT,
    ensure_results_dir,
)


def run_pytest(
    test_dir: Path,
    timeout: int = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    """
    pytest를 실행하고 결과를 반환합니다.

    Args:
        test_dir: 테스트 디렉토리 경로
        timeout: 타임아웃 (초)

    Returns:
        실행 결과 딕셔너리
    """
    start_time = time.time()

    # pytest 명령어
    cmd = [
        sys.executable, "-m", "pytest",
        "-q",  # Quiet mode
        "--disable-warnings",
        "--maxfail=1",  # 첫 실패 후 중지
        "--ignore=target.py",  # target.py는 테스트로 수집 안 함
        "test_user.py",
    ]

    try:
        result = subprocess.run(
            cmd,
            cwd=test_dir,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",  # 인코딩 오류 처리
        )

        execution_time = time.time() - start_time

        return {
            "success": result.returncode == 0,
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "execution_time": execution_time,
        }

    except subprocess.TimeoutExpired:
        execution_time = time.time() - start_time
        return {
            "success": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": "Test execution timed out",
            "execution_time": execution_time,
        }

    except Exception as e:
        execution_time = time.time() - start_time
        return {
            "success": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": f"Unexpected error: {str(e)}",
            "execution_time": execution_time,
        }


def test_golden_code(
    problem: Dict[str, Any],
    timeout: int = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    """
    Golden code를 테스트합니다.

    Args:
        problem: 문제 데이터
        timeout: 타임아웃

    Returns:
        Golden code 테스트 결과
    """
    golden_code = problem.get("golden_code", "")
    test_code = problem.get("initial_test_template", "")

    with TestEnvironment(golden_code, test_code) as temp_dir:
        result = run_pytest(temp_dir, timeout)

    # 추가 정보
    result["passed"] = result["success"] and result["exit_code"] == 0

    return result


def test_mutants(
    problem: Dict[str, Any],
    timeout: int = DEFAULT_TIMEOUT,
) -> List[Dict[str, Any]]:
    """
    Mutants를 테스트합니다.

    Args:
        problem: 문제 데이터
        timeout: 타임아웃

    Returns:
        Mutant 테스트 결과 리스트
    """
    test_code = problem.get("initial_test_template", "")
    buggy_implementations = problem.get("buggy_implementations", [])

    mutant_results = []

    for idx, mutant in enumerate(buggy_implementations):
        buggy_code = mutant.get("buggy_code", "")
        bug_description = mutant.get("bug_description", "")
        weight = mutant.get("weight", 1)

        with TestEnvironment(buggy_code, test_code) as temp_dir:
            result = run_pytest(temp_dir, timeout)

        # Mutant가 "killed" 되었는지 판정
        # 테스트가 실패했으면 mutant를 잡은 것
        any_test_failed = not result["success"] and result["exit_code"] != -1
        killed = any_test_failed

        mutant_results.append({
            "mutant_index": idx,
            "bug_description": bug_description,
            "weight": weight,
            "killed": killed,
            "exit_code": result["exit_code"],
            "execution_time": result["execution_time"],
            "stdout": result["stdout"],
            "stderr": result["stderr"],
        })

    return mutant_results


def validate_problem(
    problem: Dict[str, Any],
    timeout: int = DEFAULT_TIMEOUT,
) -> Dict[str, Any]:
    """
    단일 문제를 검증합니다.

    Args:
        problem: 문제 데이터
        timeout: 타임아웃

    Returns:
        검증 결과 딕셔너리
    """
    problem_id = problem.get("problem_id", "Unknown")
    errors = []

    try:
        # Step 1: Golden code 테스트
        golden_result = test_golden_code(problem, timeout)

        # Golden code 실패 시 즉시 FAIL 반환
        if not golden_result["passed"]:
            return {
                "problem_id": problem_id,
                "status": "FAIL",
                "golden_test": golden_result,
                "mutants": [],
                "mutant_kill_rate": 0.0,
                "total_weight_killed": 0,
                "total_weight": 0,
                "errors": ["Golden test failed"],
            }

        # Step 2: Mutants 테스트
        mutant_results = test_mutants(problem, timeout)

        # Step 3: Kill rate 계산
        total_weight = sum(m["weight"] for m in mutant_results)
        weight_killed = sum(
            m["weight"] for m in mutant_results if m["killed"]
        )
        kill_rate = weight_killed / total_weight if total_weight > 0 else 0.0

        # 결과
        status = "PASS"  # Golden 통과하면 일단 PASS (mutant kill rate는 별도)

        return {
            "problem_id": problem_id,
            "status": status,
            "golden_test": golden_result,
            "mutants": mutant_results,
            "mutant_kill_rate": kill_rate,
            "total_weight_killed": weight_killed,
            "total_weight": total_weight,
            "errors": errors,
        }

    except Exception as e:
        return {
            "problem_id": problem_id,
            "status": "FAIL",
            "golden_test": {},
            "mutants": [],
            "mutant_kill_rate": 0.0,
            "total_weight_killed": 0,
            "total_weight": 0,
            "errors": [f"Unexpected error: {str(e)}"],
        }


def validate_problem_wrapper(args):
    """
    multiprocessing용 래퍼 함수.

    Args:
        args: (problem, timeout) 튜플

    Returns:
        검증 결과
    """
    problem, timeout = args
    return validate_problem(problem, timeout)


def main():
    """메인 함수."""
    parser = argparse.ArgumentParser(
        description="로컬 환경에서 문제를 검증합니다 (빠른 검증)"
    )
    parser.add_argument(
        "--only",
        nargs="+",
        metavar="PROBLEM_ID",
        help="특정 문제만 검증 (예: --only E01 M01 H02)",
    )
    parser.add_argument(
        "--parallel",
        action="store_true",
        help="병렬 실행 활성화",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=cpu_count(),
        help=f"병렬 실행 워커 수 (기본값: {cpu_count()})",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help=f"pytest 타임아웃 (초, 기본값: {DEFAULT_TIMEOUT})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="결과 JSON 파일 경로 (기본값: 자동 생성)",
    )

    args = parser.parse_args()

    # results 디렉토리 확인
    ensure_results_dir()

    # 문제 로드
    print("Loading problems...")
    try:
        problems = ProblemLoader.load_all_problems(filter_ids=args.only)
    except Exception as e:
        print(f"[ERROR] Failed to load problems: {e}")
        return 1

    if not problems:
        print("[ERROR] No problems to validate")
        return 1

    print(f"Loaded {len(problems)} problem(s)")
    print(f"Timeout: {args.timeout}s")
    print(f"Parallel: {'Yes' if args.parallel else 'No'}")
    if args.parallel:
        print(f"Workers: {args.workers}")
    print()

    # 결과 수집기
    collector = ResultCollector(environment="local")

    # 검증 실행
    if args.parallel:
        # 병렬 실행
        print(f"Running validation in parallel ({args.workers} workers)...")
        with Pool(args.workers) as pool:
            problem_args = [(p, args.timeout) for p in problems]
            results = pool.map(validate_problem_wrapper, problem_args)

        for result in results:
            collector.add_result(result)

    else:
        # 순차 실행 (진행률 표시)
        with ProgressReporter(len(problems), desc="Validating") as progress:
            for problem in problems:
                problem_id = problem.get("problem_id", "Unknown")
                result = validate_problem(problem, args.timeout)
                collector.add_result(result)
                progress.update(message=f"{problem_id}: {result['status']}")

    # 결과 저장
    output_path = collector.save_to_json(args.output)
    print(f"\nResults saved to: {output_path}")

    # 요약 출력
    all_results = collector.get_all_results()
    print("\n" + "=" * 70)
    print("VALIDATION SUMMARY")
    print("=" * 70)
    print(f"Total Problems:  {all_results['total_problems']}")
    print(f"Passed:          {all_results['passed']}")
    print(f"Failed:          {all_results['failed']}")

    # Kill rate 통계
    kill_rates = [
        p["mutant_kill_rate"]
        for p in all_results["problems"]
        if p["status"] == "PASS"
    ]
    if kill_rates:
        avg_kill_rate = sum(kill_rates) / len(kill_rates)
        print(f"Avg Kill Rate:   {avg_kill_rate:.1%}")

    print("=" * 70)

    # 실패한 문제 출력
    failed_problems = [
        p for p in all_results["problems"] if p["status"] == "FAIL"
    ]
    if failed_problems:
        print("\nFailed Problems:")
        for p in failed_problems:
            print(f"  - {p['problem_id']}: {', '.join(p['errors'])}")

    # 종료 코드
    return 0 if all_results["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
