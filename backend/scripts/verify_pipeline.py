"""채점 파이프라인 검증 스크립트."""

import sys
import time
import requests
from pathlib import Path
from uuid import UUID

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal
from app.models.problem import Problem
from app.models.buggy_implementation import BuggyImplementation
from app.models.submission import Submission
from app.repositories.problem_repository import ProblemRepository
from app.repositories.submission_repository import SubmissionRepository


def check_database():
    """데이터베이스 연결 및 문제 존재 여부 확인."""
    print("=" * 60)
    print("1. 데이터베이스 상태 확인")
    print("=" * 60)
    
    db: Session = SessionLocal()
    try:
        # 문제 개수 확인
        problem_count = db.query(Problem).count()
        print(f"✅ 데이터베이스 연결 성공")
        print(f"📋 등록된 문제 수: {problem_count}개")
        
        if problem_count == 0:
            print("⚠️  경고: 등록된 문제가 없습니다!")
            return False
        
        # 문제 목록 출력
        problems = db.query(Problem).limit(5).all()
        print("\n📝 문제 목록 (최대 5개):")
        for problem in problems:
            buggy_count = db.query(BuggyImplementation).filter(
                BuggyImplementation.problem_id == problem.id
            ).count()
            print(f"  - ID: {problem.id}, 제목: '{problem.title}'")
            print(f"    Slug: {problem.slug}, 난이도: {problem.difficulty}")
            print(f"    Buggy 구현: {buggy_count}개")
        
        return True
        
    except Exception as e:
        print(f"❌ 데이터베이스 연결 실패: {e}")
        return False
    finally:
        db.close()


