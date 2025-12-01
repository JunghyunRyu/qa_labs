"""문제 생성 스크립트 - GPT-5.1 Responses API 사용"""
import json
import os
from datetime import datetime

# 결과 저장 경로
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = os.path.join(script_dir, "generated_problems")
os.makedirs(output_dir, exist_ok=True)

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

# 문제 정의
PROBLEMS_TO_GENERATE = [
    # Easy - 경계값 분석 (E01-E03)
    {
        "id": "E01",
        "goal": "정수 범위를 검증하는 함수에 대한 경계값 분석 테스트 문제. 나이 검증 함수(0-150)를 테스트하는 문제를 만들어주세요.",
        "skills": ["boundary value analysis", "edge cases"],
        "difficulty": "Easy",
    },
    {
        "id": "E02",
        "goal": "문자열 길이 검증 함수에 대한 경계값 분석 테스트 문제. 비밀번호 길이(8-20자)를 검증하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["boundary value analysis", "string validation"],
        "difficulty": "Easy",
    },
    {
        "id": "E03",
        "goal": "배열/리스트 크기 경계값 분석 테스트 문제. 장바구니 아이템 개수(1-10개)를 검증하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["boundary value analysis", "list validation"],
        "difficulty": "Easy",
    },
    # Easy - 동등 분할 (E04-E06)
    {
        "id": "E04",
        "goal": "성적 등급 계산 함수에 대한 동등 분할 테스트 문제. 점수(0-100)를 입력받아 A/B/C/D/F 등급을 반환하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["equivalence partitioning", "grade calculation"],
        "difficulty": "Easy",
    },
    {
        "id": "E05",
        "goal": "요금 계산 함수에 대한 동등 분할 테스트 문제. 나이에 따른 입장료(어린이/청소년/성인/노인) 할인을 계산하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["equivalence partitioning", "pricing logic"],
        "difficulty": "Easy",
    },
    {
        "id": "E06",
        "goal": "배송비 계산 함수에 대한 동등 분할 테스트 문제. 주문 금액 구간(무료/기본/할인)에 따른 배송비를 계산하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["equivalence partitioning", "shipping cost"],
        "difficulty": "Easy",
    },
    # Easy - 예외 처리 (E07-E08)
    {
        "id": "E07",
        "goal": "나눗셈 함수에 대한 예외 처리 테스트 문제. 0으로 나누기, 잘못된 입력 타입 등 예외 상황을 처리하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["error handling", "exception testing"],
        "difficulty": "Easy",
    },
    {
        "id": "E08",
        "goal": "파일 경로 검증 함수에 대한 예외 처리 테스트 문제. 빈 문자열, None, 잘못된 형식의 경로 등 예외 상황을 처리하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["error handling", "input validation"],
        "difficulty": "Easy",
    },
    # Easy - 기본 자료형 (E09-E10)
    {
        "id": "E09",
        "goal": "이메일 형식 검증 함수에 대한 기본 자료형 테스트 문제. 유효한 이메일 형식(@, 도메인 등)을 검증하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["string manipulation", "format validation"],
        "difficulty": "Easy",
    },
    {
        "id": "E10",
        "goal": "전화번호 형식 변환 함수에 대한 기본 자료형 테스트 문제. 다양한 형식의 전화번호를 표준 형식으로 변환하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["string manipulation", "data formatting"],
        "difficulty": "Easy",
    },
]

def generate_problem(problem_def):
    """단일 문제 생성"""
    from app.services.ai_problem_designer import generate_problem as ai_generate
    
    log(f"문제 생성 중: {problem_def['id']} - {problem_def['goal'][:50]}...")
    
    result = ai_generate(
        goal=problem_def["goal"],
        language="python",
        testing_framework="pytest",
        skills_to_assess=problem_def["skills"],
        difficulty=problem_def["difficulty"],
        use_reasoning=True,
        reasoning_effort="high",
    )
    
    return result


def save_problem(problem_id, result):
    """생성된 문제를 파일로 저장"""
    filename = os.path.join(output_dir, f"{problem_id}.json")
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    log(f"저장됨: {filename}")
    return filename


def main():
    log("=" * 60)
    log("QA-Arena 문제 생성 시작")
    log("=" * 60)
    
    generated_count = 0
    skipped_count = 0
    failed_count = 0
    
    for problem_def in PROBLEMS_TO_GENERATE:
        # 이미 생성된 파일이 있으면 건너뛰기
        existing_file = os.path.join(output_dir, f"{problem_def['id']}.json")
        if os.path.exists(existing_file):
            log(f"⏭️ {problem_def['id']} - 이미 존재함, 건너뜀")
            skipped_count += 1
            continue
        
        try:
            result = generate_problem(problem_def)
            save_problem(problem_def["id"], result)
            
            # 결과 요약 출력
            log(f"\n✅ {problem_def['id']} 생성 완료!")
            log(f"   - 함수: {result['function_signature']}")
            log(f"   - 난이도: {result['difficulty']}")
            log(f"   - Buggy 구현: {len(result['buggy_implementations'])}개")
            log(f"   - 태그: {result.get('tags', [])}")
            generated_count += 1
            
        except Exception as e:
            log(f"\n❌ {problem_def['id']} 생성 실패: {e}")
            import traceback
            traceback.print_exc()
            failed_count += 1
    
    log("\n" + "=" * 60)
    log(f"문제 생성 완료! (생성: {generated_count}, 건너뜀: {skipped_count}, 실패: {failed_count})")
    log("=" * 60)


if __name__ == "__main__":
    main()

