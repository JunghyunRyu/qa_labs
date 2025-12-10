#!/usr/bin/env python3
"""End-to-End 제출 테스트 스크립트.

EC2 환경의 Judge 시스템을 사용하여 제출 플로우를 테스트합니다.
로컬에서 실행하여 원격 API를 호출합니다.

Usage:
    # 기본 실행 (9개 샘플 문제, 4개 시나리오)
    python backend/scripts/test_submissions_end_to_end.py

    # 특정 문제만 테스트
    python backend/scripts/test_submissions_end_to_end.py --only E01 M01

    # 특정 시나리오만 테스트
    python backend/scripts/test_submissions_end_to_end.py --scenarios strong weak

    # API URL 지정
    python backend/scripts/test_submissions_end_to_end.py --api-url https://qa-arena.qalabs.kr/api/v1

    # 폴링 타임아웃 조정
    python backend/scripts/test_submissions_end_to_end.py --timeout 180
"""

import argparse
import sys
import time
from pathlib import Path
from typing import Dict, List, Any, Optional

# 프로젝트 루트를 path에 추가
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent))

from scripts.validation_utils import (
    ProblemLoader,
    SubmissionClient,
    E2EResultCollector,
    ProgressReporter,
    generate_error_test_code,
    ensure_results_dir,
)


# =============================================================================
# Configuration
# =============================================================================

# 샘플 문제 목록 (난이도별)
SAMPLE_PROBLEMS = [
    "VE01", "VE03",           # Very Easy: 2개
    "E01", "E05", "E10",      # Easy: 3개
    "M01", "M03",             # Medium: 2개
    "H01", "H03",             # Hard: 2개
]

# 테스트 시나리오 정의
SCENARIOS = {
    "strong": {
        "description": "강한 테스트 코드 - 높은 kill rate 기대",
        "expected_status": "SUCCESS",
        "min_score": 70,
    },
    "weak": {
        "description": "약한 테스트 코드 (initial_test_template) - 낮은 kill rate 기대",
        "expected_status": "SUCCESS",
        "min_score": 30,
    },
    "syntax_error": {
        "description": "문법 오류 - ERROR 상태 기대",
        "expected_status": "ERROR",
    },
    "import_error": {
        "description": "Import 오류 - ERROR 상태 기대",
        "expected_status": "ERROR",
    },
}


# =============================================================================
# Test Functions
# =============================================================================

def get_test_code_for_scenario(
    scenario_name: str,
    problem: Dict[str, Any],
) -> str:
    """
    시나리오에 맞는 테스트 코드를 반환합니다.

    Args:
        scenario_name: 시나리오 이름
        problem: 문제 데이터 딕셔너리

    Returns:
        테스트 코드 문자열
    """
    if scenario_name == "strong":
        # strong_test_code가 있으면 사용, 없으면 initial_test_template 사용
        return problem.get("strong_test_code", problem["initial_test_template"])
    elif scenario_name == "weak":
        return problem["initial_test_template"]
    elif scenario_name == "syntax_error":
        return generate_error_test_code("syntax_error")
    elif scenario_name == "import_error":
        return generate_error_test_code("import_error")
    else:
        raise ValueError(f"Unknown scenario: {scenario_name}")


def verify_scenario_result(
    scenario_name: str,
    result: Dict[str, Any],
    expected: Dict[str, Any],
) -> tuple[bool, str]:
    """
    시나리오 결과를 검증합니다.

    Args:
        scenario_name: 시나리오 이름
        result: 제출 결과 딕셔너리
        expected: 예상 결과 딕셔너리

    Returns:
        (passed, reason) 튜플
    """
    actual_status = result.get("status", "UNKNOWN")
    expected_status = expected.get("expected_status")

    # 상태 검증
    if actual_status != expected_status:
        return False, f"Status mismatch: expected {expected_status}, got {actual_status}"

    # SUCCESS인 경우 점수 검증
    if expected_status == "SUCCESS":
        actual_score = result.get("score", 0)
        min_score = expected.get("min_score", 0)

        if actual_score < min_score:
            return False, f"Score too low: expected >= {min_score}, got {actual_score}"

    return True, "OK"


