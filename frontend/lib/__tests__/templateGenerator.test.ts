/**
 * Unit tests for templateGenerator utility functions
 */

import {
  parseSignature,
  parseExamples,
  parseHints,
  hasExceptionExamples,
  generateTestTemplate,
  generateFallbackTemplate,
} from "../templateGenerator";
import type { Problem } from "@/types/problem";

describe("parseSignature", () => {
  it("should parse simple function signature with typed parameters", () => {
    const result = parseSignature("def add(a: int, b: int) -> int:");
    expect(result.functionName).toBe("add");
    expect(result.params).toHaveLength(2);
    expect(result.params[0]).toEqual({ name: "a", type: "int" });
    expect(result.params[1]).toEqual({ name: "b", type: "int" });
    expect(result.returnType).toBe("int");
  });

  it("should parse function with no parameters", () => {
    const result = parseSignature("def get_value() -> str:");
    expect(result.functionName).toBe("get_value");
    expect(result.params).toHaveLength(0);
    expect(result.returnType).toBe("str");
  });

  it("should parse function with untyped parameters", () => {
    const result = parseSignature("def calculate(x, y, z):");
    expect(result.functionName).toBe("calculate");
    expect(result.params).toHaveLength(3);
    expect(result.params[0]).toEqual({ name: "x", type: undefined });
    expect(result.params[1]).toEqual({ name: "y", type: undefined });
    expect(result.params[2]).toEqual({ name: "z", type: undefined });
  });

  it("should parse function with simple generic types", () => {
    // Note: Complex types with commas like Dict[str, Any] are split incorrectly
    // This is a known limitation of the simple comma-based parser
    const result = parseSignature(
      "def process(items: List[int]) -> Optional[str]:"
    );
    expect(result.functionName).toBe("process");
    expect(result.params).toHaveLength(1);
    expect(result.params[0].type).toBe("List[int]");
  });

  it("should handle missing function name gracefully", () => {
    const result = parseSignature("invalid signature");
    expect(result.functionName).toBe("function");
    expect(result.params).toHaveLength(0);
  });

  it("should parse function with no return type", () => {
    const result = parseSignature("def void_func(x: int):");
    expect(result.functionName).toBe("void_func");
    expect(result.returnType).toBeUndefined();
  });
});

describe("parseExamples", () => {
  it("should parse examples from markdown with arrow notation", () => {
    const md = `## 문제 설명
Some description here.

### 정상 동작 예시
- \`add(10, 5) -> 15\`
- \`add(-3, 3) -> 0\`

### 다음 섹션
`;
    const examples = parseExamples(md);
    expect(examples).toHaveLength(2);
    expect(examples[0]).toEqual({
      input: "add(10, 5)",
      output: "15",
      raw: "add(10, 5) -> 15",
    });
    expect(examples[1]).toEqual({
      input: "add(-3, 3)",
      output: "0",
      raw: "add(-3, 3) -> 0",
    });
  });

  it("should handle different arrow styles", () => {
    const md = `### 예시
- \`func(1) => 2\`
- \`func(3) → 4\`
`;
    const examples = parseExamples(md);
    expect(examples).toHaveLength(2);
    expect(examples[0].output).toBe("2");
    expect(examples[1].output).toBe("4");
  });

  it("should return empty array when no examples section", () => {
    const md = `## 문제 설명
Just a description without examples.
`;
    const examples = parseExamples(md);
    expect(examples).toHaveLength(0);
  });

  it("should stop parsing at next header", () => {
    const md = `### 정상 동작 예시
- \`add(1, 2) -> 3\`

## 다른 섹션
- \`not_an_example(1) -> 2\`
`;
    const examples = parseExamples(md);
    expect(examples).toHaveLength(1);
    expect(examples[0].input).toBe("add(1, 2)");
  });

  it("should handle examples without backticks", () => {
    const md = `### 동작 예시
- add(5, 5) -> 10
`;
    const examples = parseExamples(md);
    expect(examples).toHaveLength(1);
    expect(examples[0].output).toBe("10");
  });

  it("should handle string outputs", () => {
    const md = `### 정상 동작 예시
- \`format_name("John") -> "Hello, John"\`
`;
    const examples = parseExamples(md);
    expect(examples).toHaveLength(1);
    expect(examples[0].output).toBe('"Hello, John"');
  });
});

describe("parseHints", () => {
  it("should parse hints from markdown", () => {
    const md = `## 문제 설명

### 테스트 힌트
- 경계값을 테스트하세요
- 음수 입력을 확인하세요
- 빈 리스트 케이스를 고려하세요

## 다음
`;
    const hints = parseHints(md);
    expect(hints).toHaveLength(3);
    expect(hints[0]).toBe("경계값을 테스트하세요");
    expect(hints[1]).toBe("음수 입력을 확인하세요");
    expect(hints[2]).toBe("빈 리스트 케이스를 고려하세요");
  });

  it("should handle asterisk bullet points", () => {
    const md = `### 힌트
* 첫 번째 힌트
* 두 번째 힌트
`;
    const hints = parseHints(md);
    expect(hints).toHaveLength(2);
  });

  it("should return empty array when no hints section", () => {
    const md = `## 문제 설명
No hints here.
`;
    const hints = parseHints(md);
    expect(hints).toHaveLength(0);
  });

  it("should handle 아이디어 section header", () => {
    const md = `### 아이디어
- 이것을 시도해보세요
`;
    const hints = parseHints(md);
    expect(hints).toHaveLength(1);
  });

  it("should filter empty hint lines", () => {
    const md = `### 힌트
- 유효한 힌트
-
- 또 다른 힌트
`;
    const hints = parseHints(md);
    expect(hints).toHaveLength(2);
  });
});

