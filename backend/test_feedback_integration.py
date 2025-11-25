"""Integration test for AI Feedback Engine with actual LLM."""

import sys
from app.services.ai_feedback_engine import generate_feedback

def test_feedback_generation():
    """Test feedback generation with actual LLM."""
    print("=" * 60)
    print("AI Feedback Engine 통합 테스트")
    print("=" * 60)
    
    print("\n   피드백 생성 중... (시간이 걸릴 수 있습니다)")
    
    try:
        result = generate_feedback(
            problem_title="리스트 합계 테스트",
            problem_description="정수 리스트를 입력받아 합을 계산하는 함수에 대한 테스트를 작성하세요.",
            problem_skills=["boundary value analysis", "negative input handling"],
            test_code="""import pytest
from target import sum_list

def test_sum_list_basic():
    assert sum_list([1, 2, 3]) == 6

def test_sum_list_empty():
    assert sum_list([]) == 0
""",
            score=65,
            killed_mutants=4,
            total_mutants=10,
            kill_ratio=0.4,
            execution_log={
                "golden": {
                    "all_tests_passed": True,
                    "stdout": "2 passed",
                },
                "mutants": [
                    {
                        "mutant_id": 1,
                        "bug_description": "빈 리스트 처리 오류",
                        "result": {"any_test_failed": True},
                    },
                ],
            },
        )
        
        print("[OK] 피드백 생성 성공!")
        print("\n생성된 피드백:")
        print(f"   요약: {result.get('summary', 'N/A')}")
        print(f"\n   잘한 점 ({len(result.get('strengths', []))}개):")
        for strength in result.get('strengths', []):
            print(f"      - {strength}")
        print(f"\n   아쉬운 점 ({len(result.get('weaknesses', []))}개):")
        for weakness in result.get('weaknesses', []):
            print(f"      - {weakness}")
        print(f"\n   제안된 테스트 ({len(result.get('suggested_tests', []))}개):")
        for test in result.get('suggested_tests', []):
            print(f"      - {test}")
        
        # 검증
        assert result is not None
        assert "summary" in result
        assert len(result.get("strengths", [])) > 0
        assert len(result.get("weaknesses", [])) > 0
        assert len(result.get("suggested_tests", [])) > 0
        
        print("\n[OK] 모든 필수 필드가 포함되어 있습니다.")
        return True
        
    except Exception as e:
        print(f"[ERROR] 피드백 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n")
    success = test_feedback_generation()
    
    if success:
        print("\n" + "=" * 60)
        print("[OK] 통합 테스트 성공!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("[ERROR] 통합 테스트 실패")
        print("=" * 60)
        sys.exit(1)

