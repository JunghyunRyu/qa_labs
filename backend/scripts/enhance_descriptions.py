"""Enhance problem description_md to follow standard format.

This script reads each problem JSON file and enhances the description_md
by extracting information from golden_code and buggy_implementations.
"""

import json
import re
from pathlib import Path


def extract_docstring(golden_code: str) -> str:
    """Extract docstring from golden code."""
    match = re.search(r'"""(.*?)"""', golden_code, re.DOTALL)
    if match:
        return match.group(1).strip()
    match = re.search(r"'''(.*?)'''", golden_code, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""


def extract_function_info(signature: str) -> dict:
    """Extract function name and parameters from signature."""
    match = re.search(r'def\s+(\w+)\s*\((.*?)\)', signature)
    if not match:
        return {"name": "function", "params": [], "return_type": ""}

    func_name = match.group(1)
    params_str = match.group(2)

    # Parse parameters
    params = []
    if params_str.strip():
        for param in params_str.split(','):
            param = param.strip()
            if ':' in param:
                name, type_hint = param.split(':', 1)
                params.append({"name": name.strip(), "type": type_hint.strip()})
            elif '=' in param:
                name = param.split('=')[0].strip()
                params.append({"name": name, "type": ""})
            else:
                params.append({"name": param, "type": ""})

    # Extract return type
    return_match = re.search(r'->\s*(.+?):', signature)
    return_type = return_match.group(1).strip() if return_match else ""

    return {
        "name": func_name,
        "params": params,
        "return_type": return_type
    }


def generate_test_hints(buggy_implementations: list) -> list:
    """Generate test hints from buggy implementations."""
    hints = []
    for buggy in buggy_implementations:
        desc = buggy.get("bug_description", "")
        if not desc:
            continue

        # Extract key testing concepts
        if any(kw in desc.lower() for kw in ["경계", "boundary", "같을 때", "0", "빈"]):
            hints.append("경계값 테스트: 0, 빈 값, 같은 값 등 경계 조건 확인")
        if any(kw in desc.lower() for kw in ["음수", "negative", "양수"]):
            hints.append("부호 테스트: 양수, 음수, 0 조합 확인")
        if any(kw in desc.lower() for kw in ["예외", "error", "typeerror", "valueerror"]):
            hints.append("예외 처리: 잘못된 입력에 대한 에러 발생 확인")
        if any(kw in desc.lower() for kw in ["비교", ">", "<", ">=", "<="]):
            hints.append("비교 연산: 비교 연산자 방향과 포함 여부 확인")

    # Remove duplicates while preserving order
    seen = set()
    unique_hints = []
    for hint in hints:
        if hint not in seen:
            seen.add(hint)
            unique_hints.append(hint)

    return unique_hints[:4]  # Max 4 hints


def enhance_description(data: dict) -> str:
    """Generate enhanced description_md by preserving existing content and adding missing sections."""
    title = data.get("title", "문제")
    signature = data.get("function_signature", "")
    golden_code = data.get("golden_code", "")
    buggy_impls = data.get("buggy_implementations", [])
    existing_desc = data.get("description_md", "")

    # Extract function info
    func_info = extract_function_info(signature)
    docstring = extract_docstring(golden_code)
    hints = generate_test_hints(buggy_impls)

    # Check what sections already exist (case-insensitive)
    existing_lower = existing_desc.lower()
    has_문제설명 = "## 문제 설명" in existing_desc or "## 문제설명" in existing_desc
    has_함수역할 = "### 함수 역할" in existing_lower or "### 함수역할" in existing_lower
    has_예시 = "### 정상 동작 예시" in existing_lower or "### 동작 예시" in existing_lower or "예시" in existing_lower
    has_힌트 = "### 테스트 힌트" in existing_lower or "힌트" in existing_lower
    has_할일 = "### 수험자가 해야 할 일" in existing_lower or "해야 할 일" in existing_lower

    # If already has most sections, preserve existing
    section_count = sum([has_문제설명, has_함수역할, has_예시, has_힌트, has_할일])
    if section_count >= 3 and len(existing_desc) > 400:
        return existing_desc  # Already good enough

    # Start with existing description or build new one
    lines = []

    # 문제 설명 - preserve if exists, else add
    if has_문제설명:
        # Extract and include existing 문제 설명 section
        match = re.search(r'(## 문제[ ]?설명.*?)(?=\n##|\n###|\Z)', existing_desc, re.DOTALL)
        if match:
            lines.append(match.group(1).strip())
        else:
            lines.append("## 문제 설명")
            lines.append("")
            lines.append(f"`{func_info['name']}` 함수에 버그가 숨어 있을 수 있습니다. pytest로 최대한 많은 버그를 찾아내세요.")
    else:
        lines.append("## 문제 설명")
        lines.append("")
        if docstring:
            lines.append(docstring.split('\n')[0])
        else:
            lines.append(f"`{func_info['name']}` 함수에 버그가 숨어 있을 수 있습니다. pytest로 최대한 많은 버그를 찾아내세요.")

    lines.append("")

    # 함수 역할 - add if missing
    if not has_함수역할:
        lines.append("### 함수 역할")
        lines.append(f"- **함수명**: `{func_info['name']}`")
        if func_info['params']:
            params_desc = ", ".join([f"`{p['name']}: {p['type']}`" if p['type'] else f"`{p['name']}`" for p in func_info['params']])
            lines.append(f"- **입력**: {params_desc}")
        if func_info['return_type']:
            lines.append(f"- **출력**: `{func_info['return_type']}`")
        lines.append("")

    # 정상 동작 예시 - add if missing
    if not has_예시:
        lines.append("### 정상 동작 예시")
        example_match = re.search(r'`' + func_info['name'] + r'\([^)]+\)\s*(?:->|→)\s*[^`]+`', existing_desc)
        if example_match:
            lines.append(f"- {example_match.group(0)}")
        else:
            params_placeholder = ", ".join([p['name'] for p in func_info['params'][:2]]) if func_info['params'] else "..."
            lines.append(f"- `{func_info['name']}({params_placeholder})` → 예상 결과")
        lines.append("")

    # 테스트 힌트 - add if missing
    if not has_힌트:
        lines.append("### 테스트 힌트(아이디어)")
        if hints:
            for hint in hints:
                lines.append(f"- {hint}")
        else:
            lines.append("- 다양한 입력 케이스를 테스트하세요")
            lines.append("- 경계값과 예외 상황을 고려하세요")
        lines.append("")

    # 수험자가 해야 할 일 - add if missing
    if not has_할일:
        lines.append("### 수험자가 해야 할 일")
        lines.append(f"`pytest` 기반 테스트 코드를 작성하여, 주어진 `{func_info['name']}` 함수 구현들 중 버그가 있는 구현을 최대한 많이 실패(fail)시키세요.")
        lines.append("올바른 구현(golden behavior)은 통과(pass)해야 합니다.")

    result = "\n".join(lines)

    # If result is shorter than original, append missing sections to original instead
    if len(result) < len(existing_desc):
        # Append only the missing sections to the original
        append_sections = []
        if not has_함수역할:
            append_sections.append("\n### 함수 역할")
            append_sections.append(f"- **함수명**: `{func_info['name']}`")
            if func_info['params']:
                params_desc = ", ".join([f"`{p['name']}: {p['type']}`" if p['type'] else f"`{p['name']}`" for p in func_info['params']])
                append_sections.append(f"- **입력**: {params_desc}")
            if func_info['return_type']:
                append_sections.append(f"- **출력**: `{func_info['return_type']}`")

        if not has_할일:
            append_sections.append("\n### 수험자가 해야 할 일")
            append_sections.append(f"`pytest` 기반 테스트 코드를 작성하여, 주어진 `{func_info['name']}` 함수 구현들 중 버그가 있는 구현을 최대한 많이 실패(fail)시키세요.")
            append_sections.append("올바른 구현(golden behavior)은 통과(pass)해야 합니다.")

        if append_sections:
            return existing_desc.rstrip() + "\n" + "\n".join(append_sections)
        return existing_desc

    return result


def process_all_problems(dry_run: bool = True):
    """Process all problem JSON files."""
    problems_dir = Path(__file__).parent.parent / "generated_problems"

    if not problems_dir.exists():
        print(f"[ERROR] Directory not found: {problems_dir}")
        return

    json_files = sorted(problems_dir.glob("*.json"))
    print(f"[INFO] Found {len(json_files)} JSON files")

    updated = 0
    skipped = 0

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        existing_desc = data.get("description_md", "")

        # Check if already has all required sections
        required = ["### 함수 역할", "### 정상 동작 예시", "### 테스트 힌트", "### 수험자가 해야 할 일"]
        has_all = all(section.lower() in existing_desc.lower() for section in required)

        if has_all and len(existing_desc) > 400:
            print(f"[SKIP] {json_file.name}: Already complete ({len(existing_desc)} chars)")
            skipped += 1
            continue

        # Enhance description
        new_desc = enhance_description(data)

        if dry_run:
            print(f"[DRY] {json_file.name}: Would update ({len(existing_desc)} -> {len(new_desc)} chars)")
        else:
            data["description_md"] = new_desc
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"[OK] {json_file.name}: Updated ({len(existing_desc)} -> {len(new_desc)} chars)")

        updated += 1

    print()
    print(f"[SUMMARY] {updated} would be updated, {skipped} skipped")
    if dry_run:
        print("[INFO] Run with --apply to actually update files")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Enhance problem descriptions")
    parser.add_argument("--apply", action="store_true", help="Actually apply changes (default: dry-run)")
    args = parser.parse_args()

    process_all_problems(dry_run=not args.apply)