describe("hasExceptionExamples", () => {
  it("should detect TypeError mention", () => {
    expect(hasExceptionExamples("잘못된 입력 시 TypeError 발생")).toBe(true);
  });

  it("should detect ValueError mention", () => {
    expect(hasExceptionExamples("ValueError를 발생시킵니다")).toBe(true);
  });

  it("should detect Korean exception mention", () => {
    expect(hasExceptionExamples("예외 발생 케이스")).toBe(true);
  });

  it("should detect error mention (case insensitive)", () => {
    expect(hasExceptionExamples("This will cause an Error")).toBe(true);
  });

  it("should return false when no exception mentioned", () => {
    expect(hasExceptionExamples("정상적인 설명입니다")).toBe(false);
  });

  it("should detect Exception keyword", () => {
    expect(hasExceptionExamples("Exception이 발생합니다")).toBe(true);
  });
});

describe("generateTestTemplate", () => {
  const createMockProblem = (overrides: Partial<Problem> = {}): Problem => ({
    id: 1,
    slug: "test-problem",
    title: "테스트 문제",
    function_signature: "def add(a: int, b: int) -> int:",
    description_md: `## 문제 설명
두 수를 더합니다.

### 정상 동작 예시
- \`add(1, 2) -> 3\`
- \`add(10, 20) -> 30\`

### 테스트 힌트
- 음수를 테스트하세요
`,
    golden_code: "def add(a, b): return a + b",
    difficulty: "Easy",
    buggy_implementations: [
      { id: 1, bug_description: "Bug 1", buggy_code: "..." },
      { id: 2, bug_description: "Bug 2", buggy_code: "..." },
      { id: 3, bug_description: "Bug 3", buggy_code: "..." },
    ],
    ...overrides,
  });

  it("should generate template with step sections", () => {
    const problem = createMockProblem();
    const template = generateTestTemplate(problem);
    expect(template).toContain("# Step 1: 기본 동작 테스트");
    expect(template).toContain("# Step 2: 경계값 테스트");
  });

  it("should include test functions", () => {
    const problem = createMockProblem();
    const template = generateTestTemplate(problem);
    expect(template).toContain("def test_basic():");
    expect(template).toContain("def test_edge_cases():");
  });

  it("should include function import statement", () => {
    const problem = createMockProblem();
    const template = generateTestTemplate(problem);
    expect(template).toContain("from target import add");
  });

  it("should include first example as assertion", () => {
    const problem = createMockProblem();
    const template = generateTestTemplate(problem);
    expect(template).toContain("assert add(1, 2) == 3");
  });

  it("should include edge case guidance", () => {
    const problem = createMockProblem();
    const template = generateTestTemplate(problem);
    expect(template).toContain("0, 빈 값, 최대/최소값");
  });

  it("should handle zero buggy implementations gracefully", () => {
    const problem = createMockProblem({ buggy_implementations: [] });
    const template = generateTestTemplate(problem);
    expect(template).toContain("def test_basic():");
  });

  it("should handle missing buggy_implementations gracefully", () => {
    const problem = createMockProblem();
    delete (problem as Partial<Problem>).buggy_implementations;
    const template = generateTestTemplate(problem);
    expect(template).toContain("def test_basic():");
  });

  it("should include exception test section when exceptions mentioned", () => {
    const problem = createMockProblem({
      description_md: `## 설명
잘못된 입력 시 TypeError가 발생합니다.

### 정상 동작 예시
- \`func(1) -> 2\`
`,
    });
    const template = generateTestTemplate(problem);
    expect(template).toContain("def test_exceptions()");
    expect(template).toContain("pytest.raises");
  });

  it("should not include exception test when no exceptions mentioned", () => {
    const problem = createMockProblem({
      description_md: `## 설명
정상 동작만 합니다.

### 정상 동작 예시
- \`func(1) -> 2\`
`,
    });
    const template = generateTestTemplate(problem);
    expect(template).not.toContain("def test_exceptions()");
  });

  it("should include pytest import", () => {
    const problem = createMockProblem();
    const template = generateTestTemplate(problem);
    expect(template).toContain("import pytest");
  });

  it("should include parametrize example in comments", () => {
    const problem = createMockProblem();
    const template = generateTestTemplate(problem);
    expect(template).toContain("@pytest.mark.parametrize");
  });
});

describe("generateFallbackTemplate", () => {
  it("should generate basic template with function name", () => {
    const template = generateFallbackTemplate("def calculate(x: int) -> int:");
    expect(template).toContain("from target import calculate");
    expect(template).toContain("def test_basic()");
    expect(template).toContain("def test_edge_case()");
  });

  it("should include import statement", () => {
    const template = generateFallbackTemplate("def my_func():");
    expect(template).toContain("import pytest");
    expect(template).toContain("from target import my_func");
  });

  it("should include example comments", () => {
    const template = generateFallbackTemplate("def process(data: str):");
    expect(template).toContain("# result = process(...)");
    expect(template).toContain("pytest.raises");
  });

  it("should handle malformed signature", () => {
    const template = generateFallbackTemplate("invalid");
    expect(template).toContain("from target import function");
  });
});
