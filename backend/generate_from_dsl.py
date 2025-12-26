#!/usr/bin/env python
"""
DSL 기반 문제 생성 CLI

YAML 템플릿에서 문제 JSON 파일을 생성합니다.

사용법:
    python generate_from_dsl.py                    # 모든 템플릿 생성
    python generate_from_dsl.py --template floating_point.yaml  # 특정 템플릿만
    python generate_from_dsl.py --validate         # 생성 후 검증
    python generate_from_dsl.py --dry-run          # 생성하지 않고 검증만
"""

import argparse
import json
import sys
import io
from pathlib import Path

# Windows 콘솔 인코딩 문제 해결
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 프로젝트 루트를 path에 추가
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from problem_dsl.generator import ProblemGenerator
from problem_dsl.validator import ProblemValidator


def main():
    parser = argparse.ArgumentParser(
        description="DSL 기반 문제 생성기",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
예시:
    python generate_from_dsl.py                         # 모든 템플릿 생성
    python generate_from_dsl.py -t floating_point.yaml  # 특정 템플릿만
    python generate_from_dsl.py --validate              # 생성 후 검증
    python generate_from_dsl.py --dry-run               # 검증만 (생성 안 함)
    python generate_from_dsl.py --list                  # 템플릿 목록
        """,
    )
    parser.add_argument(
        "-t", "--template",
        type=str,
        help="특정 템플릿 파일만 처리 (예: floating_point.yaml)",
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default="generated_problems",
        help="출력 디렉토리 (기본값: generated_problems)",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="생성 후 검증 실행",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="실제 생성 없이 검증만 실행",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="사용 가능한 템플릿 목록 출력",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="상세 출력",
    )

    args = parser.parse_args()

    # 경로 설정
    template_dir = script_dir / "problem_dsl" / "templates"
    output_dir = script_dir / args.output

    # 템플릿 목록
    if args.list:
        print("사용 가능한 템플릿:")
        for f in template_dir.glob("*.yaml"):
            print(f"  - {f.name}")
        return

    # 생성기 초기화
    generator = ProblemGenerator(template_dir)
    validator = ProblemValidator()

    print("=" * 60)
    print("DSL 기반 문제 생성기")
    print("=" * 60)
    print(f"템플릿 디렉토리: {template_dir}")
    print(f"출력 디렉토리: {output_dir}")
    print()

    # 템플릿 로드
    try:
        if args.template:
            templates = [generator.load_template(args.template)]
            print(f"템플릿 로드: {args.template}")
        else:
            templates = generator.load_all_templates()
            print(f"템플릿 {len(templates)}개 로드됨")
    except Exception as e:
        print(f"❌ 템플릿 로드 실패: {e}")
        return 1

    # 생성 및 검증
    total_problems = 0
    total_buggy = 0
    validation_errors = []

    for template in templates:
        print(f"\n--- {template.bug_type} ---")
        print(f"학습 목표: {template.learning_objective}")
        print(f"pytest 기능: {template.pytest_feature}")
        print(f"문제 수: {len(template.problems)}개")

        for problem in template.problems:
            problem_json = generator.generate_problem_json(problem, template.bug_type)
            buggy_count = len(problem_json.get("buggy_implementations", []))
            total_problems += 1
            total_buggy += buggy_count

            if args.verbose:
                print(f"  [{problem.id}] {problem.title}")
                print(f"       난이도: {problem.difficulty}, Buggy: {buggy_count}개")

            # 검증
            if args.validate or args.dry_run:
                result = validator.validate_problem(problem_json)
                if not result.is_valid:
                    validation_errors.append((problem.id, result.errors))
                    print(f"  ❌ [{problem.id}] 검증 실패:")
                    for err in result.errors:
                        print(f"       {err}")
                elif args.verbose and result.warnings:
                    print(f"  ⚠️  [{problem.id}] 경고:")
                    for warn in result.warnings:
                        print(f"       {warn}")

            # 파일 저장 (dry-run이 아닐 때만)
            if not args.dry_run:
                output_dir.mkdir(parents=True, exist_ok=True)
                filepath = output_dir / f"{problem.id}.json"
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(problem_json, f, indent=2, ensure_ascii=False)

                if not args.verbose:
                    print(f"  ✅ {filepath.name}")
                else:
                    print(f"       저장됨: {filepath}")

    # 결과 요약
    print("\n" + "=" * 60)
    print("생성 결과 요약")
    print("=" * 60)
    print(f"총 문제 수: {total_problems}개")
    print(f"총 Buggy 구현 수: {total_buggy}개")

    if args.validate or args.dry_run:
        if validation_errors:
            print(f"\n❌ 검증 실패: {len(validation_errors)}개 문제")
            for pid, errors in validation_errors:
                print(f"  - {pid}: {len(errors)}개 오류")
            return 1
        else:
            print(f"\n✅ 모든 문제 검증 통과")

    if not args.dry_run:
        print(f"\n📁 출력 디렉토리: {output_dir}")

    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)
