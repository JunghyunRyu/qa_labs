"""Test script to verify LLM connection and problem generation."""

import sys
import json
from app.core.llm_client import llm_client
from app.services.ai_problem_designer import generate_problem

def test_llm_connection():
    """Test basic LLM connection."""
    print("=" * 60)
    print("1. LLM 클라이언트 연결 테스트")
    print("=" * 60)
    
    if not llm_client.client:
        print("[ERROR] LLM 클라이언트가 초기화되지 않았습니다.")
        print("   OPENAI_API_KEY가 설정되어 있는지 확인하세요.")
        return False
    
    print("[OK] LLM 클라이언트 초기화 성공")
    print(f"   모델: {llm_client.model}")
    
    # 간단한 테스트 호출
    try:
        print("\n   간단한 테스트 호출 중...")
        response = llm_client.generate_completion(
            system_prompt="You are a helpful assistant.",
            user_prompt="Say 'Hello' in one word.",
            temperature=0.7,
        )
        print(f"[OK] LLM 응답 성공: {response[:50]}...")
        return True
    except Exception as e:
        print(f"[ERROR] LLM 호출 실패: {e}")
        return False


def test_problem_generation():
    """Test problem generation."""
    print("\n" + "=" * 60)
    print("2. AI 문제 생성 테스트")
    print("=" * 60)
    
    try:
        print("\n   문제 생성 중... (시간이 걸릴 수 있습니다)")
        result = generate_problem(
            goal="리스트의 합을 계산하는 함수에 대한 테스트 문제",
            language="python",
            testing_framework="pytest",
            skills_to_assess=["boundary value analysis", "negative input handling"],
            difficulty="Easy",
        )
        
        print("[OK] 문제 생성 성공!")
        print("\n생성된 문제 요약:")
        print(f"   - 함수 시그니처: {result['function_signature']}")
        print(f"   - 난이도: {result['difficulty']}")
        print(f"   - Buggy 구현 개수: {len(result['buggy_implementations'])}")
        print(f"   - 태그: {result.get('tags', [])}")
        
        print("\n생성된 문제 상세:")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        return True
    except Exception as e:
        print(f"[ERROR] 문제 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("AI Problem Designer 동작 확인 테스트")
    print("=" * 60 + "\n")
    
    # 1. LLM 연결 테스트
    connection_ok = test_llm_connection()
    
    if not connection_ok:
        print("\n[ERROR] LLM 연결 실패. 문제 생성을 건너뜁니다.")
        sys.exit(1)
    
    # 2. 문제 생성 테스트
    generation_ok = test_problem_generation()
    
    if generation_ok:
        print("\n" + "=" * 60)
        print("[OK] 모든 테스트 통과!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("[ERROR] 문제 생성 테스트 실패")
        print("=" * 60)
        sys.exit(1)

