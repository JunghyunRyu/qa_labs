"""태그 정규화 스크립트: 영어 태그를 한국 QA 용어로 통일"""
import json
from pathlib import Path

GENERATED_PROBLEMS_DIR = Path(__file__).parent.parent / 'generated_problems'

# 삭제할 태그 (난이도는 별도 필드로 관리)
TAGS_TO_REMOVE = {
    'very easy', 'easy', 'medium', 'hard',
    'python',  # 언어는 별도 관리
    'pytest',  # 프레임워크는 별도 관리
    'qa',  # 너무 일반적
}

# 영어 → 한글 매핑 (한국 QA에서 자주 사용하는 용어)
TAG_MAPPING = {
    # 테스트 기법
    'unit-test': '단위 테스트',
    'unit test': '단위 테스트',
    'basic testing': '기본 테스트',
    'boundary value analysis': '경계값 분석',
    'equivalence partitioning': '동등 분할',
    'decision table': '결정 테이블',
    'state transition': '상태 전이',
    'state-based testing': '상태 기반 테스트',
    'combinational testing': '조합 테스트',
    'combinatorial testing': '조합 테스트',
    'pairwise testing': '페어와이즈 테스트',
    'multidimensional testing': '다차원 테스트',
    'concurrency testing': '동시성 테스트',

    # 데이터 타입
    'string': '문자열',
    'integer': '정수',
    'boolean': '불리언',
    'boolean logic': '불리언 로직',
    'boolean-logic': '불리언 로직',
    'boolean-flags': '불리언 플래그',
    'numeric': '숫자',
    'dict': '딕셔너리',
    'dictionary': '딕셔너리',
    'date-time': '날짜/시간',
    'time': '시간',
    'calendar': '달력',
    'currency': '통화',

    # 검증/처리
    'validation': '검증',
    'input validation': '입력 검증',
    'error handling': '오류 처리',
    'exception-handling': '예외 처리',
    'null handling': 'null 처리',
    'type-validation': '타입 검증',
    'format validation': '형식 검증',
    'length validation': '길이 검증',
    'range validation': '범위 검증',
    'date validation': '날짜 검증',
    'index validation': '인덱스 검증',
    'permission validation': '권한 검증',
    'checksum validation': '체크섬 검증',
    'constraint handling': '제약조건 처리',

    # 도메인
    'finance': '금융',
    'financial calculation': '금융 계산',
    'e-commerce': '이커머스',
    'insurance': '보험',
    'pricing': '가격 책정',
    'price': '가격',
    'fee calculation': '수수료 계산',

    # 기술 용어
    'parsing': '파싱',
    'formatting': '포매팅',
    'filter': '필터',
    'mapping': '매핑',
    'comparison': '비교',
    'sorting': '정렬',
    'pagination': '페이지네이션',
    'cache': '캐시',
    'logging': '로깅',
    'notification': '알림',
    'session': '세션',
    'state': '상태',
    'stateful': '상태 유지',

    # 보안
    'security': '보안',
    'authentication': '인증',
    'authorization': '인가',
    'access-control': '접근 제어',
    'xss': 'XSS',

    # API/네트워크
    'api': 'API',
    'api design': 'API 설계',
    'http': 'HTTP',
    'status-code': '상태 코드',

    # 테스트 관련
    'pytest': 'pytest',
    'mocking': '모킹',
    'fixture': '픽스처',
    'Setup/Teardown': '설정/해제',

    # 기타
    'optional parameters': '선택적 파라미터',
    'dependent boundaries': '의존적 경계값',
    'two-variable boundary': '이변수 경계값',
    'time boundary': '시간 경계값',
    'range overlap': '범위 중첩',
    'time comparison': '시간 비교',
    'data structure reasoning': '자료구조 추론',
    'business-logic': '비즈니스 로직',
    'race condition': '경쟁 상태',
    'thread safety': '스레드 안전성',
    'interval': '구간',
    'leap-year': '윤년',
    'luhn': 'Luhn 알고리즘',
    'lru': 'LRU',
    'fsm': '유한 상태 머신',
    'markdown': '마크다운',
}

# 유지할 영어 태그 (기술 표준 용어)
KEEP_ENGLISH = {
    'API', 'JSON', 'CSV', 'HTTP', 'XSS', 'TTL', 'MSA 패턴',
    'Rate Limit', 'pytest', 'Luhn 알고리즘', 'LRU',
}


def normalize_tag(tag: str) -> str | None:
    """태그를 정규화. 삭제할 태그면 None 반환."""
    tag_lower = tag.lower().strip()

    # 삭제할 태그
    if tag_lower in TAGS_TO_REMOVE:
        return None

    # 매핑에 있으면 변환
    if tag_lower in TAG_MAPPING:
        return TAG_MAPPING[tag_lower]

    # 이미 한글이거나 유지할 영어면 그대로
    return tag


def normalize_tags(tags: list) -> list:
    """태그 리스트 정규화"""
    normalized = []
    seen = set()

    for tag in tags:
        new_tag = normalize_tag(tag)
        if new_tag and new_tag.lower() not in seen:
            normalized.append(new_tag)
            seen.add(new_tag.lower())

    return normalized


def main():
    """모든 JSON 파일의 태그 정규화"""
    updated_count = 0

    for json_file in sorted(GENERATED_PROBLEMS_DIR.glob('*.json')):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            old_tags = data.get('tags', [])
            new_tags = normalize_tags(old_tags)

            if old_tags != new_tags:
                data['tags'] = new_tags

                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)

                removed = set(old_tags) - set(new_tags)
                added = set(new_tags) - set(old_tags)

                print(f'{json_file.name}:')
                if removed:
                    print(f'  제거: {removed}')
                if added:
                    print(f'  변경: {added}')

                updated_count += 1

        except Exception as e:
            print(f'Error processing {json_file}: {e}')

    print(f'\n=== 완료: {updated_count}개 파일 수정 ===')


if __name__ == '__main__':
    main()
