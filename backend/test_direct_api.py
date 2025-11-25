"""Direct API test without HTTP server."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_routes():
    """Test admin routes are registered."""
    print("=" * 60)
    print("Admin 라우터 등록 확인")
    print("=" * 60)
    
    # 모든 라우트 확인
    routes = [r.path for r in app.routes]
    admin_routes = [r for r in routes if 'admin' in r]
    
    print(f"\n전체 라우트 개수: {len(routes)}")
    print(f"Admin 라우트 개수: {len(admin_routes)}")
    
    if admin_routes:
        print("\n등록된 Admin 라우트:")
        for route in admin_routes:
            print(f"   - {route}")
    else:
        print("\n[WARNING] Admin 라우트가 등록되지 않았습니다!")
    
    return len(admin_routes) > 0


def test_ai_generate_endpoint():
    """Test AI generate endpoint."""
    print("\n" + "=" * 60)
    print("AI 문제 생성 엔드포인트 테스트")
    print("=" * 60)
    
    request_data = {
        "goal": "간단한 테스트 문제",
        "language": "python",
        "testing_framework": "pytest",
        "skills_to_assess": ["basic"],
        "difficulty": "Easy"
    }
    
    print("\n   요청 데이터:")
    print(f"   - goal: {request_data['goal']}")
    print(f"   - difficulty: {request_data['difficulty']}")
    
    try:
        print("\n   API 호출 중... (실제 LLM 호출이므로 시간이 걸릴 수 있습니다)")
        response = client.post(
            "/api/admin/problems/ai-generate",
            json=request_data,
            timeout=60
        )
        
        print(f"\n   응답 상태 코드: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("[OK] 문제 생성 성공!")
            print("\n생성된 문제 요약:")
            print(f"   - 함수 시그니처: {result.get('function_signature', 'N/A')}")
            print(f"   - 난이도: {result.get('difficulty', 'N/A')}")
            print(f"   - Buggy 구현 개수: {len(result.get('buggy_implementations', []))}")
            return True
        else:
            print(f"[ERROR] API 호출 실패: {response.status_code}")
            print(f"   응답: {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] 예상치 못한 오류: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n")
    
    # 1. 라우터 등록 확인
    routes_ok = test_admin_routes()
    
    if not routes_ok:
        print("\n[ERROR] Admin 라우터가 등록되지 않았습니다.")
        print("   app/main.py를 확인하세요.")
        exit(1)
    
    # 2. 실제 API 테스트
    api_ok = test_ai_generate_endpoint()
    
    if api_ok:
        print("\n" + "=" * 60)
        print("[OK] 모든 테스트 통과!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("[ERROR] API 테스트 실패")
        print("=" * 60)