def run_scenario(
    client: SubmissionClient,
    problem: Dict[str, Any],
    db_problem_id: int,
    scenario_name: str,
    scenario_config: Dict[str, Any],
    timeout: int = 120,
) -> Dict[str, Any]:
    """
    단일 시나리오를 실행합니다.

    Args:
        client: SubmissionClient 인스턴스
        problem: 문제 데이터 딕셔너리
        db_problem_id: DB의 문제 ID
        scenario_name: 시나리오 이름
        scenario_config: 시나리오 설정
        timeout: 폴링 타임아웃 (초)

    Returns:
        시나리오 실행 결과
    """
    start_time = time.time()

    # 테스트 코드 준비
    test_code = get_test_code_for_scenario(scenario_name, problem)

    # 제출
    submit_response = client.submit(db_problem_id, test_code)

    if "error" in submit_response:
        return {
            "passed": False,
            "reason": f"Submit failed: {submit_response.get('error')}",
            "result": submit_response,
            "execution_time": time.time() - start_time,
            "test_code": test_code,
        }

    submission_id = submit_response.get("id")
    if not submission_id:
        return {
            "passed": False,
            "reason": "No submission ID in response",
            "result": submit_response,
            "execution_time": time.time() - start_time,
            "test_code": test_code,
        }

    # 결과 폴링
    result = client.get_result(submission_id, timeout=timeout)

    # 검증
    passed, reason = verify_scenario_result(scenario_name, result, scenario_config)

    return {
        "passed": passed,
        "reason": reason,
        "result": result,
        "execution_time": time.time() - start_time,
        "test_code": test_code,
    }


def run_problem_tests(
    client: SubmissionClient,
    problem: Dict[str, Any],
    db_problem_id: int,
    scenarios: List[str],
    collector: E2EResultCollector,
    timeout: int = 120,
) -> Dict[str, Any]:
    """
    단일 문제에 대해 모든 시나리오를 실행합니다.

    Args:
        client: SubmissionClient 인스턴스
        problem: 문제 데이터 딕셔너리
        db_problem_id: DB의 문제 ID
        scenarios: 실행할 시나리오 이름 목록
        collector: E2EResultCollector 인스턴스
        timeout: 폴링 타임아웃 (초)

    Returns:
        문제별 테스트 결과 요약
    """
    problem_id = problem["problem_id"]
    results = {
        "problem_id": problem_id,
        "scenarios": {},
        "passed": 0,
        "failed": 0,
    }

    for scenario_name in scenarios:
        scenario_config = SCENARIOS[scenario_name]

        scenario_result = run_scenario(
            client=client,
            problem=problem,
            db_problem_id=db_problem_id,
            scenario_name=scenario_name,
            scenario_config=scenario_config,
            timeout=timeout,
        )

        # 결과 저장
        results["scenarios"][scenario_name] = scenario_result

        if scenario_result["passed"]:
            results["passed"] += 1
        else:
            results["failed"] += 1

        # Collector에 추가
        collector.add_scenario_result(
            problem_id=problem_id,
            scenario_name=scenario_name,
            test_code=scenario_result["test_code"],
            submission_result=scenario_result["result"],
            expected=scenario_config,
            passed=scenario_result["passed"],
            execution_time=scenario_result["execution_time"],
        )

    return results


# =============================================================================
# Main
# =============================================================================

