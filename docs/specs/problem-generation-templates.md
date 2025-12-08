# QA-Arena 문제 생성 템플릿

> 이 문서는 AI Problem Designer를 활용하여 문제를 대량 생성할 때 사용하는 템플릿입니다.

---

## 📋 난이도별 프롬프트 템플릿

### Easy 난이도 템플릿

#### E-BVA: 경계값 분석 (Boundary Value Analysis)

```json
{
  "goal": "경계값 분석 능력을 평가하는 QA 코딩 테스트 문제 생성. 입력값의 최소/최대 경계에서 발생할 수 있는 버그를 찾아내는 테스트를 작성해야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["boundary value analysis", "edge cases", "min/max values"],
  "difficulty": "Easy",
  "problem_style": "unit_test_for_single_function"
}
```

#### E-EP: 동등 분할 (Equivalence Partitioning)

```json
{
  "goal": "동등 분할 기법을 평가하는 QA 코딩 테스트 문제 생성. 입력을 동등한 클래스로 나누고 각 클래스에서 대표값으로 테스트해야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["equivalence partitioning", "input classification", "representative values"],
  "difficulty": "Easy",
  "problem_style": "unit_test_for_single_function"
}
```

#### E-EX: 예외 처리 (Exception Handling)

```json
{
  "goal": "예외 처리 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 잘못된 입력이나 예외 상황에서 적절한 예외가 발생하는지 테스트해야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["exception handling", "error cases", "invalid input"],
  "difficulty": "Easy",
  "problem_style": "unit_test_for_single_function"
}
```

#### E-DT: 기본 자료형 (Data Types)

```json
{
  "goal": "기본 자료형 처리 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 문자열, 숫자, 리스트 등 기본 자료형의 처리를 테스트해야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["data type handling", "type conversion", "basic operations"],
  "difficulty": "Easy",
  "problem_style": "unit_test_for_single_function"
}
```

---

### Medium 난이도 템플릿

#### M-ST: 상태 기반 테스트 (State-Based Testing)

```json
{
  "goal": "상태 기반 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 객체의 상태 변화에 따른 동작을 테스트해야 함. 클래스나 상태를 가진 함수를 대상으로 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["state-based testing", "state transitions", "object lifecycle"],
  "difficulty": "Medium",
  "problem_style": "unit_test_for_class_or_stateful_function"
}
```

#### M-CT: 조합 테스트 (Combinatorial Testing)

```json
{
  "goal": "조합 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 여러 파라미터의 조합에서 발생할 수 있는 버그를 찾아내야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["combinatorial testing", "pairwise testing", "parameter combinations"],
  "difficulty": "Medium",
  "problem_style": "unit_test_for_multi_parameter_function"
}
```

#### M-DS: 데이터 구조 테스트 (Data Structure Testing)

```json
{
  "goal": "데이터 구조 처리 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 리스트, 딕셔너리, 중첩 구조 등 복잡한 데이터 구조를 처리하는 함수를 테스트해야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["data structure testing", "nested structures", "complex data types"],
  "difficulty": "Medium",
  "problem_style": "unit_test_for_data_processing_function"
}
```

#### M-API: API 응답 검증 (API Response Validation)

```json
{
  "goal": "API 응답 검증 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. JSON 응답의 구조, 필드 존재 여부, 데이터 타입 등을 검증해야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["API response validation", "JSON schema validation", "response structure"],
  "difficulty": "Medium",
  "problem_style": "unit_test_for_api_response_parser"
}
```

---

### Hard 난이도 템플릿

#### H-CC: 동시성 테스트 (Concurrency Testing)

```json
{
  "goal": "동시성 관련 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 멀티스레드나 비동기 환경에서 발생할 수 있는 레이스 컨디션이나 데드락 관련 버그를 찾아내야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["concurrency testing", "race conditions", "thread safety"],
  "difficulty": "Hard",
  "problem_style": "unit_test_for_concurrent_function"
}
```

#### H-SEC: 보안 테스트 (Security Testing)

```json
{
  "goal": "보안 관련 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 입력 검증, SQL 인젝션 방지, XSS 방지 등 보안 취약점을 찾아내는 테스트를 작성해야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["security testing", "input validation", "injection prevention"],
  "difficulty": "Hard",
  "problem_style": "unit_test_for_security_sensitive_function"
}
```

#### H-PERF: 성능 테스트 (Performance Testing)

```json
{
  "goal": "성능 관련 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 시간 복잡도, 메모리 사용량, 대용량 데이터 처리 등 성능 관련 버그를 찾아내야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["performance testing", "time complexity", "memory efficiency"],
  "difficulty": "Hard",
  "problem_style": "unit_test_for_performance_critical_function"
}
```

#### H-BL: 복합 비즈니스 로직 (Complex Business Logic)

```json
{
  "goal": "복잡한 비즈니스 로직 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성. 여러 조건과 규칙이 복합적으로 적용되는 함수를 테스트해야 함.",
  "language": "python",
  "testing_framework": "pytest",
  "skills_to_assess": ["business logic testing", "complex conditions", "rule validation"],
  "difficulty": "Hard",
  "problem_style": "unit_test_for_business_logic_function"
}
```

---

## 🔧 문제 생성 스크립트

### PowerShell 스크립트 (Windows)

