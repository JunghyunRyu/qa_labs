"""
로컬에서 실행하여 short_description 일괄 업데이트

SSM 터미널 인코딩 문제를 우회하기 위해 로컬(UTF-8) 환경에서 실행합니다.

사용법:
    1. ADMIN_SECRET_KEY 환경변수 설정
       Windows: set ADMIN_SECRET_KEY=your-key
       Linux/Mac: export ADMIN_SECRET_KEY=your-key

    2. 스크립트 실행
       python backend/scripts/update_short_descriptions_via_api.py
"""

import os
import re
import sys
import requests
from typing import Optional

# API 설정
API_BASE_URL = "https://qa-arena.qalabs.kr"
ADMIN_KEY = os.environ.get("ADMIN_SECRET_KEY")

if not ADMIN_KEY:
    print("ERROR: ADMIN_SECRET_KEY 환경변수가 설정되지 않았습니다.")
    print("  Windows: set ADMIN_SECRET_KEY=your-key")
    print("  Linux/Mac: export ADMIN_SECRET_KEY=your-key")
    sys.exit(1)


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


def get_all_problems():
    """모든 문제 가져오기"""
    problems = []
    page = 1
    page_size = 50

    while True:
        url = f"{API_BASE_URL}/api/v1/problems?page={page}&page_size={page_size}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        problems.extend(data["problems"])

        if page >= data["total_pages"]:
            break
        page += 1

    return problems


def update_short_descriptions(updates: list):
    """Admin API로 short_description 업데이트"""
    url = f"{API_BASE_URL}/api/admin/problems/short-descriptions"
    headers = {
        "Content-Type": "application/json",
        "X-Admin-Key": ADMIN_KEY,
    }

    response = requests.patch(url, json=updates, headers=headers)
    response.raise_for_status()
    return response.json()


def main():
    """메인 함수"""
    print("문제 목록 가져오는 중...")
    problems = get_all_problems()
    print(f"총 {len(problems)}개 문제 발견")

    # short_description 생성
    updates = []
    for p in problems:
        # description_md가 있으면 추출, 없으면 title 기반
        description_md = p.get("description_md", "")
        short_desc = extract_short_description(p["title"], description_md)

        updates.append({
            "id": p["id"],
            "short_description": short_desc,
        })

        print(f"  [{p['id']}] {p['title'][:40]}...")
        print(f"       → {short_desc[:60]}...")

    # 확인
    print(f"\n총 {len(updates)}개 문제 업데이트 예정")
    confirm = input("계속 진행하시겠습니까? (y/N): ")
    if confirm.lower() != 'y':
        print("취소됨")
        return

    # 배치 업데이트 (20개씩)
    batch_size = 20
    total_updated = 0
    total_failed = 0

    for i in range(0, len(updates), batch_size):
        batch = updates[i:i + batch_size]
        print(f"\n배치 {i // batch_size + 1} 업데이트 중... ({len(batch)}개)")

        try:
            result = update_short_descriptions(batch)
            total_updated += len(result.get("updated", []))
            total_failed += len(result.get("failed", []))
            print(f"  성공: {len(result.get('updated', []))}개, 실패: {len(result.get('failed', []))}개")
        except requests.exceptions.RequestException as e:
            print(f"  ERROR: {e}")
            total_failed += len(batch)

    print(f"\n=== 완료 ===")
    print(f"성공: {total_updated}개")
    print(f"실패: {total_failed}개")


if __name__ == "__main__":
    main()
