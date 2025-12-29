"""JSON 파일에서 short_description을 읽어 로컬 DB 업데이트"""
import json
import os
import requests
from pathlib import Path

API_BASE_URL = 'http://localhost:8000'
ADMIN_KEY = 'test-admin-key-for-local-dev'
GENERATED_PROBLEMS_DIR = Path(__file__).parent.parent / 'generated_problems'


def load_short_descriptions_from_files():
    """generated_problems 디렉토리에서 모든 JSON 파일의 short_description 로드"""
    result = {}  # slug -> short_description

    for json_file in GENERATED_PROBLEMS_DIR.glob('*.json'):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # slug는 파일명에서 추출 (예: CM-VE01.json -> problem-cm-ve01)
            slug = 'problem-' + json_file.stem.lower()
            short_desc = data.get('short_description')

            if short_desc:
                result[slug] = short_desc
        except Exception as e:
            print(f'Error loading {json_file}: {e}')

    return result


def main():
    # 1. JSON 파일에서 short_description 로드
    print('JSON 파일에서 short_description 로드 중...')
    slug_to_desc = load_short_descriptions_from_files()
    print(f'  {len(slug_to_desc)}개 파일에서 short_description 발견')

    # 2. API에서 모든 문제 가져오기
    print('API에서 문제 목록 가져오는 중...')
    problems = []
    page = 1
    while True:
        url = f'{API_BASE_URL}/api/v1/problems?page={page}&page_size=50'
        response = requests.get(url)
        data = response.json()
        problems.extend(data['problems'])
        if page >= data['total_pages']:
            break
        page += 1
    print(f'  총 {len(problems)}개 문제')

    # 3. 매칭하여 업데이트 목록 생성
    updates = []
    matched = 0
    unmatched = []

    for p in problems:
        slug = p['slug']
        if slug in slug_to_desc:
            updates.append({
                'id': p['id'],
                'short_description': slug_to_desc[slug]
            })
            matched += 1
        else:
            unmatched.append(slug)

    print(f'  매칭됨: {matched}개, 매칭 안됨: {len(unmatched)}개')
    if unmatched:
        print(f'  매칭 안된 slug: {unmatched[:5]}...')

    # 4. 배치 업데이트
    if not updates:
        print('업데이트할 항목이 없습니다.')
        return

    batch_size = 20
    total_updated = 0
    total_failed = 0

    for i in range(0, len(updates), batch_size):
        batch = updates[i:i + batch_size]
        url = f'{API_BASE_URL}/api/admin/problems/short-descriptions'
        headers = {'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY}
        response = requests.patch(url, json=batch, headers=headers)
        result = response.json()
        total_updated += len(result.get('updated', []))
        total_failed += len(result.get('failed', []))
        print(f'배치 {i // batch_size + 1}: 성공 {len(result.get("updated", []))}개')

    print(f'\n=== 완료 ===')
    print(f'성공: {total_updated}개')
    print(f'실패: {total_failed}개')


if __name__ == '__main__':
    main()
