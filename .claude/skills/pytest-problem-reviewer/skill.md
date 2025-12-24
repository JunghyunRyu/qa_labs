---
description: Review pytest unit test problems based on a checklist and output improved versions that remove ambiguity. Ensures scoring stability and candidate experience in the (multiple buggy implementations + 1 golden) format.
triggers:
  - "pytest problem review"
  - "test case review"
  - "description_md improvement"
  - "checklist review request"
inputs:
  - problem_json (e.g., VE01.json)
  - checklist_md (references/checklist.md)
outputs:
  - review_report_md (in Korean)
  - improved_description_md (in Korean)
  - change_summary_md (in Korean)
  - policy_questions_md (if needed, in Korean)
---

# pytest Problem Reviewer v2

## Purpose
- Fix **decision points (Contracts)** so candidates don't have to guess.
- Ensure **scoring stability** by preventing tests from depending on implementation details.
- Improve **readability and conversion rate** with appropriate length/structure for each difficulty level.

**IMPORTANT: All outputs (review_report_md, improved_description_md, change_summary_md, policy_questions_md) MUST be written in Korean.**

---

# 1. Input/Output Contract (Required)

## Inputs
- Read at minimum the following from `problem_json`:
  - `difficulty` (Very Easy / Easy / Medium / Hard)
  - `title`
  - `function_signature` or signature in body
  - `description_md` (target for improvement)
  - Optional: `tags`, `category`, `examples`, etc.

## Outputs — Must generate 4 sections (all in Korean)
1) `review_report_md`
2) `improved_description_md` (with difficulty template applied)
3) `change_summary_md` (Before/After key changes summary)
4) `policy_questions_md` (only when platform policy decisions are needed)

---

# 2. Operating Principles (Mandatory)

## Principle A: No Duplication
- Don't repeat in the body what was said in the summary.
- If same information appears 2+ times → consolidate or remove.
- In Very Easy, "friendly repetition" causes fatigue.

## Principle B: Information Priority (Candidate Perspective)
Order of what candidates need first:
1. Function signature
2. Behavior rules (contract)
3. Examples (normal + failure/exception)
4. Test hints

## Principle C: Length Guidelines by Difficulty
| Difficulty | Recommended description_md length | Criteria |
|------------|-----------------------------------|----------|
| Very Easy | 15~25 lines | Single screen, minimal scrolling |
| Easy | 25~40 lines | Core only, reduce unnecessary background |
| Medium | 40~70 lines | Fully specify rules/exception conditions |
| Hard | 70~100 lines | Detailed multi-step/normalization/consistency |

## Principle D: Contract-Based — No Implementation Details
- Prohibit expressions that force or suggest internal implementation:
  - "iterate with a for loop"
  - "validate A first, then B"
  - "process after sorting"
- Specs only describe "what (result/exception)" not "how (implementation method)".

## Principle E: Markdown Rendering Integrity
- All code blocks must have matching open/close pairs.
- Use minimal formatting to prevent tables/lists from breaking.

---

# 3. Gating Rules (Publication Eligibility)

## Not Publishable (FAIL) = 1+ Critical 🔴
The following are automatically Critical when found:
- Markdown rendering errors (unclosed code blocks, broken nesting)
- Ambiguous input/output contract allowing "reasonably different implementations"
  - Exception type undefined
  - Allowed/prohibited inputs undefined (e.g., whitespace/empty/negative)
  - Return structure/order rules undefined
- "Force internal implementation order" phrasing exists
- Examples conflict with rules

## Publishable (PASS)
- Critical = 0
- Difficulty template applied
- All major decision points (Contracts) are closed

---

# 4. Ambiguity Handling Policy (Mandatory)

When ambiguity is found, handle with one of the following.

## Default Policy: Close decision point with one sentence
- If test results could diverge, confirm the spec with one additional sentence.
- However, items affecting the entire platform are separated as "policy confirmation needed".

## Policy Question Escalation
The following are NOT decided arbitrarily per problem; record in `policy_questions_md`:
- Exception type unification policy (TypeError vs ValueError)
- Common format/normalization rules (e.g., date validation scope)
- Common allowed token sets (e.g., bool mapping)

## Intentional Skip (Out of scope)
- Check items unrelated to problem requirements can be skipped, but leave 1-line skip reason in `change_summary_md`.

---

# 5. Platform Common Policies (Default Recommendations)

> Apply these default policies if no separate platform agreement exists.

## Policy 1: Exception Type Consistency
- Type errors → `TypeError`
- Value/format/range errors → `ValueError`

## Policy 2: No Forcing Internal Implementation Order
- Forcing validation/processing order is prohibited.
- Specs only specify "what is an exception".

## Policy 3: Bool Exclusion Standardization
Since `isinstance(True, int)` is `True` in Python, specify bool handling policy for int inputs.

Standard phrasing:
- "Parameter must be int; bool is not allowed"

## Policy 4: No Forcing Error Messages
- Don't force exact string matching of exception messages in specs.
- Only recommend "keyword level" to include in message if needed.

---

# 6. Difficulty Templates (Output MUST use templates, content in Korean)

## Very Easy Template (15~25 lines)
```markdown
### 문제 설명
[1~2 sentence context - concise without duplication]

### 함수 시그니처
```python
def function_name(parameter: type) -> return_type:
```

### 동작 규칙
- [Core rule 1]
- [Core rule 2]
- [Exception condition] → ExceptionType

### 예시
- function_name(input) -> output
- function_name(invalid_input) → Exception

### 테스트 힌트
- [1~2 hints]
```

## Easy/Medium Template
```markdown
### 문제 설명
[2~3 sentence context]

### 함수 시그니처
```python
def function_name(...) -> return_type:
```

### 입력 계약
- [Type/range/allowed/exception per parameter]

### 동작 규칙
- [Rules]

### 예시
- [Normal example]
- [Exception example]

### 테스트 힌트
- [Hints]
```

---

# 7. Review Procedure (Fixed)

## Step 1. Problem Type Classification
- Tag as one (or multiple) of: numerical calculation / structure validation / workflow / parsing.

## Step 2. Checklist-Based Review
- Reference `references/checklist.md`.
- Review priority:
  1) Error handling contract
  2) Input contract
  3) Output contract
  4) Type-specific required items

## Step 3. Write Review Report (MUST use format below, in Korean)
```markdown
### 문제 유형
- ...

### 출제 판정
- PASS/FAIL
- 근거: (Critical count, key reasons)

### 🔴 Critical
- ...

### 🟡 Warning
- ...

### 🟢 Good
- ...
```

---

# Output Language Reminder

**All outputs generated by this skill MUST be in Korean (한글):**
- review_report_md → 한글
- improved_description_md → 한글
- change_summary_md → 한글
- policy_questions_md → 한글

The template section headers shown above are already in Korean and should be used as-is.
