# Auto-Heal Mapping

> pytest-problem-reviewer 이슈 → Problem Curator 자동 수정 매핑

---

## Critical 이슈 자동 수정

### 1. 예외 타입 미정의

**Reviewer 메시지:**
```
🔴 Critical: 예외 타입이 명시되지 않음
   - "잘못된 입력 시 예외 발생" → TypeError? ValueError?
```

**Curator 자동 수정:**
```markdown
### 예외 처리 (추가)
| 조건 | 예외 타입 | 메시지 (권장) |
|------|----------|--------------|
| 타입 오류 (str 아닌 입력) | `TypeError` | "... must be str" |
| 값 오류 (빈 문자열, 범위 초과) | `ValueError` | "... must be ..." |
```

**수정 코드:**
```python
def fix_exception_undefined(description_md: str, golden_code: str) -> str:
    # golden_code에서 예외 타입 추출
    exceptions = extract_exceptions_from_code(golden_code)

    # description_md에 예외 섹션 추가/보강
    exception_section = generate_exception_table(exceptions)

    return insert_section(description_md, "### 예외 처리", exception_section)
```

---

### 2. 입력 범위 모호

**Reviewer 메시지:**
```
🔴 Critical: 허용/금지 입력이 명시되지 않음
   - 음수 허용 여부?
   - 빈 문자열 허용 여부?
   - bool 입력 허용 여부?
```

**Curator 자동 수정:**
```markdown
### 입력 계약 (추가/보강)
| 파라미터 | 타입 | 허용 범위 | 금지 | 예외 |
|---------|------|----------|------|------|
| amount | int | >= 0 | 음수, bool | ValueError |
| name | str | 비어있지 않음 | 빈 문자열 | ValueError |
```

**수정 코드:**
```python
def fix_input_range_ambiguous(description_md: str, golden_code: str, signature: str) -> str:
    # 시그니처에서 파라미터 추출
    params = parse_function_signature(signature)

    # golden_code에서 검증 로직 추출
    validations = extract_validations(golden_code)

    # 입력 계약 테이블 생성
    contract_table = generate_input_contract_table(params, validations)

    return insert_or_update_section(description_md, "### 입력 계약", contract_table)
```

---

### 3. 반환 구조 미정의

**Reviewer 메시지:**
```
🔴 Critical: 반환 구조가 명시되지 않음
   - dict 반환 시 키 목록?
   - list 반환 시 순서 보장?
```

**Curator 자동 수정:**
```markdown
### 출력 계약 (추가)
반환 타입: `dict[str, int]`

| 키 | 타입 | 설명 |
|----|------|------|
| subtotal | int | 소계 (원) |
| discount | int | 할인 금액 |
| total | int | 최종 금액 |
```

**수정 코드:**
```python
def fix_return_structure_undefined(description_md: str, golden_code: str) -> str:
    # golden_code에서 반환 구조 추출
    return_type = extract_return_type(golden_code)
    return_structure = analyze_return_structure(golden_code)

    # 출력 계약 섹션 생성
    output_section = generate_output_contract(return_type, return_structure)

    return insert_section(description_md, "### 출력 계약", output_section)
```

---

### 4. 마크다운 렌더링 오류

**Reviewer 메시지:**
```
🔴 Critical: 마크다운 렌더링 오류
   - 코드 블록 미닫힘
   - 테이블 구조 깨짐
```

**Curator 자동 수정:**
```python
def fix_markdown_rendering(description_md: str) -> str:
    # 코드 블록 쌍 검증 및 수정
    fixed = fix_code_block_pairs(description_md)

    # 테이블 구조 검증 및 수정
    fixed = fix_table_structure(fixed)

    # 중첩 목록 수정
    fixed = fix_nested_lists(fixed)

    return fixed
```

---

### 5. 구현 순서 강제

**Reviewer 메시지:**
```
🔴 Critical: 내부 구현 순서를 강제하는 표현
   - "먼저 A를 검증하고, 그 다음 B를 처리"
```

**Curator 자동 수정:**
```python
FORBIDDEN_PATTERNS = [
    (r"먼저\s+.*검증.*그\s*다음", "검증 조건들"),
    (r"순서대로\s+처리", "처리"),
    (r"for\s+루프로\s+순회", "순회하여"),
    (r"정렬한\s+후\s+처리", "정렬된 순서로"),
]

def fix_implementation_forcing(description_md: str) -> str:
    fixed = description_md
    for pattern, replacement in FORBIDDEN_PATTERNS:
        fixed = re.sub(pattern, replacement, fixed)
    return fixed
```

---

### 6. 예시와 규칙 충돌

**Reviewer 메시지:**
```
🔴 Critical: 예시와 규칙이 충돌
   - 규칙: "음수는 ValueError"
   - 예시: calculate(-5) → 0 (예외 없이 반환)
```

**Curator 자동 수정:**
```python
def fix_example_rule_conflict(description_md: str, golden_code: str) -> str:
    # 규칙 추출
    rules = extract_rules(description_md)

    # 예시 추출
    examples = extract_examples(description_md)

    # golden_code로 예시 검증
    for example in examples:
        actual_result = evaluate_example(golden_code, example.input)
        if actual_result != example.expected:
            # 예시를 실제 동작에 맞게 수정
            example.expected = actual_result

    return update_examples(description_md, examples)
```

---

## Warning 이슈 권장 수정