def check_api(base_url: str = "http://localhost:8000"):
    """API 엔드포인트 동작 확인."""
    print("\n" + "=" * 60)
    print("2. API 엔드포인트 확인")
    print("=" * 60)
    
    try:
        # 문제 목록 조회
        print(f"\n📡 GET {base_url}/api/v1/problems")
        response = requests.get(f"{base_url}/api/v1/problems", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 문제 목록 조회 성공")
            print(f"   총 문제 수: {data.get('total', 0)}개")
            if data.get('problems'):
                first_problem = data['problems'][0]
                print(f"   첫 번째 문제: ID={first_problem.get('id')}, 제목='{first_problem.get('title')}'")
                return first_problem.get('id')
            else:
                print("⚠️  문제가 없습니다!")
                return None
        else:
            print(f"❌ API 응답 실패: {response.status_code}")
            print(f"   응답: {response.text[:200]}")
            return None
            
    except requests.exceptions.ConnectionError:
        print(f"❌ API 서버에 연결할 수 없습니다: {base_url}")
        print("   백엔드 서버가 실행 중인지 확인하세요.")
        return None
    except Exception as e:
        print(f"❌ API 확인 중 오류: {e}")
        return None


def check_celery_worker():
    """Celery Worker 상태 확인."""
    print("\n" + "=" * 60)
    print("3. Celery Worker 상태 확인")
    print("=" * 60)
    
    try:
        import docker
        client = docker.from_env()
        
        # Celery Worker 컨테이너 확인
        containers = client.containers.list(all=True, filters={"name": "qa_arena_celery_worker"})
        
        if not containers:
            print("⚠️  Celery Worker 컨테이너를 찾을 수 없습니다.")
            print("   docker-compose.yml로 컨테이너를 시작하세요:")
            print("   docker compose up -d celery_worker")
            return False
        
        worker = containers[0]
        if worker.status != "running":
            print(f"⚠️  Celery Worker 컨테이너가 실행 중이 아닙니다. 상태: {worker.status}")
            return False
        
        print(f"✅ Celery Worker 컨테이너 실행 중: {worker.id[:12]}")
        
        # 로그 확인 (최근 10줄)
        logs = worker.logs(tail=10).decode('utf-8', errors='replace')
        if "ready" in logs.lower() or "celery" in logs.lower():
            print("✅ Celery Worker가 정상적으로 실행 중입니다.")
        else:
            print("⚠️  Celery Worker 로그 확인 필요")
            print(f"   최근 로그: {logs[-200:]}")
        
        return True
        
    except ImportError:
        print("⚠️  docker 모듈을 찾을 수 없습니다. 수동으로 확인하세요.")
        return None
    except Exception as e:
        print(f"⚠️  Celery Worker 확인 중 오류: {e}")
        return None


def test_submission(problem_id: int, base_url: str = "http://localhost:8000"):
    """실제 제출 테스트."""
    print("\n" + "=" * 60)
    print("4. 제출 생성 및 처리 테스트")
    print("=" * 60)
    
    # 간단한 테스트 코드 (예시)
    test_code = """import pytest
from target import normalize_whitespace

def test_basic():
    assert normalize_whitespace("hello  world") == "hello world"

def test_multiple_spaces():
    assert normalize_whitespace("a   b   c") == "a b c"

def test_empty_string():
    assert normalize_whitespace("") == ""
"""
    
    try:
        # 제출 생성
        print(f"\n📤 제출 생성 중... (문제 ID: {problem_id})")
        response = requests.post(
            f"{base_url}/api/v1/submissions",
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
        
        submission_data = response.json()
        submission_id = submission_data.get('id')
        print(f"✅ 제출 생성 성공: {submission_id}")
        print(f"   상태: {submission_data.get('status')}")
        
        # 결과 대기 (최대 30초)
        print("\n⏳ 채점 결과 대기 중... (최대 30초)")
        max_wait = 30
        wait_interval = 2
        elapsed = 0
        
        while elapsed < max_wait:
            time.sleep(wait_interval)
            elapsed += wait_interval
            
            response = requests.get(
                f"{base_url}/api/v1/submissions/{submission_id}",
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
                        print(f"   피드백 요약: {feedback.get('summary', 'N/A')[:100]}")
                
                return submission
            else:
                print(" (진행 중...)")
        
        print(f"\n⚠️  타임아웃: {max_wait}초 내에 채점이 완료되지 않았습니다.")
        print(f"   최종 상태: {submission.get('status') if 'submission' in locals() else 'UNKNOWN'}")
        return submission if 'submission' in locals() else None
        
    except Exception as e:
        print(f"❌ 제출 테스트 중 오류: {e}")
        import traceback
        traceback.print_exc()
        return None


def check_judge_image():
    """Judge Docker 이미지 확인."""
    print("\n" + "=" * 60)
    print("5. Judge Docker 이미지 확인")
    print("=" * 60)
    
    try:
        import docker
        client = docker.from_env()
        
        try:
            image = client.images.get("qa-arena-judge:latest")
            print(f"✅ Judge 이미지 존재: {image.id[:12]}")
            print(f"   크기: {image.attrs.get('Size', 0) / 1024 / 1024:.2f} MB")
            return True
        except docker.errors.ImageNotFound:
            print("❌ Judge 이미지를 찾을 수 없습니다.")
            print("   다음 명령어로 이미지를 빌드하세요:")
            print("   docker build -t qa-arena-judge:latest ./judge")
            return False
            
    except ImportError:
        print("⚠️  docker 모듈을 찾을 수 없습니다. 수동으로 확인하세요.")
        return None
    except Exception as e:
        print(f"⚠️  Judge 이미지 확인 중 오류: {e}")
        return None


def main():
    """메인 검증 함수."""
    print("\n" + "=" * 60)
    print("채점 파이프라인 검증 시작")
    print("=" * 60)
    
    results = {
        "database": False,
        "api": False,
        "celery": None,
        "judge_image": None,
        "submission": None,
    }
    
    # 1. 데이터베이스 확인
    results["database"] = check_database()
    if not results["database"]:
        print("\n❌ 데이터베이스 확인 실패. 검증을 중단합니다.")
        return
    
    # 2. API 확인
    problem_id = check_api()
    results["api"] = problem_id is not None
    
    # 3. Celery Worker 확인
    results["celery"] = check_celery_worker()
    
    # 4. Judge 이미지 확인
    results["judge_image"] = check_judge_image()
    
    # 5. 실제 제출 테스트
    if problem_id:
        results["submission"] = test_submission(problem_id)
    
    # 최종 결과 요약
    print("\n" + "=" * 60)
    print("검증 결과 요약")
    print("=" * 60)
    print(f"✅ 데이터베이스: {'성공' if results['database'] else '실패'}")
    print(f"{'✅' if results['api'] else '❌'} API: {'성공' if results['api'] else '실패'}")
    print(f"{'✅' if results['celery'] else '⚠️ '} Celery Worker: {'정상' if results['celery'] else '확인 필요' if results['celery'] is None else '실패'}")
    print(f"{'✅' if results['judge_image'] else '❌'} Judge 이미지: {'존재' if results['judge_image'] else '없음' if results['judge_image'] is False else '확인 필요'}")
    
    if results["submission"]:
        submission = results["submission"]
        status = submission.get('status')
        if status == 'SUCCESS':
            print(f"✅ 제출 테스트: 성공 (점수: {submission.get('score', 0)})")
        elif status == 'FAILURE':
            print(f"⚠️  제출 테스트: 실패 (Golden Code 테스트 실패)")
        else:
            print(f"❌ 제출 테스트: 오류 (상태: {status})")
    else:
        print("❌ 제출 테스트: 실행되지 않음")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()

