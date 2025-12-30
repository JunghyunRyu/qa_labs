/**
 * Test code template generator
 * Parses problem description and generates user-friendly test templates
 */

import type { Problem } from "@/types/problem";

interface ParsedExample {
  input: string;
  output: string;
  raw: string;
}

interface ParsedSignature {
  functionName: string;
  params: Array<{ name: string; type?: string }>;
  returnType?: string;
}

/**
 * Parse function signature to extract function name and parameters
 * Example: "def add(amount_a: int, amount_b: int) -> int:"
 *       -> { functionName: "add", params: [{name: "amount_a", type: "int"}, ...], returnType: "int" }
 */
export function parseSignature(signature: string): ParsedSignature {
  const functionNameMatch = signature.match(/def\s+(\w+)/);
  const functionName = functionNameMatch ? functionNameMatch[1] : "function";

  // Extract parameters: (param1: type1, param2: type2, ...)
  const paramsMatch = signature.match(/\(([^)]*)\)/);
  const params: Array<{ name: string; type?: string }> = [];

  if (paramsMatch && paramsMatch[1]) {
    const paramStr = paramsMatch[1].trim();
    if (paramStr) {
      const paramParts = paramStr.split(",").map((p) => p.trim());
      for (const part of paramParts) {
        const [name, type] = part.split(":").map((s) => s.trim());
        if (name) {
          params.push({ name, type: type || undefined });
        }
      }
    }
  }

  // Extract return type
  const returnMatch = signature.match(/->\s*([^:]+):/);
  const returnType = returnMatch ? returnMatch[1].trim() : undefined;

  return { functionName, params, returnType };
}

/**
 * Parse description_md to extract examples from "정상 동작 예시" section
 * Example: "- `add(10, 5) -> 15`" -> { input: "add(10, 5)", output: "15", raw: "add(10, 5) -> 15" }
 */
