/** Parse pytest output and extract test results */

export interface TestResult {
  name: string;
  status: "PASSED" | "FAILED" | "ERROR";
  duration?: number;
  error?: {
    type: string;
    message: string;
    location: string;
    diff?: { expected: string; actual: string };
  };
}

export interface ParsedOutput {
  summary: { total: number; passed: number; failed: number; errors: number };
  tests: TestResult[];
}

/**
 * Parse pytest output from stdout and stderr
 */
export function parsePytestOutput(stdout: string, stderr: string): ParsedOutput {
  const tests: TestResult[] = [];
  const lines = stdout.split("\n");

  // Pattern: "test_user.py::test_name PASSED [33%]"
  const testResultRegex = /^(.+?)::(\w+)\s+(PASSED|FAILED|ERROR)/;

  // Pattern: "AssertionError: assert 2 == 3"
  const assertionRegex = /AssertionError:\s*assert\s+(.+?)\s*==\s*(.+?)$/;

  let currentTest: TestResult | null = null;
  let collectingError = false;
  let errorLines: string[] = [];

  for (const line of lines) {
    const match = line.match(testResultRegex);
    if (match) {
      // Save previous test if exists
      if (currentTest) {
        if (errorLines.length > 0 && currentTest.status === "FAILED") {
          const errorText = errorLines.join("\n");
          if (!currentTest.error) {
            currentTest.error = {
              type: "AssertionError",
              message: errorText,
              location: "",
            };
          }
        }
        tests.push(currentTest);
        errorLines = [];
      }

      currentTest = {
        name: match[2],
        status: match[3] as "PASSED" | "FAILED" | "ERROR",
      };
      collectingError = currentTest.status === "FAILED";
    }

    // Collect error information for FAILED tests
    if (collectingError && currentTest) {
      // AssertionError parsing
      const assertMatch = line.match(assertionRegex);
      if (assertMatch) {
        currentTest.error = {
          type: "AssertionError",
          message: line.trim(),
          location: "",
          diff: {
            actual: assertMatch[1].trim(),
            expected: assertMatch[2].trim(),
          },
        };
      }

      // Collect error lines
      if (line.includes("AssertionError") || line.includes("assert ")) {
        errorLines.push(line.trim());
      }
    }
  }

  // Save last test
  if (currentTest) {
    if (errorLines.length > 0 && currentTest.status === "FAILED") {
      const errorText = errorLines.join("\n");
      if (!currentTest.error) {
        currentTest.error = {
          type: "AssertionError",
          message: errorText,
          location: "",
        };
      }
    }
    tests.push(currentTest);
  }

  return {
    summary: {
      total: tests.length,
      passed: tests.filter((t) => t.status === "PASSED").length,
      failed: tests.filter((t) => t.status === "FAILED").length,
      errors: tests.filter((t) => t.status === "ERROR").length,
    },
    tests,
  };
}

/**
 * Extract assertion diff from error message
 */
export function extractAssertionDiff(
  message: string
): { expected: string; actual: string } | null {
  const match = message.match(/assert\s+(.+?)\s*==\s*(.+?)$/);
  if (match) {
    return { actual: match[1].trim(), expected: match[2].trim() };
  }
  return null;
}
