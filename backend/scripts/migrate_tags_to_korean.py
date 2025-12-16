"""태그를 영문에서 한국어로 마이그레이션하는 스크립트"""
import json
import os
from pathlib import Path

# 영문 → 한국어 태그 매핑
TAG_MAPPING = {
    # 난이도 (제거 대상 - difficulty 필드로 관리)
    "very easy": None,
    "easy": None,
    "medium": None,
    "hard": None,

    # 환경/형식 (hidden 처리)
    "python": None,
    "pytest": None,
    "qa": None,
    "testing": None,
    "beginner": None,

    # === 테스트 기법 (핵심) ===
    "unit-test": "단위 테스트",
    "integration-test": "통합 테스트",
    "boundary value analysis": "경계값 분석",
    "boundary analysis": "경계값 분석",
    "boundary-value": "경계값 분석",
    "equivalence partitioning": "동등 분할",
    "combinatorial testing": "조합 테스트",
    "pairwise testing": "페어와이즈 테스트",
    "decision table": "결정 테이블",
    "state-based testing": "상태 기반 테스트",
    "error handling": "오류 처리",
    "error-handling": "오류 처리",
    "exception handling": "예외 처리",
    "exception testing": "예외 테스트",
    "error propagation": "오류 전파",
    "input validation": "입력 검증",
    "multi-layer validation": "다층 검증",
    "dependency-injection": "의존성 주입",
    "deterministic-test": "결정적 테스트",
    "flaky-test": "플래키 테스트",
    "basic testing": "기본 테스트",

    # === 경계값 분석 세부 ===
    "range validation": "범위 검증",
    "index validation": "인덱스 검증",
    "two-variable boundary": "이변수 경계",
    "four-variable boundary": "사변수 경계",
    "dependent boundaries": "의존적 경계",
    "multi-dimension boundary": "다차원 경계",
    "time-based boundaries": "시간 기반 경계",
    "string length boundary": "문자열 길이 경계",
    "boundary": "경계값",
    "edge cases": "엣지 케이스",

    # === 조합 테스트 세부 ===
    "boolean combinations": "불리언 조합",
    "three-variable combinations": "삼변수 조합",
    "multi-level combinations": "다수준 조합",
    "five-parameter combinations": "오변수 조합",
    "optional parameters": "선택적 매개변수",
    "constraint handling": "제약 조건 처리",
    "null handling": "null 처리",
    "multi-parameter": "다중 파라미터",
    "multi-condition": "다중 조건",
    "access control": "접근 제어",
    "notification logic": "알림 로직",

    # === 도메인/데이터 ===
    "string": "문자열",
    "string manipulation": "문자열 처리",
    "string validation": "문자열 검증",
    "string analysis": "문자열 분석",
    "string basics": "문자열 기초",
    "format validation": "형식 검증",
    "data formatting": "데이터 포맷팅",
    "text-validation": "텍스트 검증",
    "integer": "정수",
    "integer-range": "정수 범위",
    "number": "숫자",
    "arithmetic operations": "산술 연산",
    "basic math": "기본 수학",
    "math": "수학",
    "floating point precision": "부동소수점 정밀도",
    "numeric accuracy": "수치 정확도",
    "boolean logic": "불리언 로직",
    "comparison": "비교 연산",
    "comparison operators": "비교 연산자",
    "positive/negative values": "양수/음수 값",

    # === 자료구조 ===
    "dictionary": "딕셔너리",
    "dictionary operations": "딕셔너리 연산",
    "dict": "딕셔너리",
    "key validation": "키 검증",
    "list": "리스트",
    "list operations": "리스트 연산",
    "list validation": "리스트 검증",
    "sorting": "정렬",
    "nested structures": "중첩 구조",
    "data structure testing": "자료구조 테스트",

    # === 실무 도메인 ===
    "email": "이메일",
    "password": "비밀번호",
    "phone-number": "전화번호",
    "path": "경로",
    "filesystem": "파일시스템",
    "csv": "CSV",
    "json": "JSON",
    "api": "API",
    "api validation": "API 검증",
    "response-handling": "응답 처리",
    "datetime": "날짜/시간",
    "date validation": "날짜 검증",
    "leap year": "윤년",
    "random": "랜덤",
    "temperature": "온도",
    "statistics": "통계",
    "parsing": "파싱",

    # === 비즈니스 로직 ===
    "business-logic": "비즈니스 로직",
    "business logic": "비즈니스 로직",
    "validation": "검증",
    "pricing": "가격 계산",
    "pricing logic": "가격 로직",
    "discount": "할인",
    "discount logic": "할인 로직",
    "cart": "장바구니",
    "shopping-cart": "장바구니",
    "billing": "결제",
    "e-commerce": "이커머스",
    "order validation": "주문 검증",
    "shipping cost": "배송비",
    "age-based discount": "연령별 할인",
    "ticketing": "티켓팅",
    "grade calculation": "등급 계산",
    "education": "교육",
    "insurance logic": "보험 로직",
    "rate calculation": "요금 계산",
    "range overlap": "구간 겹침",
    "interval testing": "구간 테스트",
    "luhn algorithm": "Luhn 알고리즘",
    "checksum validation": "체크섬 검증",

    # === 상태/시간 관리 ===
    "state-management": "상태 관리",
    "state-machine": "상태 머신",
    "state-transition": "상태 전이",
    "state-isolation": "상태 격리",
    "setup-teardown": "Setup/Teardown",
    "class-testing": "클래스 테스트",
    "fixture": "픽스처",
    "time-control": "시간 제어",
    "time-mock": "시간 모킹",
    "mock": "모킹",
    "testability": "테스트 용이성",

    # === 인프라/패턴 ===
    "retry": "재시도",
    "backoff": "백오프",
    "rate-limiter": "Rate Limit",
    "token-bucket": "토큰 버킷",
    "circuit-breaker": "서킷 브레이커",
    "resilience": "회복탄력성",
    "msa-pattern": "MSA 패턴",
    "log-analysis": "로그 분석",
    "monitoring": "모니터링",
    "cache": "캐시",
    "ttl": "TTL",
    "pagination": "페이지네이션",
    "offset calculation": "오프셋 계산",
    "offset-calculation": "오프셋 계산",
    "filter": "필터",
    "search": "검색",

    # === 데이터 처리 ===
    "data transformation": "데이터 변환",
    "multi-step processing": "다단계 처리",
    "pipeline testing": "파이프라인 테스트",
    "workflow testing": "워크플로우 테스트",
    "integration testing": "통합 테스트",
    "multi-function coordination": "다중 함수 조정",
    "complex conditions": "복잡한 조건",
    "division": "나눗셈",
}

