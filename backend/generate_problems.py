"""문제 생성 스크립트 - GPT-5.1 Responses API 사용"""
import json
import os
from datetime import datetime

# 결과 저장 경로
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = os.path.join(script_dir, "generated_problems")
os.makedirs(output_dir, exist_ok=True)

def log(message):
    # Windows cp949 인코딩 문제 방지
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
    except UnicodeEncodeError:
        # 이모지 등 인코딩 불가 문자 제거
        safe_message = message.encode('cp949', errors='ignore').decode('cp949')
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {safe_message}")

# 문제 정의
PROBLEMS_TO_GENERATE = [
    # Very Easy - 기초 테스트 (VE01-VE05)
    {
        "id": "VE01",
        "goal": "두 숫자를 더하는 add 함수 테스트. 가장 기본적인 덧셈 함수(def add(a, b) -> int)를 테스트하는 초보자용 문제. 버그는 단순한 것들: +를 -로 잘못 쓴 경우, 순서가 바뀐 경우 등.",
        "skills": ["basic testing", "simple arithmetic"],
        "difficulty": "Very Easy",
    },
    {
        "id": "VE02",
        "goal": "숫자가 짝수인지 확인하는 is_even 함수 테스트. def is_even(n) -> bool 함수를 테스트하는 초보자용 문제. 버그: 홀수를 반환하는 경우, 0을 잘못 처리하는 경우 등.",
        "skills": ["basic testing", "boolean logic"],
        "difficulty": "Very Easy",
    },
    {
        "id": "VE03",
        "goal": "숫자가 양수인지 확인하는 is_positive 함수 테스트. def is_positive(n) -> bool 함수를 테스트하는 초보자용 문제. 버그: 0을 양수로 처리, 음수 판단 오류 등.",
        "skills": ["basic testing", "comparison operators"],
        "difficulty": "Very Easy",
    },
    {
        "id": "VE04",
        "goal": "두 숫자 중 큰 값을 반환하는 max_of_two 함수 테스트. def max_of_two(a, b) -> int 함수를 테스트하는 초보자용 문제. 버그: min을 반환, 같은 값일 때 오류 등.",
        "skills": ["basic testing", "comparison"],
        "difficulty": "Very Easy",
    },
    {
        "id": "VE05",
        "goal": "문자열 길이를 반환하는 get_length 함수 테스트. def get_length(s: str) -> int 함수를 테스트하는 초보자용 문제. 버그: 빈 문자열에서 1 반환, 길이+1 반환 등.",
        "skills": ["basic testing", "string basics"],
        "difficulty": "Very Easy",
    },
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
    # Easy 보강 (E11-E15)
    {
        "id": "E11",
        "goal": "문자열 길이 검증 함수 테스트. 문자열의 길이가 최소/최대 범위 내에 있는지 검증하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["string validation", "boundary testing"],
        "difficulty": "Easy",
    },
    {
        "id": "E12",
        "goal": "리스트 정렬 검증 함수 테스트. 정수 리스트를 오름차순으로 정렬하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["list operations", "sorting"],
        "difficulty": "Easy",
    },
    {
        "id": "E13",
        "goal": "딕셔너리 키 존재 확인 함수 테스트. 딕셔너리에 특정 키가 존재하는지 확인하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["dictionary operations", "key validation"],
        "difficulty": "Easy",
    },
    {
        "id": "E14",
        "goal": "불린 값 반환 함수 테스트. 문자열이 대문자로만 이루어져 있는지 확인하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["boolean logic", "string analysis"],
        "difficulty": "Easy",
    },
    {
        "id": "E15",
        "goal": "간단한 수학 연산 함수 테스트. 두 숫자의 평균을 계산하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["arithmetic operations", "basic math"],
        "difficulty": "Easy",
    },
    # Medium - 상태 기반 및 조합 테스트 (M01-M05)
    {
        "id": "M01",
        "goal": "쇼핑 카트 클래스의 상태 변화를 테스트하는 문제. add_item(name, price, quantity), remove_item(name), get_total(), clear() 메서드를 가진 ShoppingCart 클래스를 테스트하는 문제를 만들어주세요.",
        "skills": ["state-based testing", "class testing", "object lifecycle"],
        "difficulty": "Medium",
    },
    {
        "id": "M02",
        "goal": "할인 계산기 함수에 대한 조합 테스트 문제. 가격, 할인율, 쿠폰 적용 여부를 입력받아 최종 가격을 계산하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["combinatorial testing", "discount logic", "multi-parameter"],
        "difficulty": "Medium",
    },
    {
        "id": "M03",
        "goal": "중첩된 딕셔너리 구조 검증 함수 테스트. 사용자 정보(이름, 이메일, 주소{도시, 우편번호})를 담은 딕셔너리를 검증하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["data structure testing", "nested structures", "validation"],
        "difficulty": "Medium",
    },
    {
        "id": "M04",
        "goal": "API 응답 JSON 검증 함수 테스트. status, data, error 필드를 가진 API 응답 딕셔너리의 구조를 검증하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["API validation", "JSON structure", "response handling"],
        "difficulty": "Medium",
    },
    {
        "id": "M05",
        "goal": "날짜 범위 검증 함수 테스트. 시작일과 종료일을 입력받아 예약 가능 여부를 판단하는 함수를 테스트하는 문제를 만들어주세요. 과거 날짜, 너무 먼 미래, 시작일이 종료일보다 늦은 경우 등을 처리해야 합니다.",
        "skills": ["date validation", "business logic", "complex conditions"],
        "difficulty": "Medium",
    },
    # Medium - 실무 패턴 (M06-M10)
    {
        "id": "M06",
        "goal": "로그 분석 및 알람 판정 함수 테스트. 로그 문자열 리스트를 파싱하여 시간 윈도우 내 에러 발생 횟수를 계산하고, 임계값 초과 시 알람 여부를 반환하는 함수를 테스트하는 문제를 만들어주세요. 로그 파싱, 시간순 정렬, 통계 계산, 경계값 테스트 포함.",
        "skills": ["log-analysis", "parsing", "statistics", "boundary-value", "monitoring"],
        "difficulty": "Medium",
    },
    {
        "id": "M07",
        "goal": "비결정적 코드의 결정적 테스트 작성. 랜덤 쿠폰 코드 생성 함수(prefix + 랜덤 문자열 + 만료일 계산)를 테스트하는 문제를 만들어주세요. 의존성 주입(random_fn, now_fn)을 통해 Flaky 테스트 없이 결정적으로 테스트하는 방법을 학습합니다.",
        "skills": ["dependency-injection", "deterministic-test", "flaky-test", "random", "datetime", "testability"],
        "difficulty": "Medium",
    },
    {
        "id": "M08",
        "goal": "페이지네이션 헬퍼 함수 테스트. paginate(items, page, page_size) 함수를 테스트하는 문제를 만들어주세요. page는 1부터 시작, total_pages 올림 계산, 빈 리스트 처리, has_next/has_prev 플래그, 범위 초과 페이지 처리, page<1이나 page_size<1에 대한 ValueError 등을 검증해야 합니다. API 개발의 기본기를 다루는 실무 필수 패턴입니다.",
        "skills": ["pagination", "api", "boundary-value", "offset-calculation"],
        "difficulty": "Medium",
    },
    {
        "id": "M09",
        "goal": "캐시 매니저 클래스 테스트 (TTL 기반). SimpleCache 클래스의 get(key), set(key, value, ttl_seconds), delete(key), clear(), has(key) 메서드를 테스트하는 문제를 만들어주세요. TTL 만료 검증을 위해 시간 주입(now_fn)을 사용하고, 캐시 히트/미스, 만료된 키 조회, 덮어쓰기 등을 테스트합니다. 시간 모킹이 핵심입니다.",
        "skills": ["cache", "ttl", "time-mock", "class-testing", "state-management"],
        "difficulty": "Medium",
    },
    {
        "id": "M10",
        "goal": "검색 필터 조합 함수 테스트. filter_products(products, filters) 함수를 테스트하는 문제를 만들어주세요. filters는 {price_min, price_max, category, in_stock} 등의 조건을 담은 딕셔너리이고, 여러 조건을 AND로 조합합니다. 빈 필터, 단일 조건, 다중 조건 조합, 모든 조건 불일치, 빈 상품 리스트 등 조합 폭발 문제를 다룹니다.",
        "skills": ["filter", "combinatorial-testing", "search", "multi-condition"],
        "difficulty": "Medium",
    },
    # Hard - 복잡한 비즈니스 로직 (H01-H05)
    {
        "id": "H01",
        "goal": "가격 계산 엔진 함수에 대한 복잡한 비즈니스 로직 테스트. 상품 가격, 수량, 회원 등급(일반/실버/골드), 시즌 할인, 쿠폰, 배송비를 모두 고려하여 최종 결제 금액을 계산하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["complex business logic", "pricing rules", "multiple conditions"],
        "difficulty": "Hard",
    },
    {
        "id": "H02",
        "goal": "데이터 변환 파이프라인 함수 테스트. CSV 형식의 문자열을 입력받아 파싱 → 검증 → 정규화 → 딕셔너리 리스트로 변환하는 다단계 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["data transformation", "pipeline testing", "multi-step processing"],
        "difficulty": "Hard",
    },
    {
        "id": "H03",
        "goal": "부동소수점 경계값 분석 테스트 문제. 온도 단위 변환(섭씨↔화씨) 함수의 정밀도 및 경계값을 테스트하는 문제를 만들어주세요. 소수점 정밀도, 극값, 반올림 오차 등을 고려해야 합니다.",
        "skills": ["floating point precision", "boundary analysis", "numeric accuracy"],
        "difficulty": "Hard",
    },
    {
        "id": "H04",
        "goal": "예외 처리 체인 테스트 문제. 사용자 입력 검증 → 데이터베이스 조회 → 비즈니스 로직 실행 → 결과 반환의 각 단계에서 발생할 수 있는 다양한 예외를 처리하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["exception handling", "error propagation", "multi-layer validation"],
        "difficulty": "Hard",
    },
    {
        "id": "H05",
        "goal": "워크플로우 통합 함수 테스트 문제. 주문 생성(validate_order) → 재고 확인(check_inventory) → 결제 처리(process_payment) → 배송 준비(prepare_shipping)의 전체 워크플로우를 통합하는 함수를 테스트하는 문제를 만들어주세요.",
        "skills": ["workflow testing", "integration testing", "multi-function coordination"],
        "difficulty": "Hard",
    },
    # Hard - 실무 고급 패턴 (H06-H09)
    {
        "id": "H06",
        "goal": "Retry/Backoff API 클라이언트 함수 테스트. fetch_with_retry(url, max_retries, backoff_factor) 함수를 테스트하는 문제를 만들어주세요. 지수 백오프(exponential backoff) 재시도 로직이 포함되어 있고, HTTP 요청은 의존성 주입(http_client)으로 모킹합니다. 재시도 횟수, 대기 시간 검증, 최종 성공/실패 케이스, 타임아웃 등을 테스트합니다.",
        "skills": ["retry", "backoff", "api", "mock", "dependency-injection", "time-control"],
        "difficulty": "Hard",
    },
    {
        "id": "H07",
        "goal": "Rate Limiter (토큰 버킷) 클래스 테스트. TokenBucketRateLimiter 클래스를 테스트하는 문제를 만들어주세요. acquire() 메서드로 토큰 획득, 초기 토큰 수, 리필 속도, 버스트 허용량 등을 설정할 수 있습니다. 시간 주입(now_fn)으로 시간 흐름을 제어하고, 토큰 소진/리필/상한 검증, 버스트 요청, 경계값 테스트를 포함합니다.",
        "skills": ["rate-limiter", "token-bucket", "state-management", "time-mock", "boundary-value"],
        "difficulty": "Hard",
    },
    {
        "id": "H08",
        "goal": "주문 상태 머신(State Machine) 테스트. OrderStateMachine 클래스를 테스트하는 문제를 만들어주세요. 상태: PENDING → PAID → SHIPPED → DELIVERED 또는 CANCELLED. transition(event) 메서드로 상태 전이, 잘못된 전이 시 InvalidTransitionError 발생. 현재 상태에서 가능한 전이 목록 조회, 상태 히스토리 추적 등을 테스트합니다. 거의 모든 서비스에서 사용되는 필수 패턴입니다.",
        "skills": ["state-machine", "state-transition", "business-logic", "error-handling"],
        "difficulty": "Hard",
    },
    {
        "id": "H09",
        "goal": "서킷 브레이커(Circuit Breaker) 패턴 테스트. CircuitBreaker 클래스를 테스트하는 문제를 만들어주세요. 상태: CLOSED(정상) → OPEN(차단) → HALF_OPEN(테스트). call(fn) 메서드로 함수 실행, 연속 실패 시 OPEN으로 전환, 일정 시간 후 HALF_OPEN, 성공 시 CLOSED로 복귀. 실패 임계값, 복구 타임아웃, 상태 전이 검증을 테스트합니다. MSA 필수 패턴입니다.",
        "skills": ["circuit-breaker", "resilience", "state-machine", "time-mock", "msa-pattern"],
        "difficulty": "Hard",
    },
    # Easy - pytest fixture 기초 (E16)
    {
        "id": "E16",
        "goal": "pytest fixture를 활용한 사용자 저장소 테스트. UserRepository 클래스(add_user, get_user, update_user, delete_user, count_users)를 테스트하는 문제를 만들어주세요. @pytest.fixture로 매 테스트마다 새 인스턴스 생성하여 테스트 격리를 보장하고, fixture 간 의존성(sample_user가 repo 사용)을 활용합니다. 클래스 변수로 상태 공유하는 버그는 fixture 없이는 탐지하기 어렵습니다.",
        "skills": ["pytest", "fixture", "class-testing", "state-isolation", "setup-teardown"],
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