def main():
    """메인 함수."""
    parser = argparse.ArgumentParser(
        description="End-to-End 제출 테스트",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--api-url",
        default="https://qa-arena.qalabs.kr/api/v1",
        help="API 베이스 URL (기본값: https://qa-arena.qalabs.kr/api/v1)",
    )
    parser.add_argument(
        "--only",
        nargs="+",
        metavar="PROBLEM_ID",
        help="특정 문제만 테스트 (예: --only E01 M01)",
    )
    parser.add_argument(
        "--scenarios",
        nargs="+",
        choices=list(SCENARIOS.keys()),
        help="특정 시나리오만 테스트 (예: --scenarios strong weak)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=120,
        help="폴링 타임아웃 (초, 기본값: 120)",
    )
    parser.add_argument(
        "--skip-health-check",
        action="store_true",
        help="헬스체크 건너뛰기",
    )

    args = parser.parse_args()

    # 설정 출력
    print("=" * 60)
    print("E2E Submission Test")
    print("=" * 60)
    print(f"API URL: {args.api_url}")
    print(f"Timeout: {args.timeout}s")

    # 클라이언트 초기화
    client = SubmissionClient(base_url=args.api_url)

    # 헬스체크
    if not args.skip_health_check:
        print("\n[1/4] Checking server health...")
        if not client.health_check():
            print("[ERROR] Server health check failed!")
            print("Please check if the server is running.")
            sys.exit(1)
        print("✅ Server is healthy")

    # 문제 로드
    print("\n[2/4] Loading problems...")
    problem_ids = args.only if args.only else SAMPLE_PROBLEMS

    problems = ProblemLoader.load_all_problems(filter_ids=problem_ids)
    if not problems:
        print(f"[ERROR] No problems found for IDs: {problem_ids}")
        sys.exit(1)

    print(f"✅ Loaded {len(problems)} problems: {[p['problem_id'] for p in problems]}")

    # 시나리오 설정
    scenarios = args.scenarios if args.scenarios else list(SCENARIOS.keys())
    print(f"✅ Scenarios: {scenarios}")

    # DB problem_id 매핑 조회
    print("\n[3/4] Mapping problem IDs...")
    problem_id_map: Dict[str, int] = {}

    for problem in problems:
        title = problem.get("title", "")
        if not title:
            # title이 없으면 problem_id를 기반으로 검색 시도
            print(f"[WARNING] No title for {problem['problem_id']}, skipping DB lookup")
            continue

        db_id = client.get_problem_id_by_title(title)
        if db_id:
            problem_id_map[problem["problem_id"]] = db_id
            print(f"  {problem['problem_id']}: {title} -> DB ID {db_id}")
        else:
            print(f"[WARNING] Could not find DB ID for: {title}")

    if not problem_id_map:
        print("[ERROR] No problems found in DB!")
        sys.exit(1)

    # 테스트 실행
    print("\n[4/4] Running tests...")
    print("-" * 60)

    collector = E2EResultCollector(api_url=args.api_url)
    ensure_results_dir()

    total_scenarios = len(problem_id_map) * len(scenarios)
    with ProgressReporter(total=total_scenarios, desc="Testing") as progress:
        for problem in problems:
            problem_id = problem["problem_id"]
            if problem_id not in problem_id_map:
                continue

            db_problem_id = problem_id_map[problem_id]
            difficulty = problem.get("difficulty", "Unknown")

            print(f"\nTesting {problem_id} ({difficulty})...")

            results = run_problem_tests(
                client=client,
                problem=problem,
                db_problem_id=db_problem_id,
                scenarios=scenarios,
                collector=collector,
                timeout=args.timeout,
            )

            # 결과 출력
            for scenario_name, scenario_result in results["scenarios"].items():
                status_icon = "✅" if scenario_result["passed"] else "❌"
                exec_time = scenario_result["execution_time"]

                if scenario_result["passed"]:
                    result_data = scenario_result["result"]
                    score = result_data.get("score", "N/A")
                    killed = result_data.get("killed_mutants", "N/A")
                    total = result_data.get("total_mutants", "N/A")

                    if scenario_name in ["strong", "weak"]:
                        kill_rate = (
                            f"{killed}/{total}"
                            if killed != "N/A" and total != "N/A"
                            else "N/A"
                        )
                        print(
                            f"  {status_icon} {scenario_name}: "
                            f"score={score}, kill={kill_rate}, time={exec_time:.1f}s"
                        )
                    else:
                        print(
                            f"  {status_icon} {scenario_name}: "
                            f"{scenario_result['result'].get('status', 'UNKNOWN')}, "
                            f"time={exec_time:.1f}s"
                        )
                else:
                    print(
                        f"  {status_icon} {scenario_name}: "
                        f"FAILED - {scenario_result['reason']}, time={exec_time:.1f}s"
                    )

                progress.update(1)

    # 결과 저장
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)

    summary = collector.summary
    print(f"Total Scenarios: {summary['total_scenarios']}")
    print(f"Passed: {summary['passed']}/{summary['total_scenarios']} "
          f"({100 * summary['passed'] / max(1, summary['total_scenarios']):.1f}%)")
    print(f"Failed: {summary['failed']}")

    print("\nBy Scenario Type:")
    for scenario_type, stats in summary["by_scenario_type"].items():
        total = stats["passed"] + stats["failed"]
        print(f"  {scenario_type}: {stats['passed']}/{total} passed")

    print("\nBy Problem:")
    for prob_id, stats in summary["by_problem"].items():
        total = stats["passed"] + stats["failed"]
        status = "✅" if stats["failed"] == 0 else "❌"
        print(f"  {status} {prob_id}: {stats['passed']}/{total}")

    # JSON 저장
    output_path = collector.save_to_json()
    print(f"\nResults saved to: {output_path}")

    # 종료 코드
    if summary["failed"] > 0:
        sys.exit(1)
    else:
        print("\n✅ All tests passed!")
        sys.exit(0)


if __name__ == "__main__":
    main()
