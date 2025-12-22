#!/usr/bin/env python3
"""
pytest 문제 체크리스트 자동 스캔 스크립트
- 모든 문제 파일을 분석하여 Critical 항목 누락 여부 점검
- 우선순위별 파일 목록 출력
"""

import json
import re
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class CheckResult:
    """체크 결과"""
    file_name: str
    title: str
    difficulty: str
    critical_issues: list = field(default_factory=list)
    warning_issues: list = field(default_factory=list)
    good_items: list = field(default_factory=list)

    @property
    def score(self) -> int:
        """우선순위 점수 (높을수록 문제 많음)"""
        return len(self.critical_issues) * 10 + len(self.warning_issues) * 3


def check_problem(file_path: Path) -> Optional[CheckResult]:
    """단일 문제 파일 체크"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        return None

    result = CheckResult(
        file_name=file_path.name,
        title=data.get('title', 'Unknown'),
        difficulty=data.get('difficulty', 'Unknown')
    )

    desc = data.get('description_md', '')
    signature = data.get('function_signature', '')
    template = data.get('initial_test_template', '')

    # === Critical 체크 ===

    # 1. 입력 타입 에러 처리 명시 여부
    if not any(kw in desc.lower() for kw in ['typeerror', 'valueerror', '에러', '예외', 'exception', 'raise']):
        result.critical_issues.append("C1. 입력 타입 에러 처리 미명시 (TypeError/ValueError 조건)")

    # 2. None 처리 명시 여부
    if 'none' not in desc.lower() and 'null' not in desc.lower():
        result.critical_issues.append("C2. None 입력 처리 미명시")

    # 3. 빈 문자열/빈 컬렉션 처리
    if not any(kw in desc for kw in ['빈 문자열', '빈 리스트', '빈 딕셔너리', '빈 입력', '""', "''", '[]', '{}']):
        result.critical_issues.append("C3. 빈 입력 처리 미명시")

    # 4. 반환 타입 명시
    if '반환' not in desc and 'return' not in desc.lower() and '출력' not in desc:
        result.critical_issues.append("C4. 반환 타입/형식 미명시")

    # 5. 예외 우선순위 (여러 조건 실패 시)
    if '우선순위' not in desc and '순서' not in desc and 'order' not in desc.lower():
        if any(kw in desc.lower() for kw in ['error', 'exception', '예외', '에러']):
            result.warning_issues.append("W1. 다중 에러 발생 시 우선순위 미명시")

    # === Warning 체크 ===

    # 6. 경계값 언급
    boundary_keywords = ['경계', 'boundary', '최소', '최대', 'min', 'max', '0', '음수', '양수']
    if not any(kw in desc.lower() for kw in boundary_keywords):
        result.warning_issues.append("W2. 경계값 동작 미명시")

    # 7. 부동소수점 (숫자 관련 문제)
    if any(kw in desc.lower() for kw in ['float', '소수', '실수', '퍼센트', '%', '비율']):
        if '오차' not in desc and 'epsilon' not in desc.lower() and 'tolerance' not in desc.lower():
            result.warning_issues.append("W3. 부동소수점 오차 허용 미명시")

    # 8. dict 입력인데 필수/선택 키 미명시
    if 'dict' in signature.lower() or 'dict' in desc.lower():
        if '필수' not in desc and 'required' not in desc.lower():
            result.warning_issues.append("W4. dict 필수/선택 키 미명시")

    # 9. 대소문자 처리
    if any(kw in desc.lower() for kw in ['문자열', 'string', 'str', '이름', 'name']):
        if '대소문자' not in desc and 'case' not in desc.lower():
            result.warning_issues.append("W5. 대소문자 구분 여부 미명시")

    # 10. 테스트 템플릿에 힌트 부족
    if template.count('TODO') < 3:
        result.warning_issues.append("W6. 테스트 템플릿 힌트 부족")

    # === Good 체크 ===

    if '예시' in desc or 'example' in desc.lower():
        result.good_items.append("예시 포함")

    if len(data.get('buggy_implementations', [])) >= 3:
        result.good_items.append(f"버그 구현 {len(data.get('buggy_implementations', []))}개")

    if '[추가]' in desc or '[수정]' in desc:
        result.good_items.append("명시적 스펙 추가 있음")

    return result


def scan_all_problems(problems_dir: Path) -> list[CheckResult]:
    """모든 문제 파일 스캔"""
    results = []

    for json_file in sorted(problems_dir.glob('*.json')):
        result = check_problem(json_file)
        if result:
            results.append(result)

    # 점수 기준 정렬 (문제 많은 순)
    results.sort(key=lambda x: (-x.score, x.file_name))

    return results


def print_summary(results: list[CheckResult]):
    """결과 요약 출력"""
    print("=" * 80)
    print("[SCAN] pytest 문제 체크리스트 스캔 결과")
    print("=" * 80)

    # 통계
    total = len(results)
    critical_files = [r for r in results if r.critical_issues]
    warning_only_files = [r for r in results if r.warning_issues and not r.critical_issues]
    clean_files = [r for r in results if not r.critical_issues and not r.warning_issues]

    print(f"\n[STATS] 전체 현황: {total}개 파일")
    print(f"   [C] Critical 있음: {len(critical_files)}개")
    print(f"   [W] Warning만 있음: {len(warning_only_files)}개")
    print(f"   [OK] 이슈 없음: {len(clean_files)}개")

    # Critical 항목별 통계
    print("\n" + "-" * 80)
    print("[CRITICAL] Critical 항목별 누락 현황:")
    critical_counts = {}
    for r in results:
        for issue in r.critical_issues:
            code = issue.split('.')[0]
            critical_counts[code] = critical_counts.get(code, 0) + 1

    for code, count in sorted(critical_counts.items(), key=lambda x: -x[1]):
        pct = count / total * 100
        print(f"   {code}: {count}개 ({pct:.0f}%)")

    # 상위 20개 파일 상세
    print("\n" + "-" * 80)
    print("[TOP] 우선 개선 대상 (상위 20개):")
    print("-" * 80)

    for i, r in enumerate(results[:20], 1):
        status = "[C]" if r.critical_issues else ("[W]" if r.warning_issues else "[OK]")
        print(f"\n{i:2}. {status} {r.file_name} [{r.difficulty}] (점수: {r.score})")
        print(f"    Title: {r.title[:50]}...")

        if r.critical_issues:
            for issue in r.critical_issues[:3]:
                print(f"    [C] {issue}")
            if len(r.critical_issues) > 3:
                print(f"    ... 외 {len(r.critical_issues) - 3}개")

        if r.warning_issues:
            for issue in r.warning_issues[:2]:
                print(f"    [W] {issue}")
            if len(r.warning_issues) > 2:
                print(f"    ... 외 {len(r.warning_issues) - 2}개")

    # 이슈 없는 파일
    if clean_files:
        print("\n" + "-" * 80)
        print("[CLEAN] 이슈 없는 파일:")
        for r in clean_files:
            print(f"   [OK] {r.file_name}")

    print("\n" + "=" * 80)


def export_csv(results: list[CheckResult], output_path: Path):
    """CSV로 내보내기"""
    import csv

    with open(output_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['파일명', '난이도', '점수', 'Critical수', 'Warning수', 'Critical항목', 'Warning항목'])

        for r in results:
            writer.writerow([
                r.file_name,
                r.difficulty,
                r.score,
                len(r.critical_issues),
                len(r.warning_issues),
                ' | '.join(r.critical_issues),
                ' | '.join(r.warning_issues)
            ])

    print(f"\n[CSV] 저장 완료: {output_path}")


if __name__ == '__main__':
    problems_dir = Path(__file__).parent.parent / 'generated_problems'

    print(f"스캔 대상: {problems_dir}")
    results = scan_all_problems(problems_dir)

    print_summary(results)

    # CSV 내보내기
    csv_path = problems_dir.parent / 'problem_scan_results.csv'
    export_csv(results, csv_path)
