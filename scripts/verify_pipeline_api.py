"""API 기반 채점 파이프라인 검증 스크립트."""

import sys
import time
import requests
from pathlib import Path

# API 기본 URL
BASE_URL = "http://localhost:8000"


def check_api_health():
    """API 서버 상태 확인."""
    print("=" * 60)
    print("1. API 서버 상태 확인")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ API 서버 정상 동작")
            return True
        else:
            print(f"⚠️  API 서버 응답: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ API 서버에 연결할 수 없습니다: {BASE_URL}")
        print("   백엔드 서버가 실행 중인지 확인하세요.")
        print("   실행 명령: docker compose up -d backend")
        return False
    except Exception as e:
        print(f"❌ API 확인 중 오류: {e}")
        return False


def check_problems():
    """문제 목록 확인."""
    print("\n" + "=" * 60)
    print("2. 문제 목록 확인")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/problems", timeout=5)
        if response.status_code == 200:
            data = response.json()
            total = data.get('total', 0)
            problems = data.get('problems', [])
            
            print(f"✅ 문제 목록 조회 성공")
            print(f"   총 문제 수: {total}개")
            
            if total == 0:
                print("⚠️  경고: 등록된 문제가 없습니다!")
                return None
            
            print("\n📝 문제 목록 (최대 5개):")
            for problem in problems[:5]:
                print(f"  - ID: {problem.get('id')}, 제목: '{problem.get('title')}'")
                print(f"    Slug: {problem.get('slug')}, 난이도: {problem.get('difficulty')}")
            
            return problems[0].get('id') if problems else None
        else:
            print(f"❌ API 응답 실패: {response.status_code}")
            print(f"   응답: {response.text[:200]}")
            return None
            
    except Exception as e:
        print(f"❌ 문제 목록 확인 중 오류: {e}")
        return None


def get_problem_detail(problem_id: int):
    """문제 상세 정보 확인."""
    print("\n" + "=" * 60)
    print(f"3. 문제 상세 확인 (ID: {problem_id})")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/problems/{problem_id}", timeout=5)
        if response.status_code == 200:
            problem = response.json()
            print(f"✅ 문제 상세 조회 성공")
            print(f"   제목: {problem.get('title')}")
            print(f"   함수 시그니처: {problem.get('function_signature')}")
            print(f"   난이도: {problem.get('difficulty')}")
            
            # 초기 테스트 템플릿 확인
            template = problem.get('initial_test_template', '')
            if template:
                print(f"   초기 템플릿 길이: {len(template)} 문자")
            
            return problem
        else:
            print(f"❌ 문제 상세 조회 실패: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ 문제 상세 확인 중 오류: {e}")
        return None


def create_submission(problem_id: int, test_code: str):
    """제출 생성."""
    print("\n" + "=" * 60)
    print("4. 제출 생성")
    print("=" * 60)
    
    try:
        print(f"📤 제출 생성 중... (문제 ID: {problem_id})")
        response = requests.post(
            f"{BASE_URL}/api/v1/submissions",
            json={
                "problem_id": problem_id,
                "code": test_code
            },
            timeout=10
        )
        
        if response.status_code != 201:
            print(f"❌ 제출 생성 실패: {response.status_code}")
            print(f"   응답: {response.text[:500]}")
            return None
        
        submission = response.json()
        submission_id = submission.get('id')
        print(f"✅ 제출 생성 성공: {submission_id}")
        print(f"   상태: {submission.get('status')}")
        
        return submission_id
        
    except Exception as e:
        print(f"❌ 제출 생성 중 오류: {e}")
        import traceback
        traceback.print_exc()
        return None