### 1. 설명 너무 김

**Reviewer 메시지:**
```
🟡 Warning: description_md가 너무 김
   - 현재: 72줄
   - 권장: 25~40줄 (Easy)
```

**Curator 자동 수정:**
```python
DIFFICULTY_LINE_LIMITS = {
    "Very Easy": (15, 25),
    "Easy": (25, 40),
    "Medium": (40, 70),
    "Hard": (70, 100),
}

def fix_description_too_long(description_md: str, difficulty: str) -> str:
    min_lines, max_lines = DIFFICULTY_LINE_LIMITS[difficulty]
    current_lines = description_md.count('\n')

    if current_lines > max_lines:
        # 1. 중복 제거
        fixed = remove_duplications(description_md)

        # 2. 불필요한 배경 설명 축소
        fixed = compress_background(fixed)

        # 3. 난이도 템플릿 적용
        fixed = apply_difficulty_template(fixed, difficulty)

    return fixed
```

---

### 2. 정보 중복

**Reviewer 메시지:**
```
🟡 Warning: 동일 정보가 2회 이상 반복
   - "amount는 0 이상이어야 합니다" (3회 등장)
```

**Curator 자동 수정:**
```python
def fix_information_duplication(description_md: str) -> str:
    # 문장 단위로 분할
    sentences = extract_sentences(description_md)

    # 유사도 기반 중복 감지
    duplicates = find_similar_sentences(sentences, threshold=0.8)

    # 첫 번째만 유지, 나머지 제거
    for dup_group in duplicates:
        keep = dup_group[0]
        remove = dup_group[1:]
        description_md = remove_sentences(description_md, remove)

    return description_md
```

---

### 3. 힌트 부족

**Reviewer 메시지:**
```
🟡 Warning: 테스트 힌트가 부족함
   - 현재: 0개
   - 권장: 1~2개 (Easy)
```

**Curator 자동 수정:**
```python
def fix_insufficient_hints(description_md: str, difficulty: str, tags: list) -> str:
    # 태그 기반 힌트 생성
    hints = generate_hints_from_tags(tags)

    # 난이도별 힌트 수 조정
    hint_count = {"Very Easy": 1, "Easy": 2, "Medium": 2, "Hard": 1}
    hints = hints[:hint_count[difficulty]]

    # 힌트 섹션 추가
    hint_section = "### 테스트 힌트\n" + "\n".join(f"- {h}" for h in hints)

    return insert_section(description_md, "### 테스트 힌트", hint_section)
```

---

### 4. 시나리오 추상적

**Reviewer 메시지:**
```
🟡 Warning: 비즈니스 시나리오가 추상적
   - "금융 앱" → 구체적 서비스명 필요
```

**Curator 자동 수정:**
```python
DOMAIN_SERVICE_EXAMPLES = {
    "fintech": ["토스", "카카오뱅크", "네이버페이"],
    "commerce": ["쿠팡", "마켓컬리", "네이버 스마트스토어"],
    "platform": ["GitHub", "AWS", "Slack"],
    "saas": ["Notion", "Figma", "Salesforce"],
}

def fix_abstract_scenario(description_md: str, domain: str) -> str:
    services = DOMAIN_SERVICE_EXAMPLES.get(domain, [])

    if services:
        # 추상적 표현을 구체적 서비스로 대체
        replacements = [
            (r"금융\s*앱", services[0]),
            (r"이커머스\s*플랫폼", services[0]),
            (r"SaaS\s*서비스", services[0]),
        ]

        for pattern, replacement in replacements:
            description_md = re.sub(pattern, f"**{replacement}**", description_md)

    return description_md
```

---

## 피드백 파싱

### Reviewer 출력 파싱

```python
def parse_reviewer_output(review_report: str) -> dict:
    """
    Reviewer 출력을 구조화된 피드백으로 파싱

    Returns:
        {
            "verdict": "PASS" | "FAIL",
            "critical": [
                {"type": "EXCEPTION_UNDEFINED", "message": "...", "location": "..."},
                ...
            ],
            "warnings": [
                {"type": "TOO_LONG", "message": "...", "current": 72, "recommended": 40},
                ...
            ],
            "policy_questions": [
                {"question": "...", "options": ["A", "B"]},
                ...
            ]
        }
    """
    result = {
        "verdict": extract_verdict(review_report),
        "critical": [],
        "warnings": [],
        "policy_questions": []
    }

    # 🔴 Critical 파싱
    critical_section = extract_section(review_report, "### 🔴 Critical")
    for issue in parse_issues(critical_section):
        issue_type = classify_issue(issue)
        result["critical"].append({
            "type": issue_type,
            "message": issue,
            "auto_fixable": is_auto_fixable(issue_type)
        })

    # 🟡 Warning 파싱
    warning_section = extract_section(review_report, "### 🟡 Warning")
    for issue in parse_issues(warning_section):
        result["warnings"].append({
            "type": classify_issue(issue),
            "message": issue
        })

    return result
```

---

## 수정 우선순위

1. **Critical (자동 수정)**: 예외 타입, 입력 범위, 반환 구조, 마크다운
2. **Critical (수동 확인)**: 정책 질문 필요 항목
3. **Warning (자동)**: 중복 제거, 템플릿 적용
4. **Warning (선택)**: 힌트 추가, 시나리오 강화

---

*Auto-Heal Mapping v1.0*
