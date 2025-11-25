"""Test Admin API endpoint with actual LLM call."""

import requests
import json
import time

API_BASE_URL = "http://localhost:8000"

def test_ai_generate_endpoint():
    """Test AI problem generation endpoint."""
    print("=" * 60)
    print("Admin API 엔드포인트 테스트")
    print("=" * 60)
    
    # 서버가 실행 중인지 확인
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=2)
        if response.status_code != 200:
            print("[WARNING] 서버가 실행 중이 아닌 것 같습니다.")
            print("   서버를 먼저 실행하세요: uvicorn app.main:app --reload")
            return False
    except requests.exceptions.ConnectionError:
        print("[WARNING] 서버에 연결할 수 없습니다.")
        print("   서버를 먼저 실행하세요: uvicorn app.main:app --reload")
        return False
    
    print("[OK] 서버 연결 성공")
    
    # AI 문제 생성 요청
    print("\n   AI 문제 생성 요청 중...")
    request_data = {
        "goal": "리스트의 최대값을 찾는 함수에 대한 테스트 문제",
        "language": "python",
        "testing_framework": "pytest",
        "skills_to_assess": ["boundary value analysis", "edge cases"],
        "difficulty": "Easy"
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{API_BASE_URL}/api/admin/problems/ai-generate",
            json=request_data,
            timeout=60  # LLM 호출은 시간이 걸릴 수 있음
        )
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print(f"[OK] 문제 생성 성공! (소요 시간: {elapsed_time:.2f}초)")
            print("\n생성된 문제 요약:")
            print(f"   - 함수 시그니처: {result.get('function_signature', 'N/A')}")
            print(f"   - 난이도: {result.get('difficulty', 'N/A')}")
            print(f"   - Buggy 구현 개수: {len(result.get('buggy_implementations', []))}")
            print(f"   - 태그: {result.get('tags', [])}")
            
            # 간단한 검증
            required_fields = [
                'function_signature', 'golden_code', 'buggy_implementations',
                'description_md', 'initial_test_template', 'difficulty'
            ]
            missing_fields = [field for field in required_fields if field not in result]
            
            if missing_fields:
                print(f"\n[WARNING] 누락된 필드: {missing_fields}")
            else:
                print("\n[OK] 모든 필수 필드가 포함되어 있습니다.")
            
            return True
        else:
            print(f"[ERROR] API 호출 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("[ERROR] 요청 시간 초과 (60초)")
        return False
    except Exception as e:
        print(f"[ERROR] 예상치 못한 오류: {e}")
        return False


if __name__ == "__main__":
    print("\n")
    success = test_ai_generate_endpoint()
    
    if success:
        print("\n" + "=" * 60)
        print("[OK] API 엔드포인트 테스트 성공!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("[ERROR] API 엔드포인트 테스트 실패")
        print("=" * 60)