def wait_for_result(submission_id: str, max_wait: int = 60):
    """채점 결과 대기."""
    print("\n" + "=" * 60)
    print("5. 채점 결과 대기")
    print("=" * 60)
    
    print(f"⏳ 채점 결과 대기 중... (최대 {max_wait}초)")
    wait_interval = 2
    elapsed = 0
    
    while elapsed < max_wait:
        time.sleep(wait_interval)
        elapsed += wait_interval
        
        try:
            response = requests.get(
                f"{BASE_URL}/api/v1/submissions/{submission_id}",
                timeout=5
            )
            
            if response.status_code != 200:
                print(f"⚠️  제출 조회 실패: {response.status_code}")
                continue
            
            submission = response.json()
            status = submission.get('status')
            
            print(f"   [{elapsed}초] 상태: {status}", end='')
            
            if status in ['SUCCESS', 'FAILURE', 'ERROR']:
                print("\n")
                print(f"✅ 채점 완료!")
                print(f"   최종 상태: {status}")
                print(f"   점수: {submission.get('score', 0)}")
                print(f"   Killed Mutants: {submission.get('killed_mutants', 0)}/{submission.get('total_mutants', 0)}")
                
                if submission.get('feedback_json'):
                    feedback = submission['feedback_json']
                    if isinstance(feedback, dict):
                        summary = feedback.get('summary', '')
                        if summary:
                            print(f"   피드백 요약: {summary[:150]}")
                
                return submission
            else:
                print(" (진행 중...)")
                
        except Exception as e:
            print(f"\n⚠️  결과 조회 중 오류: {e}")
            continue
    
    print(f"\n⚠️  타임아웃: {max_wait}초 내에 채점이 완료되지 않았습니다.")
    return None


def main():
    """메인 검증 함수."""
    print("\n" + "=" * 60)
    print("채점 파이프라인 검증 (API 기반)")
    print("=" * 60)
    
    # 1. API 서버 확인
    if not check_api_health():
        print("\n❌ API 서버가 실행되지 않았습니다. 검증을 중단합니다.")
        return
    
    # 2. 문제 목록 확인
    problem_id = check_problems()
    if not problem_id:
        print("\n❌ 문제를 찾을 수 없습니다. 검증을 중단합니다.")
        return
    
    # 3. 문제 상세 확인
    problem = get_problem_detail(problem_id)
    if not problem:
        print("\n❌ 문제 상세를 가져올 수 없습니다. 검증을 중단합니다.")
        return
    
    # 4. 테스트 코드 준비 (간단한 예시)
    # 실제로는 문제의 initial_test_template을 사용하거나 더 나은 테스트를 작성해야 함
    test_code = problem.get('initial_test_template', '')
    if not test_code or len(test_code.strip()) < 50:
        # 기본 테스트 코드 (예시)
        function_name = problem.get('function_signature', '').split('(')[0].replace('def ', '').strip()
        test_code = f"""import pytest
from target import {function_name}

def test_basic():
    # 기본 테스트 케이스
    pass

def test_edge_cases():
    # 경계값 테스트
    pass
"""
        print(f"\n⚠️  초기 템플릿이 없어 기본 테스트 코드를 사용합니다.")
    
    # 5. 제출 생성
    submission_id = create_submission(problem_id, test_code)
    if not submission_id:
        print("\n❌ 제출 생성에 실패했습니다.")
        return
    
    # 6. 결과 대기
    result = wait_for_result(submission_id)
    
    # 최종 결과 요약
    print("\n" + "=" * 60)
    print("검증 결과 요약")
    print("=" * 60)
    print(f"✅ API 서버: 정상")
    print(f"✅ 문제 조회: 성공 (ID: {problem_id})")
    print(f"{'✅' if submission_id else '❌'} 제출 생성: {'성공' if submission_id else '실패'}")
    
    if result:
        status = result.get('status')
        if status == 'SUCCESS':
            print(f"✅ 채점 완료: 성공 (점수: {result.get('score', 0)})")
        elif status == 'FAILURE':
            print(f"⚠️  채점 완료: 실패 (Golden Code 테스트 실패)")
        else:
            print(f"❌ 채점 완료: 오류 (상태: {status})")
    else:
        print("❌ 채점 결과: 타임아웃 또는 오류")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()

