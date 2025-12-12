"""GPT-5.2를 사용해 초기 문제 4개 생성 (Very Easy, Easy, Medium, Hard)"""

import json
import sys
import time
from pathlib import Path

# 프로젝트 루트를 path에 추가
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent))

from app.services.ai_problem_designer import generate_problem


# 문제 정의: 난이도별로 다른 주제와 스킬
PROBLEMS_TO_GENERATE = [
    {
        "id": "VE01",
        "difficulty": "Very Easy",
        "goal": "두 숫자를 더하는 간단한 add 함수를 테스트하는 문제를 만들어라. 기본적인 덧셈과 음수 처리를 다루어야 한다.",
        "skills": ["basic testing", "positive/negative values"],
    },
    {
        "id": "E01",
        "difficulty": "Easy",
        "goal": "문자열에서 특정 문자의 개수를 세는 count_char 함수를 테스트하는 문제를 만들어라. 대소문자 구분, 빈 문자열 처리 등을 다루어야 한다.",
        "skills": ["boundary value analysis", "equivalence partitioning"],
    },
    {
        "id": "M01",
        "difficulty": "Medium",
        "goal": "이메일 주소 유효성 검증 함수를 테스트하는 문제를 만들어라. 이메일 형식, 특수문자, 도메인 검증 등을 다루어야 한다.",
        "skills": ["boundary value analysis", "equivalence partitioning", "error handling"],
    },
    {
        "id": "H01",
        "difficulty": "Hard",
        "goal": "장바구니 할인 계산 함수를 테스트하는 문제를 만들어라. 복합 할인 규칙(수량 할인, 쿠폰 적용, VIP 등급별 할인)과 경계값, 예외 상황을 다루어야 한다.",
        "skills": ["boundary value analysis", "equivalence partitioning", "error handling", "state-based testing"],
    },
]


def generate_single_problem(problem_config: dict) -> dict:
    """단일 문제 생성"""

    problem_id = problem_config["id"]
    difficulty = problem_config["difficulty"]
    goal = problem_config["goal"]
    skills = problem_config["skills"]

    print(f"\n{'='*60}")
    print(f"문제 생성 중: {problem_id} ({difficulty})")
    print(f"목표: {goal[:50]}...")
    print(f"스킬: {skills}")
    print(f"{'='*60}")

    start_time = time.time()

    try:
        result = generate_problem(
            goal=goal,
            language="python",
            testing_framework="pytest",
            skills_to_assess=skills,
            difficulty=difficulty,
            problem_style="unit_test_for_single_function",
            use_reasoning=True,
            # reasoning_effort는 난이도에 따라 자동 설정됨 (Hard → xhigh)
            verbosity="high",
        )

        elapsed_time = time.time() - start_time

        print(f"\n[OK] 생성 완료 ({elapsed_time:.2f}초)")
        print(f"   제목: {result.get('title', 'N/A')}")
        print(f"   버그 구현 수: {len(result.get('buggy_implementations', []))}")

        # 문제 ID 추가
        result["problem_id"] = problem_id

        return {
            "success": True,
            "problem_id": problem_id,
            "difficulty": difficulty,
            "elapsed_time": elapsed_time,
            "result": result,
        }

    except Exception as e:
        elapsed_time = time.time() - start_time
        print(f"\n[FAIL] 생성 실패 ({elapsed_time:.2f}초): {e}")
        import traceback
        traceback.print_exc()

        return {
            "success": False,
            "problem_id": problem_id,
            "difficulty": difficulty,
            "elapsed_time": elapsed_time,
            "error": str(e),
        }


def save_problem_to_json(problem_result: dict, output_dir: Path):
    """문제를 JSON 파일로 저장"""

    if not problem_result["success"]:
        print(f"[SKIP] {problem_result['problem_id']} - 실패한 문제는 저장하지 않음")
        return None

    problem_id = problem_result["problem_id"]
    result = problem_result["result"]

    output_file = output_dir / f"{problem_id}.json"

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"[SAVED] 저장됨: {output_file}")
    return output_file


def main():
    """메인 함수"""

    print("="*70)
    print("GPT-5.2 기반 초기 문제 생성")
    print("="*70)
    print(f"생성할 문제: {len(PROBLEMS_TO_GENERATE)}개")
    for p in PROBLEMS_TO_GENERATE:
        print(f"  - {p['id']}: {p['difficulty']}")

    # 출력 디렉토리 생성
    output_dir = SCRIPT_DIR.parent / "generated_problems"
    output_dir.mkdir(exist_ok=True)
    print(f"\n출력 디렉토리: {output_dir}")

    results = []

    for i, problem_config in enumerate(PROBLEMS_TO_GENERATE):
        result = generate_single_problem(problem_config)
        results.append(result)

        if result["success"]:
            save_problem_to_json(result, output_dir)

        # 마지막이 아니면 잠시 대기 (rate limit 방지)
        if i < len(PROBLEMS_TO_GENERATE) - 1:
            print("\n대기 중 (5초)...")
            time.sleep(5)

    # 결과 요약
    print("\n" + "="*70)
    print("생성 결과 요약")
    print("="*70)

    success_count = sum(1 for r in results if r["success"])
    total_time = sum(r["elapsed_time"] for r in results)

    print(f"성공: {success_count}/{len(results)}")
    print(f"총 소요 시간: {total_time:.2f}초")

    print("\n상세 결과:")
    for r in results:
        status = "[OK]" if r["success"] else "[FAIL]"
        if r["success"]:
            title = r["result"].get("title", "N/A")[:40]
            bugs = len(r["result"].get("buggy_implementations", []))
            print(f"  {status} {r['problem_id']} ({r['difficulty']}): {title}... ({bugs}개 버그, {r['elapsed_time']:.1f}초)")
        else:
            print(f"  {status} {r['problem_id']} ({r['difficulty']}): 실패 - {r.get('error', 'Unknown')[:50]}...")

    print("\n" + "="*70)
    if success_count == len(results):
        print("[SUCCESS] 모든 문제가 성공적으로 생성되었습니다!")
        print(f"[DIR] JSON 파일 위치: {output_dir}")
        print("\n다음 단계:")
        print("  1. EC2에 코드 배포: /deploy")
        print("  2. DB에 문제 로드: python scripts/load_generated_problems.py")
    else:
        print("[WARN] 일부 문제 생성에 실패했습니다. 로그를 확인하세요.")

    return results


if __name__ == "__main__":
    main()
