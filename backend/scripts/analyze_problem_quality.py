"""문제 품질 분석 스크립트"""
import json
from pathlib import Path

problems_dir = Path(__file__).parent.parent / 'generated_problems'
results = []

for f in sorted(problems_dir.glob('*.json')):
    try:
        data = json.load(open(f, encoding='utf-8'))
        desc = data.get('description_md', '')

        # 품질 체크
        has_service_name = any(x in desc for x in ['**', '토스', 'Notion', 'Slack', '카카오', '배민', '쿠팡', '넷플릭스', '당근'])
        has_call_volume = any(x in desc for x in ['일 ', '건', '만 건', '호출 규모', '호출 빈도'])
        has_input_contract = '입력 계약' in desc and '타입' in desc
        has_output_contract = '출력 계약' in desc or ('반환값' in desc and '조건' in desc)
        has_test_strategy = '테스트 전략' in desc or '핵심 테스트 포인트' in desc
        has_example = '예제' in desc and '```python' in desc
        has_hint = '힌트' in desc
        has_quantified_risk = any(x in desc for x in ['%', '만원', '억원'])

        score = sum([
            has_service_name * 1,
            has_call_volume * 1,
            has_input_contract * 1,
            has_output_contract * 1,
            has_test_strategy * 2,
            has_example * 1,
            has_hint * 1,
            has_quantified_risk * 2,
        ])

        difficulty = data.get('difficulty', 'Unknown')
        problem_id = data.get('problem_id', f.stem)

        results.append({
            'id': problem_id,
            'file': f.stem,
            'difficulty': difficulty,
            'score': score,
            'service': has_service_name,
            'volume': has_call_volume,
            'input': has_input_contract,
            'output': has_output_contract,
            'strategy': has_test_strategy,
            'example': has_example,
            'hint': has_hint,
            'risk': has_quantified_risk,
        })
    except Exception as e:
        results.append({'id': f.stem, 'file': f.stem, 'error': str(e)})

# 점수별 그룹화
perfect = [r for r in results if r.get('score', 0) >= 9]
good = [r for r in results if 5 <= r.get('score', 0) < 9]
needs_work = [r for r in results if r.get('score', 0) < 5]

print('=== Problem Quality Status ===')
print(f'Total: {len(results)} problems')
print(f'[GOOD] 9+: {len(perfect)}')
print(f'[OK] 5-8: {len(good)}')
print(f'[NEED] <5: {len(needs_work)}')
print()

if perfect:
    print('=== GOOD Problems ===')
    for r in sorted(perfect, key=lambda x: -x.get('score', 0)):
        print(f"  {r['id']} ({r.get('difficulty','?')}) - {r.get('score',0)}/10")
    print()

print('=== NEEDS IMPROVEMENT ===')
for r in sorted(needs_work, key=lambda x: x.get('score', 0)):
    missing = []
    if not r.get('service'): missing.append('svc')
    if not r.get('volume'): missing.append('vol')
    if not r.get('input'): missing.append('in')
    if not r.get('output'): missing.append('out')
    if not r.get('strategy'): missing.append('strat')
    if not r.get('example'): missing.append('ex')
    if not r.get('hint'): missing.append('hint')
    if not r.get('risk'): missing.append('risk')
    print(f"  {r['file']} ({r.get('difficulty','?')}) {r.get('score',0)}/10 miss:[{','.join(missing)}]")