export function parseExamples(descriptionMd: string): ParsedExample[] {
  const examples: ParsedExample[] = [];

  // Find the examples section (정상 동작 예시, Example, 예시 등)
  const lines = descriptionMd.split("\n");
  let inExampleSection = false;

  for (const line of lines) {
    // Detect example section headers
    if (
      line.match(/###?\s*(정상\s*동작\s*예시|예시|example|동작\s*예시)/i) ||
      line.match(/^\*\*정상\s*동작\s*예시\*\*/i)
    ) {
      inExampleSection = true;
      continue;
    }

    // Exit example section on new header
    if (inExampleSection && line.match(/^##/)) {
      inExampleSection = false;
      continue;
    }

    // Parse example lines like "- `add(10, 5) -> 15`" or "* add(10, 5) -> 15"
    if (inExampleSection) {
      // Match patterns like: add(10, 5) -> 15, func(x) => y, func(x) = y
      const exampleMatch = line.match(
        /`?(\w+\([^)]*\))\s*(?:->|=>|→|=)\s*([^`\n]+)`?/
      );
      if (exampleMatch) {
        examples.push({
          input: exampleMatch[1].trim(),
          output: exampleMatch[2].trim(),
          raw: `${exampleMatch[1].trim()} -> ${exampleMatch[2].trim()}`,
        });
      }
    }
  }

  return examples;
}

/**
 * Extract hints from description_md
 */
export function parseHints(descriptionMd: string): string[] {
  const hints: string[] = [];
  const lines = descriptionMd.split("\n");
  let inHintSection = false;

  for (const line of lines) {
    if (line.match(/###?\s*(테스트\s*힌트|힌트|hint|아이디어)/i)) {
      inHintSection = true;
      continue;
    }

    if (inHintSection && line.match(/^##/)) {
      inHintSection = false;
      continue;
    }

    if (inHintSection && line.match(/^[-*]\s+/)) {
      const hint = line.replace(/^[-*]\s+/, "").trim();
      if (hint) {
        hints.push(hint);
      }
    }
  }

  return hints;
}

/**
 * Check if problem has exception examples
 */
export function hasExceptionExamples(descriptionMd: string): boolean {
  return /예외\s*발생|TypeError|ValueError|Exception|에러|error/i.test(
    descriptionMd
  );
}

/**
 * Extract bug type hints from buggy implementations
 * Returns categories only (not specific bug details) to avoid spoilers
 */
export function extractBugTypeHints(
  buggyImplementations: Array<{ bug_description?: string }> | undefined
): string[] {
  if (!buggyImplementations || buggyImplementations.length === 0) {
    return [];
  }

  const typeKeywords: Record<string, string[]> = {
    경계값: ["0", "경계", "boundary", "빈", "empty", "같을 때", "정확히"],
    예외처리: ["예외", "exception", "error", "raise", "TypeError", "ValueError", "검증 누락"],
    포맷검증: ["포맷", "format", "공백", "space", "형식", "구분자"],
    타입검증: ["타입", "type", "bool", "int", "str", "isinstance"],
    로직오류: ["잘못", "wrong", "abs", "누락", "missing", "대신"],
    음수처리: ["음수", "negative", "< 0"],
    비교연산: ["<=", ">=", "비교", "< 사용", "> 사용"],
  };

  const hints = new Set<string>();
  for (const buggy of buggyImplementations) {
    const desc = buggy.bug_description || "";
    for (const [category, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some((kw) => desc.toLowerCase().includes(kw.toLowerCase()))) {
        hints.add(category);
      }
    }
  }
  return Array.from(hints);
}

/**
 * Generate a user-friendly test template based on problem info
 */
export function generateTestTemplate(problem: Problem): string {
  const { functionName, params } = parseSignature(problem.function_signature);
  const examples = parseExamples(problem.description_md);
  const hints = parseHints(problem.description_md);
  const bugTypeHints = extractBugTypeHints(problem.buggy_implementations);
  const hasExceptions = hasExceptionExamples(problem.description_md);
  const mutantCount = problem.buggy_implementations?.length || 0;

  // Build parameter placeholder for comments
  const paramPlaceholder = params.map((p) => p.name).join(", ");

  // Create first example assertion if available
  let firstExampleCode = "";
  let firstExampleComment = "";
  if (examples.length > 0) {
    const ex = examples[0];
    firstExampleCode = `    assert ${ex.input} == ${ex.output}`;
    firstExampleComment = `  # 예시: ${ex.raw}`;
  }

  // Build template with enhanced mission block
  const lines: string[] = [
    `# ============================================================`,
    `# ${problem.title}`,
    `# ============================================================`,
    `# `,
    `# 미션: 이 함수의 버그를 찾아내는 테스트 코드를 작성하세요!`,
    `#   - 정상 구현(Golden Code) 통과 -> 기본 점수`,
    `#   - 숨겨진 버그(Mutant)를 많이 잡을수록 높은 점수`,
    `#   - 이 문제에는 ${mutantCount}개의 버그가 숨어 있습니다`,
    `# `,
  ];

  // Add test hints if available
  if (hints.length > 0) {
    lines.push(`# [테스트 힌트]`);
    for (const hint of hints.slice(0, 3)) {
      const cleanHint = hint.replace(/\*\*/g, "").replace(/`/g, "");
      lines.push(`#   - ${cleanHint}`);
    }
    lines.push(`# `);
  }

  // Add bug type hints if available
  if (bugTypeHints.length > 0) {
    lines.push(`# [버그 유형 힌트]`);
    for (const type of bugTypeHints.slice(0, 4)) {
      lines.push(`#   - ${type}`);
    }
    lines.push(`# `);
  }

  lines.push(`# 채점: Mutation Score = (잡은 버그 수 / ${mutantCount}) x 100`);
  lines.push(`# ============================================================`);
  lines.push(``);
  lines.push(`import pytest`);
  lines.push(`from target import ${functionName}`);
  lines.push(``);
  lines.push(``);
  lines.push(`# ------------------------------------------------------------`);
  lines.push(`# Step 1: 기본 동작 테스트 (정상 케이스)`);
  lines.push(`# ------------------------------------------------------------`);
  lines.push(`# 먼저 함수가 올바르게 동작하는지 확인하세요.`);
  lines.push(`# 이 테스트가 통과해야 점수를 받을 수 있습니다.`);
  lines.push(``);
  lines.push(`def test_basic():`);
  lines.push(`    """기본 동작 테스트 - 정상 입력에 대한 예상 결과 확인"""`);

  if (firstExampleCode) {
    lines.push(firstExampleComment);
    lines.push(firstExampleCode);
    // Add more examples if available
    if (examples.length > 1) {
      lines.push(`    # 더 많은 예시를 추가하세요:`);
      for (let i = 1; i < Math.min(examples.length, 3); i++) {
        lines.push(`    # assert ${examples[i].input} == ${examples[i].output}`);
      }
    }
  } else {
    lines.push(`    # TODO: 함수 호출 결과를 확인하세요`);
    lines.push(`    # result = ${functionName}(${paramPlaceholder})`);
    lines.push(`    # assert result == 예상값`);
    lines.push(`    pass`);
  }

  lines.push(``);
  lines.push(``);
  lines.push(`# ------------------------------------------------------------`);
  lines.push(`# Step 2: 경계값 테스트 (Edge Cases)`);
  lines.push(`# ------------------------------------------------------------`);
  lines.push(`# 버그는 주로 경계 조건에서 발생합니다.`);
  lines.push(`# 0, 빈 값, 최대/최소값 등을 테스트하세요.`);
  lines.push(``);
  lines.push(`def test_edge_cases():`);
  lines.push(`    """경계값 테스트 - 특수한 입력값에 대한 동작 확인"""`);
  lines.push(`    # TODO: 경계값 테스트를 작성하세요`);
  lines.push(`    # 예: 0이 포함된 경우, 빈 리스트, 음수 등`);
  lines.push(`    pass`);

  // Add exception test if applicable
  if (hasExceptions) {
    lines.push(``);
    lines.push(``);
    lines.push(`# ------------------------------------------------------------`);
    lines.push(`# Step 3: 예외 테스트 (Error Handling)`);
    lines.push(`# ------------------------------------------------------------`);
    lines.push(`# 잘못된 입력에 대해 적절한 예외가 발생하는지 확인하세요.`);
    lines.push(``);
    lines.push(`def test_exceptions():`);
    lines.push(`    """예외 테스트 - 잘못된 입력에 대한 에러 처리 확인"""`);
    lines.push(`    # TODO: 예외 발생 테스트를 작성하세요`);
    lines.push(`    # with pytest.raises(TypeError):`);
    lines.push(`    #     ${functionName}(None)  # 또는 다른 잘못된 입력`);
    lines.push(`    pass`);
  }

  lines.push(``);
  lines.push(``);
  lines.push(`# ------------------------------------------------------------`);
  lines.push(`# Step ${hasExceptions ? "4" : "3"}: 추가 테스트 (버그 잡기)`);
  lines.push(`# ------------------------------------------------------------`);
  lines.push(`# 더 많은 테스트 케이스를 추가하여 숨겨진 버그를 찾아보세요.`);
  lines.push(`# pytest.mark.parametrize를 사용하면 여러 케이스를 효율적으로 테스트할 수 있습니다.`);
  lines.push(``);
  lines.push(`# @pytest.mark.parametrize("${paramPlaceholder}, expected", [`);
  lines.push(`#     # (입력값들, 예상결과),`);
  lines.push(`# ])`);
  lines.push(`# def test_parametrized(${paramPlaceholder}, expected):`);
  lines.push(`#     assert ${functionName}(${paramPlaceholder}) == expected`);
  lines.push(``);

  return lines.join("\n");
}

/**
 * Fallback template when parsing fails
 */
export function generateFallbackTemplate(functionSignature: string): string {
  const { functionName } = parseSignature(functionSignature);

  return `import pytest
from target import ${functionName}


def test_basic():
    """기본 테스트 케이스"""
    # 정상 입력에 대한 테스트
    # result = ${functionName}(...)  # TODO: 인자 입력
    # assert result == ...  # TODO: 예상 결과
    pass


def test_edge_case():
    """경계값/예외 테스트"""
    # 경계값 테스트 예시
    # assert ${functionName}([]) == 0

    # 예외 테스트 예시
    # with pytest.raises(ValueError):
    #     ${functionName}(invalid_input)
    pass
`;
}
