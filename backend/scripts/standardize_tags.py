#!/usr/bin/env python3
"""
태그 표준화 마이그레이션 스크립트

193개의 기존 태그를 ~50개의 표준 태그로 통합합니다.

사용법:
    # Dry-run (변경 사항만 확인)
    python scripts/standardize_tags.py --dry-run

    # 실제 적용
    python scripts/standardize_tags.py
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from app.core.config import settings


# =============================================================================
# 표준 태그 정의 (49개)
# =============================================================================

STANDARD_TAGS = {
    # ENV (2개)
    "단위 테스트",
    "통합 테스트",

    # CONCEPT (20개)
    "경계값 분석",
    "동등 분할",
    "조합 테스트",
    "결정 테이블",
    "상태 기반 테스트",
    "예외 처리",
    "입력 검증",
    "모킹",
    "픽스처",
    "시간 제어",
    "의존성 주입",
    "재시도/복원력",
    "Rate Limit",
    "캐시",
    "동시성",
    "보안",
    "Null 처리",
    "다중 조건",
    "데이터 변환",
    "기본 테스트",

    # DOMAIN (15개)
    "문자열",
    "정수",
    "부동소수점",
    "불리언",
    "리스트",
    "딕셔너리",
    "날짜/시간",
    "JSON",
    "CSV",
    "API",
    "파싱",
    "페이지네이션",
    "파일시스템",
    "통계",
    "중첩 구조",

    # CONTEXT (12개)
    "이메일",
    "비밀번호",
    "전화번호",
    "가격/할인",
    "장바구니",
    "결제",
    "배송비",
    "금융",
    "인증/권한",
    "티켓팅",
    "알림",
    "교육/등급",
}


# =============================================================================
# 태그 매핑 테이블 (기존 태그 → 표준 태그)
# None = 제거 (난이도 태그 등)
# =============================================================================

TAG_MAPPING: dict[str, Optional[str]] = {
    # === 난이도 태그 (제거) ===
    "easy": None,
    "medium": None,
    "hard": None,
    "very easy": None,

    # === 불필요/중복 태그 (제거) ===
    "pytest": None,
    "python": None,
    "qa": None,
    "testing": None,
    "unit-test": None,  # "단위 테스트"로 통합

    # === ENV ===
    "단위 테스트": "단위 테스트",
    "통합 테스트": "통합 테스트",

    # === CONCEPT: 경계값 분석 ===
    "경계값 분석": "경계값 분석",
    "경계값": "경계값 분석",
    "boundary": "경계값 분석",
    "boundary value analysis": "경계값 분석",
    "이변수 경계": "경계값 분석",
    "사변수 경계": "경계값 분석",
    "의존적 경계": "경계값 분석",
    "다차원 경계": "경계값 분석",
    "시간 기반 경계": "경계값 분석",
    "문자열 길이 경계": "경계값 분석",
    "two-variable boundary": "경계값 분석",
    "dependent boundaries": "경계값 분석",
    "range validation": "경계값 분석",
    "range overlap": "경계값 분석",
    "index validation": "경계값 분석",
    "범위 검증": "경계값 분석",
    "인덱스 검증": "경계값 분석",
    "엣지 케이스": "경계값 분석",
    "time boundary": "경계값 분석",
    "interval": "경계값 분석",

    # === CONCEPT: 동등 분할 ===
    "동등 분할": "동등 분할",
    "equivalence partitioning": "동등 분할",

    # === CONCEPT: 조합 테스트 ===
    "조합 테스트": "조합 테스트",
    "combinational testing": "조합 테스트",
    "combinatorial testing": "조합 테스트",
    "pairwise testing": "조합 테스트",
    "페어와이즈 테스트": "조합 테스트",
    "불리언 조합": "조합 테스트",
    "삼변수 조합": "조합 테스트",
    "다수준 조합": "조합 테스트",
    "오변수 조합": "조합 테스트",
    "multidimensional testing": "조합 테스트",

    # === CONCEPT: 결정 테이블 ===
    "결정 테이블": "결정 테이블",
    "decision table": "결정 테이블",
    "결정적 테스트": "결정 테이블",

    # === CONCEPT: 상태 기반 테스트 ===
    "상태 기반 테스트": "상태 기반 테스트",
    "state-based testing": "상태 기반 테스트",
    "state transition": "상태 기반 테스트",
    "상태 전이": "상태 기반 테스트",
    "상태 머신": "상태 기반 테스트",
    "fsm": "상태 기반 테스트",
    "stateful": "상태 기반 테스트",
    "state": "상태 기반 테스트",
    "상태 관리": "상태 기반 테스트",
    "워크플로우 테스트": "상태 기반 테스트",

    # === CONCEPT: 예외 처리 ===
    "예외 처리": "예외 처리",
    "예외 테스트": "예외 처리",
    "오류 처리": "예외 처리",
    "오류 전파": "예외 처리",
    "error handling": "예외 처리",

    # === CONCEPT: 입력 검증 ===
    "입력 검증": "입력 검증",
    "input validation": "입력 검증",
    "validation": "입력 검증",
    "검증": "입력 검증",
    "다층 검증": "입력 검증",
    "형식 검증": "입력 검증",
    "constraint handling": "입력 검증",
    "제약 조건 처리": "입력 검증",
    "date validation": "입력 검증",
    "checksum validation": "입력 검증",
    "format validation": "입력 검증",
    "length validation": "입력 검증",
    "permission validation": "입력 검증",

    # === CONCEPT: 모킹 ===
    "모킹": "모킹",

    # === CONCEPT: 픽스처 ===
    "픽스처": "픽스처",
    "Setup/Teardown": "픽스처",
    "상태 격리": "픽스처",

    # === CONCEPT: 시간 제어 ===
    "시간 제어": "시간 제어",
    "시간 모킹": "시간 제어",
    "time comparison": "시간 제어",
    "time": "시간 제어",

    # === CONCEPT: 의존성 주입 ===
    "의존성 주입": "의존성 주입",

    # === CONCEPT: 재시도/복원력 ===
    "재시도": "재시도/복원력",
    "백오프": "재시도/복원력",
    "회복탄력성": "재시도/복원력",
    "서킷 브레이커": "재시도/복원력",

    # === CONCEPT: Rate Limit ===
    "Rate Limit": "Rate Limit",
    "토큰 버킷": "Rate Limit",

    # === CONCEPT: 캐시 ===
    "캐시": "캐시",
    "cache": "캐시",
    "lru": "캐시",
    "TTL": "캐시",

    # === CONCEPT: 동시성 ===
    "concurrency testing": "동시성",
    "race condition": "동시성",
    "thread safety": "동시성",

    # === CONCEPT: 보안 ===
    "security": "보안",
    "authentication": "보안",
    "authorization": "보안",
    "access-control": "보안",
    "xss": "보안",
    "접근 제어": "보안",

    # === CONCEPT: Null 처리 ===
    "Null 처리": "Null 처리",
    "null handling": "Null 처리",
    "null 처리": "Null 처리",

    # === CONCEPT: 다중 조건 ===
    "다중 조건": "다중 조건",
    "다중 파라미터": "다중 조건",
    "복잡한 조건": "다중 조건",
    "선택적 매개변수": "다중 조건",
    "optional parameters": "다중 조건",
    "다중 함수 조정": "다중 조건",

    # === CONCEPT: 데이터 변환 ===
    "데이터 변환": "데이터 변환",
    "다단계 처리": "데이터 변환",
    "파이프라인 테스트": "데이터 변환",
    "데이터 포맷팅": "데이터 변환",

    # === CONCEPT: 기본 테스트 ===
    "기본 테스트": "기본 테스트",
    "basic testing": "기본 테스트",
    "테스트 용이성": "기본 테스트",
    "클래스 테스트": "기본 테스트",
    "자료구조 테스트": "기본 테스트",
    "data structure reasoning": "기본 테스트",
    "플래키 테스트": "기본 테스트",

    # === DOMAIN: 문자열 ===
    "문자열": "문자열",
    "string": "문자열",
    "문자열 처리": "문자열",
    "문자열 검증": "문자열",
    "문자열 분석": "문자열",
    "문자열 기초": "문자열",
    "텍스트 검증": "문자열",
    "formatting": "문자열",

    # === DOMAIN: 정수 ===
    "정수": "정수",
    "integer": "정수",
    "정수 범위": "정수",
    "numeric": "정수",
    "숫자": "정수",
    "산술 연산": "정수",
    "기본 수학": "정수",
    "수학": "정수",
    "나눗셈": "정수",
    "양수/음수 값": "정수",

    # === DOMAIN: 부동소수점 ===
    "부동소수점 정밀도": "부동소수점",
    "수치 정확도": "부동소수점",
    "온도": "부동소수점",

    # === DOMAIN: 불리언 ===
    "불리언 로직": "불리언",
    "boolean": "불리언",
    "boolean logic": "불리언",
    "boolean-logic": "불리언",
    "boolean-flags": "불리언",
    "비교 연산": "불리언",
    "비교 연산자": "불리언",
    "comparison": "불리언",

    # === DOMAIN: 리스트 ===
    "리스트": "리스트",
    "리스트 연산": "리스트",
    "리스트 검증": "리스트",
    "정렬": "리스트",
    "filter": "리스트",
    "필터": "리스트",
    "검색": "리스트",

    # === DOMAIN: 딕셔너리 ===
    "딕셔너리": "딕셔너리",
    "dict": "딕셔너리",
    "dictionary": "딕셔너리",
    "딕셔너리 연산": "딕셔너리",
    "키 검증": "딕셔너리",
    "mapping": "딕셔너리",

    # === DOMAIN: 날짜/시간 ===
    "날짜/시간": "날짜/시간",
    "date-time": "날짜/시간",
    "calendar": "날짜/시간",
    "leap-year": "날짜/시간",
    "날짜 검증": "날짜/시간",
    "윤년": "날짜/시간",
    "랜덤": "날짜/시간",

    # === DOMAIN: JSON ===
    "JSON": "JSON",
    "json": "JSON",

    # === DOMAIN: CSV ===
    "CSV": "CSV",

    # === DOMAIN: API ===
    "API": "API",
    "api": "API",
    "api design": "API",
    "http": "API",
    "status-code": "API",
    "API 검증": "API",
    "응답 처리": "API",
    "MSA 패턴": "API",

    # === DOMAIN: 파싱 ===
    "파싱": "파싱",
    "parsing": "파싱",
    "markdown": "파싱",
    "로그 분석": "파싱",

    # === DOMAIN: 페이지네이션 ===
    "페이지네이션": "페이지네이션",
    "pagination": "페이지네이션",
    "오프셋 계산": "페이지네이션",

    # === DOMAIN: 파일시스템 ===
    "파일시스템": "파일시스템",
    "경로": "파일시스템",

    # === DOMAIN: 통계 ===
    "통계": "통계",

    # === DOMAIN: 중첩 구조 ===
    "중첩 구조": "중첩 구조",

    # === CONTEXT: 이메일 ===
    "이메일": "이메일",

    # === CONTEXT: 비밀번호 ===
    "비밀번호": "비밀번호",

    # === CONTEXT: 전화번호 ===
    "전화번호": "전화번호",

    # === CONTEXT: 가격/할인 ===
    "가격 계산": "가격/할인",
    "가격 로직": "가격/할인",
    "가격 포맷": "가격/할인",
    "할인": "가격/할인",
    "할인 로직": "가격/할인",
    "연령별 할인": "가격/할인",
    "currency": "가격/할인",
    "price": "가격/할인",
    "pricing": "가격/할인",
    "요금 계산": "가격/할인",
    "구간 겹침": "가격/할인",
    "구간 테스트": "가격/할인",

    # === CONTEXT: 장바구니 ===
    "장바구니": "장바구니",
    "e-commerce": "장바구니",
    "이커머스": "장바구니",

    # === CONTEXT: 결제 ===
    "결제": "결제",

    # === CONTEXT: 배송비 ===
    "배송비": "배송비",

    # === CONTEXT: 금융 ===
    "finance": "금융",
    "financial calculation": "금융",
    "fee calculation": "금융",
    "보험 로직": "금융",
    "insurance": "금융",
    "Luhn 알고리즘": "금융",
    "luhn": "금융",
    "체크섬 검증": "금융",

    # === CONTEXT: 인증/권한 ===
    "session": "인증/권한",
    "logging": "인증/권한",
    "모니터링": "인증/권한",

    # === CONTEXT: 티켓팅 ===
    "티켓팅": "티켓팅",

    # === CONTEXT: 알림 ===
    "알림 로직": "알림",
    "notification": "알림",

    # === CONTEXT: 교육/등급 ===
    "교육": "교육/등급",
    "등급 계산": "교육/등급",

    # === 비즈니스 로직 (분산) ===
    "비즈니스 로직": "입력 검증",
    "business-logic": "입력 검증",
    "객체 생명주기": "상태 기반 테스트",
}


def normalize_tags(skills: list[str] | None) -> list[str]:
    """태그 목록을 정규화합니다."""
    if not skills:
        return []

    result = set()
    unmapped = []

    for tag in skills:
        tag_lower = tag.lower()

        # 1. 정확히 매핑된 경우
        if tag in TAG_MAPPING:
            mapped = TAG_MAPPING[tag]
            if mapped is not None:
                result.add(mapped)
            continue

        # 2. 소문자로 매핑 시도
        if tag_lower in TAG_MAPPING:
            mapped = TAG_MAPPING[tag_lower]
            if mapped is not None:
                result.add(mapped)
            continue

        # 3. 이미 표준 태그인 경우
        if tag in STANDARD_TAGS:
            result.add(tag)
            continue

        # 4. 매핑되지 않은 태그
        unmapped.append(tag)

    return sorted(result), unmapped


def migrate_tags(dry_run: bool = True):
    """데이터베이스의 모든 태그를 정규화합니다."""
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        # 1. 모든 문제 조회
        result = conn.execute(text("SELECT id, slug, skills FROM problems WHERE skills IS NOT NULL"))
        problems = result.fetchall()

        print(f"\n총 {len(problems)}개 문제 처리 중...\n")

        all_unmapped = set()
        changes = []

        for problem in problems:
            problem_id, slug, skills = problem

            if not skills:
                continue

            # 태그 정규화
            normalized, unmapped = normalize_tags(skills)
            all_unmapped.update(unmapped)

            # 변경 사항이 있는 경우
            if set(skills) != set(normalized):
                changes.append({
                    "id": problem_id,
                    "slug": slug,
                    "before": skills,
                    "after": normalized,
                })

        # 결과 출력
        print("=" * 60)
        print("변경 사항 요약")
        print("=" * 60)

        for change in changes:
            print(f"\n[{change['slug']}]")
            print(f"  Before ({len(change['before'])}): {', '.join(sorted(change['before']))}")
            print(f"  After  ({len(change['after'])}): {', '.join(sorted(change['after']))}")

            removed = set(change['before']) - set(change['after'])
            added = set(change['after']) - set(change['before'])

            if removed:
                print(f"  제거됨: {', '.join(sorted(removed))}")
            if added:
                print(f"  추가됨: {', '.join(sorted(added))}")

        print("\n" + "=" * 60)
        print(f"총 {len(changes)}개 문제 변경 예정")
        print("=" * 60)

        if all_unmapped:
            print(f"\n⚠️  매핑되지 않은 태그 ({len(all_unmapped)}개):")
            for tag in sorted(all_unmapped):
                print(f"    - {tag}")

        # 실제 적용
        if not dry_run and changes:
            print("\n실제 적용 중...")

            for change in changes:
                conn.execute(
                    text("UPDATE problems SET skills = :skills WHERE id = :id"),
                    {"skills": json.dumps(change["after"]), "id": change["id"]}
                )

            conn.commit()
            print(f"✅ {len(changes)}개 문제 업데이트 완료")
        elif dry_run:
            print("\n📋 Dry-run 모드입니다. 실제 변경은 없습니다.")
            print("   실제 적용하려면 --dry-run 옵션 없이 실행하세요.")


def show_tag_statistics():
    """현재 태그 통계를 출력합니다."""
    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT tag, COUNT(*) as cnt
            FROM (
                SELECT jsonb_array_elements_text(skills) as tag
                FROM problems
                WHERE skills IS NOT NULL
            ) t
            GROUP BY tag
            ORDER BY cnt DESC
        """))

        tags = result.fetchall()

        print("\n현재 태그 통계:")
        print("=" * 40)
        for tag, cnt in tags[:30]:
            print(f"  {tag}: {cnt}")

        if len(tags) > 30:
            print(f"  ... 외 {len(tags) - 30}개")

        print(f"\n총 {len(tags)}개 고유 태그")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="태그 표준화 마이그레이션")
    parser.add_argument("--dry-run", action="store_true", help="실제 변경 없이 결과만 확인")
    parser.add_argument("--stats", action="store_true", help="현재 태그 통계 출력")

    args = parser.parse_args()

    if args.stats:
        show_tag_statistics()
    else:
        migrate_tags(dry_run=args.dry_run)
