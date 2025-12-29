"""
기존 문제들에 short_description 필드 생성

이 스크립트는 기존 문제들의 description_md에서 짧은 설명을 추출하여
short_description 필드에 저장합니다.
"""

import sys
import re
from pathlib import Path

# 프로젝트 루트를 path에 추가
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR.parent))

from sqlalchemy.orm import Session
from app.models.db import SessionLocal
from app.models.problem import Problem


def extract_short_description(title: str, description_md: str) -> str:
    """description_md에서 짧은 설명 추출"""

    # 1. 첫 번째 문단에서 함수 설명 찾기 (## 문제 설명 다음)
    intro_match = re.search(
        r'##\s*문제\s*설명\s*\n+(.+?)(?:\n\n|###)',
        description_md,
        re.DOTALL
    )
    if intro_match:
        intro = intro_match.group(1).strip()
        # 마크다운/코드 제거
        intro = re.sub(r'`[^`]+`', '', intro)
        intro = re.sub(r'\*\*([^*]+)\*\*', r'\1', intro)
        intro = intro.strip()

        # "함수에 버그가 숨어 있을 수 있습니다" 같은 일반적인 문장 제외
        if intro and '버그가 숨어' not in intro and len(intro) > 20:
            # 첫 문장만 추출
            sentences = re.split(r'[.!?]\s+', intro)
            if sentences:
                first_sentence = sentences[0].strip()
                if len(first_sentence) > 10:
                    return first_sentence[:150] + ('...' if len(first_sentence) > 150 else '')

    # 2. docstring에서 설명 추출
    docstring_match = re.search(
        r'"""(.+?)(?:Args:|Returns:|Raises:|""")',
        description_md,
        re.DOTALL
    )
    if docstring_match:
        doc = docstring_match.group(1).strip()
        # 줄바꿈 정리
        doc = re.sub(r'\n+', ' ', doc).strip()
        if doc and len(doc) > 10:
            return doc[:150] + ('...' if len(doc) > 150 else '')

    # 3. 제목 기반 생성 (fallback)
    # "XXX 테스트" → "XXX 함수를 테스트합니다"
    title_clean = re.sub(r'\s*테스트\s*$', '', title)
    title_clean = re.sub(r'\s*함수\s*$', '', title_clean)
    return f"{title_clean} 함수를 테스트합니다."


def main():
    """메인 함수"""
    db: Session = SessionLocal()

    try:
        # 모든 문제 조회
        problems = db.query(Problem).all()
        print(f"총 {len(problems)}개 문제 처리 중...")

        updated_count = 0
        for problem in problems:
            # 이미 short_description이 있으면 스킵
            if problem.short_description:
                print(f"  [{problem.id}] {problem.title[:30]}... - 이미 존재, 스킵")
                continue

            # short_description 생성
            short_desc = extract_short_description(
                problem.title,
                problem.description_md
            )

            # 업데이트
            problem.short_description = short_desc
            updated_count += 1

            print(f"  [{problem.id}] {problem.title[:30]}...")
            print(f"       → {short_desc[:60]}...")

        # 커밋
        db.commit()
        print(f"\n✅ {updated_count}개 문제 업데이트 완료")

    except Exception as e:
        db.rollback()
        print(f"❌ 오류 발생: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
