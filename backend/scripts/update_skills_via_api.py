"""JSON 파일에서 skills(tags)를 읽어 로컬 DB 업데이트"""
import json
import requests
from pathlib import Path

API_BASE_URL = 'http://localhost:8000'
ADMIN_KEY = 'test-admin-key-for-local-dev'
GENERATED_PROBLEMS_DIR = Path(__file__).parent.parent / 'generated_problems'


def load_skills_from_files():
    """generated_problems 디렉토리에서 모든 JSON 파일의 tags 로드"""
    result = {}  # slug -> tags

    for json_file in GENERATED_PROBLEMS_DIR.glob('*.json'):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # slug는 파일명에서 추출 (예: CM-VE01.json -> problem-cm-ve01)
            slug = 'problem-' + json_file.stem.lower()
            tags = data.get('tags', [])

            if tags:
                result[slug] = tags
        except Exception as e:
            print(f'Error loading {json_file}: {e}')

    return result


def main():
    # 1. JSON 파일에서 tags 로드
    print('JSON 파일에서 tags 로드 중...')
    slug_to_tags = load_skills_from_files()
    print(f'  {len(slug_to_tags)}개 파일에서 tags 발견')

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

    for p in problems:
        slug = p['slug']
        if slug in slug_to_tags:
            updates.append({
                'id': p['id'],
                'skills': slug_to_tags[slug]
            })
            matched += 1

    print(f'  매칭됨: {matched}개')

    # 4. 배치 업데이트
    if not updates:
        print('업데이트할 항목이 없습니다.')
        return

    batch_size = 20
    total_updated = 0
    total_failed = 0

    for i in range(0, len(updates), batch_size):
        batch = updates[i:i + batch_size]
        url = f'{API_BASE_URL}/api/admin/problems/skills'
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
