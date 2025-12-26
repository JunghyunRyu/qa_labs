# M5-1: 좌측 Contract(반환 객체 인터페이스) 고정 노출

## 개요
- **목표**: 함수 시그니처와 반환 타입/인터페이스를 문제 패널 상단에 항상 표시
- **우선순위**: High
- **예상 작업량**: 1-2일

## 기능 요구사항

### 핵심 기능
1. **Contract 정보 추출**
   - 문제 설명에서 함수 시그니처 자동 파싱
   - 반환 타입/인터페이스 정보 추출
   - TypeScript/Python 타입 힌트 지원

2. **고정 노출 영역**
   - 문제 패널 상단에 접이식 카드로 표시
   - 스크롤해도 항상 보이는 sticky 헤더 옵션
   - 토글로 접기/펼치기 가능

3. **Contract 표시 형식**
   ```
   ┌─────────────────────────────────────────┐
   │ 📋 함수 Contract                    [−] │
   ├─────────────────────────────────────────┤
   │ def calculate_tax(income: float,       │
   │                   deductions: list)     │
   │     -> TaxResult                        │
   │                                         │
   │ class TaxResult:                        │
   │     tax_amount: float                   │
   │     effective_rate: float               │
   │     breakdown: dict                     │
   └─────────────────────────────────────────┘
   ```

### UI 디자인

#### Contract 카드 상태
| 상태 | 표시 |
|------|------|
| 펼침 | 전체 시그니처 + 반환 타입 상세 |
| 접힘 | 한 줄 요약 (예: `calculate_tax(...) -> TaxResult`) |

#### 색상 테마
- 배경: `bg-slate-900` (다크 코드 스타일)
- 테두리: `border-purple-500/30`
- 텍스트: 구문 강조 (키워드, 타입, 변수명)

## 기술 구현

### 데이터 구조
```typescript
interface ContractInfo {
  functionName: string;
  parameters: Parameter[];
  returnType: string;
  returnInterface?: InterfaceDefinition;
}

interface Parameter {
  name: string;
  type: string;
  optional?: boolean;
  default?: string;
}

interface InterfaceDefinition {
  name: string;
  fields: { name: string; type: string; description?: string }[];
}
```

### Contract 파싱 로직
```typescript
// 문제 설명에서 Contract 추출
function parseContract(description: string): ContractInfo | null {
  // 1. 코드 블록에서 함수 시그니처 찾기
  const codeBlockRegex = /```python\n(def \w+\([^)]*\)[^:]*:)/;

  // 2. 반환 타입 파싱
  const returnTypeRegex = /-> (\w+)/;

  // 3. 클래스/인터페이스 정의 찾기
  const classRegex = /class (\w+):\n((?:\s+\w+:.*\n)+)/;

  // ... 파싱 로직
}
```

### 컴포넌트 구조
```tsx
// ContractCard.tsx
interface ContractCardProps {
  contract: ContractInfo;
  isExpanded: boolean;
  onToggle: () => void;
  isSticky?: boolean;
}

function ContractCard({ contract, isExpanded, onToggle, isSticky }: ContractCardProps) {
  return (
    <div className={cn(
      "bg-slate-900 border border-purple-500/30 rounded-lg",
      isSticky && "sticky top-0 z-10"
    )}>
      {/* 헤더 */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3"
      >
        <span className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">함수 Contract</span>
        </span>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {/* 내용 */}
      {isExpanded && (
        <div className="p-4 border-t border-slate-700">
          <SyntaxHighlighter language="python">
            {formatSignature(contract)}
          </SyntaxHighlighter>

          {contract.returnInterface && (
            <div className="mt-3">
              <InterfaceDisplay interface={contract.returnInterface} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## 고려사항

### 파싱 정확도
- 다양한 함수 시그니처 형식 지원
- 복잡한 타입 (Union, Optional, Generic) 처리
- 파싱 실패 시 graceful degradation (원본 코드 블록 표시)

### 성능
- 문제 로드 시 한 번만 파싱
- 파싱 결과 캐싱
- 큰 인터페이스는 초기 접힘 상태

### 접근성
- 키보드 네비게이션 지원
- 스크린 리더 호환 (aria-expanded)
- 충분한 색상 대비

## 테스트 케이스
- [ ] Python 함수 시그니처 파싱
- [ ] TypeScript 함수 시그니처 파싱
- [ ] 복잡한 반환 타입 표시
- [ ] 접기/펼치기 토글 동작
- [ ] Sticky 헤더 스크롤 동작
- [ ] 파싱 실패 시 fallback UI
- [ ] 다양한 화면 크기 대응

## 백엔드 변경사항 (선택)
- `Problem` 모델에 `contract_json` 필드 추가
- 문제 생성 시 Contract 정보 사전 파싱하여 저장
- API 응답에 구조화된 Contract 정보 포함

---
*생성일: 2024-12-24*