def migrate_tags(tags: list) -> list:
    """태그 리스트를 한국어로 변환"""
    result = []
    seen = set()

    for tag in tags:
        tag_lower = tag.lower()

        # 매핑 테이블에서 찾기
        if tag_lower in TAG_MAPPING:
            korean = TAG_MAPPING[tag_lower]
            if korean is None:  # 제거 대상
                continue
            if korean not in seen:
                result.append(korean)
                seen.add(korean)
        else:
            # 매핑에 없으면 원본 유지 (경고 출력)
            print(f"  [경고] 매핑 없음: '{tag}'")
            if tag not in seen:
                result.append(tag)
                seen.add(tag)

    return result


def migrate_file(filepath: Path) -> bool:
    """단일 JSON 파일 마이그레이션"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if 'tags' not in data:
        return False

    original_tags = data['tags']
    new_tags = migrate_tags(original_tags)

    if original_tags != new_tags:
        print(f"\n{filepath.name}:")
        print(f"  원본: {original_tags}")
        print(f"  변환: {new_tags}")

        data['tags'] = new_tags

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return True

    return False


def main():
    script_dir = Path(__file__).parent.parent
    problems_dir = script_dir / "generated_problems"

    print("=" * 60)
    print("태그 한국어 마이그레이션 시작")
    print("=" * 60)

    migrated = 0
    skipped = 0

    for filepath in sorted(problems_dir.glob("*.json")):
        if migrate_file(filepath):
            migrated += 1
        else:
            skipped += 1

    print("\n" + "=" * 60)
    print(f"완료! 변환됨: {migrated}, 변경없음: {skipped}")
    print("=" * 60)


if __name__ == "__main__":
    main()
