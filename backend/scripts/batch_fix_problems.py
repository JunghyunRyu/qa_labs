#!/usr/bin/env python3
"""
pytest 문제 공통 누락 항목 일괄 수정 스크립트
- C1: 입력 타입 에러 처리 추가
- C2: None 입력 처리 추가
- C3: 빈 입력 처리 추가
"""

import json
import re
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


@dataclass
class FixResult:
    file_name: str
    fixed_items: list
    skipped_items: list
    error: Optional[str] = None


def get_input_contract_section(signature: str) -> str:
    """함수 시그니처 기반으로 입력 계약 섹션 생성"""

    # 파라미터 추출
    params_match = re.search(r'\((.*?)\)', signature)
    if not params_match:
        return ""

    params_str = params_match.group(1)
    if not params_str.strip():
        return ""

    # 파라미터 파싱
    params = []
    for p in params_str.split(','):
        p = p.strip()
        if ':' in p:
            name, type_hint = p.split(':', 1)
            params.append((name.strip(), type_hint.strip()))
        else:
            params.append((p, 'Any'))

    # 입력 계약 섹션 생성
    lines = ["\n### 입력 계약 [자동추가]"]

    for name, type_hint in params:
        type_lower = type_hint.lower()

        # 타입별 처리
        if 'str' in type_lower:
            lines.append(f"- `{name}`: 문자열(`str`) 타입만 허용")
            lines.append(f"  - `None` 입력 시 `TypeError` 발생")
            lines.append(f"  - 빈 문자열 `\"\"` 입력 시 빈 문자열 반환 (또는 별도 명시된 동작)")
        elif 'int' in type_lower:
            lines.append(f"- `{name}`: 정수(`int`) 타입만 허용")
            lines.append(f"  - `None` 입력 시 `TypeError` 발생")
            lines.append(f"  - `bool` 타입은 허용하지 않음 (Python에서 bool은 int 서브클래스)")
        elif 'float' in type_lower:
            lines.append(f"- `{name}`: 실수(`float` 또는 `int`) 타입 허용")
            lines.append(f"  - `None` 입력 시 `TypeError` 발생")
        elif 'list' in type_lower:
            lines.append(f"- `{name}`: 리스트(`list`) 타입만 허용")
            lines.append(f"  - `None` 입력 시 `TypeError` 발생")
            lines.append(f"  - 빈 리스트 `[]` 입력 시 빈 결과 반환 (또는 별도 명시된 동작)")
        elif 'dict' in type_lower:
            lines.append(f"- `{name}`: 딕셔너리(`dict`) 타입만 허용")
            lines.append(f"  - `None` 입력 시 `TypeError` 발생")
            lines.append(f"  - 빈 딕셔너리 `{{}}` 입력 시의 동작은 문제 명세 참조")
        else:
            lines.append(f"- `{name}`: `{type_hint}` 타입")
            lines.append(f"  - `None` 입력 시 `TypeError` 발생")

    return '\n'.join(lines) + '\n'


def has_input_contract(desc: str) -> bool:
    """이미 입력 계약 섹션이 있는지 확인"""
    keywords = ['입력 계약', 'Input Contract', '입력 조건', '타입 에러', 'TypeError', 'ValueError']
    return any(kw.lower() in desc.lower() for kw in keywords)


def has_none_handling(desc: str) -> bool:
    """None 처리가 명시되어 있는지 확인"""
    return 'none' in desc.lower() or 'null' in desc.lower()


def has_empty_handling(desc: str) -> bool:
    """빈 입력 처리가 명시되어 있는지 확인"""
    keywords = ['빈 문자열', '빈 리스트', '빈 딕셔너리', '빈 입력', '""', "''", '[]', '{}', 'empty']
    return any(kw in desc.lower() for kw in keywords)


def find_insertion_point(desc: str) -> int:
    """입력 계약 섹션을 삽입할 위치 찾기"""
    # "### 함수 역할" 또는 "### 지원하는" 또는 "### 기능" 앞에 삽입
    patterns = [
        r'###\s*함수\s*역할',
        r'###\s*지원하는',
        r'###\s*기능',
        r'###\s*규칙',
        r'###\s*정상\s*동작',
        r'##\s*테스트',
    ]

    for pattern in patterns:
        match = re.search(pattern, desc, re.IGNORECASE)
        if match:
            return match.start()

    # 못 찾으면 첫 번째 ### 뒤에 삽입
    match = re.search(r'###', desc)
    if match:
        # 해당 섹션 끝(다음 줄 시작) 찾기
        end_match = re.search(r'\n', desc[match.end():])
        if end_match:
            return match.end() + end_match.end()

    # 그래도 못 찾으면 끝에 추가
    return len(desc)