```powershell
# generate_problems.ps1
# 문제 대량 생성 스크립트

param(
    [string]$Difficulty = "Easy",
    [int]$Count = 3,
    [string]$BaseUrl = "http://localhost:8000"
)

$templates = @{
    "Easy" = @(
        @{
            goal = "경계값 분석을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("boundary value analysis", "edge cases")
        },
        @{
            goal = "동등 분할 기법을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("equivalence partitioning", "input classification")
        },
        @{
            goal = "예외 처리 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("exception handling", "error cases")
        }
    )
    "Medium" = @(
        @{
            goal = "상태 기반 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("state-based testing", "state transitions")
        },
        @{
            goal = "조합 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("combinatorial testing", "parameter combinations")
        },
        @{
            goal = "데이터 구조 처리 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("data structure testing", "complex data types")
        }
    )
    "Hard" = @(
        @{
            goal = "동시성 관련 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("concurrency testing", "thread safety")
        },
        @{
            goal = "보안 관련 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("security testing", "input validation")
        },
        @{
            goal = "복잡한 비즈니스 로직 테스트 능력을 평가하는 QA 코딩 테스트 문제 생성"
            skills_to_assess = @("business logic testing", "complex conditions")
        }
    )
}

Write-Host "=== QA-Arena 문제 생성기 ===" -ForegroundColor Cyan
Write-Host "난이도: $Difficulty, 생성 개수: $Count" -ForegroundColor Yellow

$generated = @()
$templateList = $templates[$Difficulty]

for ($i = 0; $i -lt $Count; $i++) {
    $template = $templateList[$i % $templateList.Count]
    
    $body = @{
        goal = $template.goal
        language = "python"
        testing_framework = "pytest"
        skills_to_assess = $template.skills_to_assess
        difficulty = $Difficulty
    } | ConvertTo-Json -Depth 3

    Write-Host "`n[$($i+1)/$Count] 생성 중: $($template.goal.Substring(0, 30))..." -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/admin/problems/ai-generate" `
            -Method Post -Body $body -ContentType "application/json; charset=utf-8"
        
        $generated += $response
        Write-Host "  ✓ 성공: $($response.title)" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ 실패: $_" -ForegroundColor Red
    }
    
    # API 부하 방지를 위한 대기
    Start-Sleep -Seconds 2
}

Write-Host "`n=== 생성 완료 ===" -ForegroundColor Cyan
Write-Host "총 $($generated.Count)개 문제 생성됨" -ForegroundColor Yellow

# 결과 저장
$outputPath = "generated_problems_$Difficulty_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
$generated | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputPath -Encoding utf8
Write-Host "결과 저장: $outputPath" -ForegroundColor Gray
```

### 사용 방법

```powershell
# Easy 문제 3개 생성
.\generate_problems.ps1 -Difficulty "Easy" -Count 3

# Medium 문제 5개 생성
.\generate_problems.ps1 -Difficulty "Medium" -Count 5

# Hard 문제 3개 생성
.\generate_problems.ps1 -Difficulty "Hard" -Count 3
```

---

## 📝 문제 검수 체크리스트

각 생성된 문제에 대해 다음 항목을 검수합니다:

### 기본 검수

| # | 항목 | 확인 내용 |
|:-:|------|----------|
| 1 | 제목 | 명확하고 이해하기 쉬운가? |
| 2 | 설명 | 문제 요구사항이 명확한가? |
| 3 | 함수 시그니처 | Python 문법에 맞는가? |
| 4 | Golden Code | 실행 가능하고 올바른가? |
| 5 | Buggy Code | 각각 다른 버그를 포함하는가? |
| 6 | 초기 템플릿 | 사용자가 시작하기 쉬운가? |

### 품질 검수

| # | 항목 | 확인 내용 |
|:-:|------|----------|
| 1 | 난이도 적절성 | 표시된 난이도와 실제 난이도가 일치하는가? |
| 2 | 버그 다양성 | Buggy implementations가 다양한 유형인가? |
| 3 | 테스트 가능성 | pytest로 테스트하기 적합한가? |
| 4 | 교육적 가치 | 학습에 도움이 되는 문제인가? |

### 검수 결과 기록 템플릿

```markdown
## 문제 검수 결과

- **문제 ID**: 
- **제목**: 
- **난이도**: Easy / Medium / Hard
- **검수일**: YYYY-MM-DD
- **검수자**: 

### 검수 결과

| 항목 | 상태 | 비고 |
|------|:----:|------|
| 제목 | ✅/⚠️/❌ | |
| 설명 | ✅/⚠️/❌ | |
| 함수 시그니처 | ✅/⚠️/❌ | |
| Golden Code | ✅/⚠️/❌ | |
| Buggy Code | ✅/⚠️/❌ | |
| 초기 템플릿 | ✅/⚠️/❌ | |
| 난이도 적절성 | ✅/⚠️/❌ | |

### 수정 필요 사항
- 

### 최종 판정
- [ ] 승인 (DB 저장 가능)
- [ ] 수정 후 재검수
- [ ] 폐기
```

---

## 🗄️ 문제 저장 API

검수가 완료된 문제를 DB에 저장합니다:

```powershell
# 문제 저장 API 호출
$problemData = Get-Content "generated_problem.json" | ConvertFrom-Json

$saveBody = @{
    slug = "problem-slug-here"
    title = $problemData.title
    description_md = $problemData.description_md
    function_signature = $problemData.function_signature
    golden_code = $problemData.golden_code
    difficulty = $problemData.difficulty
    skills = $problemData.skills_to_assess
    initial_test_template = $problemData.initial_test_template
    buggy_implementations = $problemData.buggy_implementations
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:8000/api/admin/problems" `
    -Method Post -Body $saveBody -ContentType "application/json; charset=utf-8"
```

---

## 📊 문제 생성 통계 추적

| 날짜 | Easy 생성 | Medium 생성 | Hard 생성 | 총 검수 완료 | 총 DB 저장 |
|------|:---------:|:----------:|:---------:|:-----------:|:---------:|
| | | | | | |
| | | | | | |
| **합계** | 0 | 0 | 0 | 0 | 0 |