def fix_problem_file(file_path: Path, dry_run: bool = False) -> FixResult:
    """단일 문제 파일 수정"""
    result = FixResult(
        file_name=file_path.name,
        fixed_items=[],
        skipped_items=[]
    )

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        result.error = str(e)
        return result

    desc = data.get('description_md', '')
    signature = data.get('function_signature', '')

    needs_fix = False

    # 이미 입력 계약이 있는지 확인
    if has_input_contract(desc):
        result.skipped_items.append("입력 계약 이미 존재")
    else:
        # 입력 계약 섹션 생성 및 삽입
        contract_section = get_input_contract_section(signature)

        if contract_section:
            insertion_point = find_insertion_point(desc)
            new_desc = desc[:insertion_point] + contract_section + desc[insertion_point:]
            data['description_md'] = new_desc
            result.fixed_items.append("입력 계약 섹션 추가")
            needs_fix = True

    # 테스트 템플릿에 에러 처리 테스트 추가
    template = data.get('initial_test_template', '')
    if 'TypeError' not in template and 'test_type_error' not in template:
        # 테스트 템플릿에 에러 처리 테스트 추가
        error_test = '''

def test_type_error_for_invalid_input():
    # TODO: None 입력 시 TypeError 발생 검증
    # TODO: 잘못된 타입 입력 시 TypeError 발생 검증
    pass
'''
        if template.strip():
            data['initial_test_template'] = template.rstrip() + error_test
            result.fixed_items.append("TypeError 테스트 템플릿 추가")
            needs_fix = True
    else:
        result.skipped_items.append("에러 처리 테스트 이미 존재")

    # 파일 저장 (dry_run이 아닌 경우)
    if needs_fix and not dry_run:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return result


def batch_fix_problems(problems_dir: Path, dry_run: bool = False):
    """모든 문제 파일 일괄 수정"""
    print("=" * 80)
    print(f"[BATCH FIX] 문제 파일 일괄 수정 {'(DRY RUN)' if dry_run else ''}")
    print("=" * 80)

    results = []

    for json_file in sorted(problems_dir.glob('*.json')):
        result = fix_problem_file(json_file, dry_run)
        results.append(result)

    # 결과 출력
    fixed_count = sum(1 for r in results if r.fixed_items)
    skipped_count = sum(1 for r in results if not r.fixed_items and not r.error)
    error_count = sum(1 for r in results if r.error)

    print(f"\n[SUMMARY]")
    print(f"  수정됨: {fixed_count}개")
    print(f"  스킵됨: {skipped_count}개")
    print(f"  에러: {error_count}개")

    print(f"\n[FIXED FILES]")
    for r in results:
        if r.fixed_items:
            print(f"  + {r.file_name}: {', '.join(r.fixed_items)}")

    print(f"\n[SKIPPED FILES]")
    for r in results:
        if not r.fixed_items and not r.error:
            print(f"  - {r.file_name}: {', '.join(r.skipped_items)}")

    if error_count > 0:
        print(f"\n[ERRORS]")
        for r in results:
            if r.error:
                print(f"  ! {r.file_name}: {r.error}")

    print("\n" + "=" * 80)

    if dry_run:
        print("[DRY RUN] 실제 파일은 수정되지 않았습니다.")
        print("실제 수정을 원하면 --apply 옵션을 추가하세요.")
    else:
        print(f"[DONE] {fixed_count}개 파일이 수정되었습니다.")

    return results


if __name__ == '__main__':
    import sys

    problems_dir = Path(__file__).parent.parent / 'generated_problems'

    # --apply 옵션이 있으면 실제 수정, 없으면 dry run
    dry_run = '--apply' not in sys.argv

    print(f"대상 디렉토리: {problems_dir}")
    batch_fix_problems(problems_dir, dry_run)
