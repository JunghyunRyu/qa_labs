/**
 * Pyodide Web Worker
 *
 * 메인 스레드 블로킹 없이 Python 코드를 실행합니다.
 */

/// <reference lib="webworker" />

import type {
  WorkerRequest,
  WorkerResponse,
  ProgressInfo,
  CodeExecutionResult,
  PytestResult,
  MutationTestResult,
  JudgeResult,
  JudgeErrorType,
  RunJudgeRequest,
} from './pyodide-worker-types';

// Web Worker 전역 함수 타입 선언
declare function importScripts(...urls: string[]): void;
declare function loadPyodide(options?: { indexURL?: string }): Promise<PyodideInterface>;

// Pyodide CDN URL
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/';

// Pyodide 인터페이스 (Worker 컨텍스트용)
interface PyodideInterface {
  runPython(code: string): unknown;
  runPythonAsync(code: string): Promise<unknown>;
  loadPackage(names: string | string[]): Promise<void>;
  pyimport(name: string): unknown;
  FS: {
    writeFile(path: string, data: string): void;
    readFile(path: string): string;
    readdir(path: string): string[];
    unlink(path: string): void;
  };
  version: string;
}

interface MicropipInterface {
  install(packages: string | string[]): Promise<void>;
}

// 전역 상태
let pyodide: PyodideInterface | null = null;
let micropip: MicropipInterface | null = null;

// 진행률 전송 헬퍼
function sendProgress(info: ProgressInfo, id?: string): void {
  const response: WorkerResponse = {
    type: 'progress',
    id,
    payload: info,
  };
  self.postMessage(response);
}

// 에러 전송 헬퍼
function sendError(message: string, id?: string, stack?: string): void {
  const response: WorkerResponse = {
    type: 'error',
    id,
    payload: { message, stack },
  };
  self.postMessage(response);
}

// 결과 전송 헬퍼
function sendResult(id: string, success: boolean, data: unknown, executionTime: number): void {
  const response: WorkerResponse = {
    type: 'result',
    id,
    payload: { success, data, executionTime },
  };
  self.postMessage(response);
}

/**
 * Pyodide 초기화
 */
async function initializePyodide(id: string): Promise<void> {
  const startTime = performance.now();

  try {
    sendProgress({ stage: 'loading', message: 'Pyodide 스크립트 로드 중...' }, id);

    // Pyodide 스크립트 로드 (importScripts는 Worker에서 사용)
    importScripts(`${PYODIDE_CDN_URL}pyodide.js`);

    sendProgress({ stage: 'loading', message: 'Pyodide 런타임 초기화 중...' }, id);

    pyodide = await loadPyodide({
      indexURL: PYODIDE_CDN_URL,
    });

    sendProgress({ stage: 'installing', message: 'micropip 패키지 관리자 로드 중...' }, id);

    await pyodide!.loadPackage('micropip');
    micropip = pyodide!.pyimport('micropip') as MicropipInterface;

    sendProgress({ stage: 'installing', message: 'pytest 설치 중...' }, id);

    await micropip!.install('pytest');

    const loadTime = performance.now() - startTime;

    const response: WorkerResponse = {
      type: 'initialized',
      id,
      payload: {
        version: pyodide!.version,
        loadTime,
      },
    };
    self.postMessage(response);
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : 'Pyodide 초기화 실패',
      id,
      error instanceof Error ? error.stack : undefined
    );
  }
}

/**
 * 타임아웃 상수 (5초)
 */
const EXECUTION_TIMEOUT_MS = 5000;

/**
 * 타임아웃을 적용하여 Python 코드 실행
 */
async function runPythonWithTimeout(code: string, timeoutMs: number = EXECUTION_TIMEOUT_MS): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(
        `실행 시간 초과 (${timeoutMs / 1000}초). 무한 루프나 과도한 연산이 있는지 확인해주세요.`
      ));
    }, timeoutMs);

    // 실제 실행
    pyodide!.runPythonAsync(code)
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Python 코드 실행
 */
async function runPython(id: string, code: string): Promise<void> {
  if (!pyodide) {
    sendError('Pyodide가 초기화되지 않았습니다.', id);
    return;
  }

  const startTime = performance.now();

  try {
    sendProgress({ stage: 'executing', message: 'Python 코드 실행 중...' }, id);

    const wrappedCode = `
import sys
from io import StringIO

_stdout_backup = sys.stdout
_stderr_backup = sys.stderr
sys.stdout = _captured_stdout = StringIO()
sys.stderr = _captured_stderr = StringIO()

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
finally:
    _output = _captured_stdout.getvalue()
    _error = _captured_stderr.getvalue()
    sys.stdout = _stdout_backup
    sys.stderr = _stderr_backup

(_output, _error)
`;

    const result = await runPythonWithTimeout(wrappedCode) as { toJs: () => [string, string] };
    const [output, error] = result.toJs();

    const executionTime = performance.now() - startTime;

    const codeResult: CodeExecutionResult = {
      success: true,
      output: output + (error ? `\n[stderr]\n${error}` : ''),
      executionTime,
    };

    sendResult(id, true, codeResult, executionTime);
  } catch (error) {
    const executionTime = performance.now() - startTime;
    const codeResult: CodeExecutionResult = {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
      executionTime,
    };
    sendResult(id, false, codeResult, executionTime);
  }
}

/**
 * pytest 실행
 */
async function runPytest(
  id: string,
  testCode: string,
  targetCode: string
): Promise<void> {
  if (!pyodide) {
    sendError('Pyodide가 초기화되지 않았습니다.', id);
    return;
  }

  const startTime = performance.now();

  try {
    sendProgress({ stage: 'testing', message: 'pytest 실행 중...' }, id);

    // 파일 작성
    pyodide.FS.writeFile('/home/pyodide/target.py', targetCode);
    pyodide.FS.writeFile('/home/pyodide/test_submission.py', testCode);

    const pytestRunner = `
import sys
import os
from io import StringIO

os.chdir('/home/pyodide')
if '/home/pyodide' not in sys.path:
    sys.path.insert(0, '/home/pyodide')

for mod_name in list(sys.modules.keys()):
    if mod_name in ('target', 'test_submission') or mod_name.startswith('target.') or mod_name.startswith('test_submission.'):
        del sys.modules[mod_name]

_stdout_backup = sys.stdout
sys.stdout = _captured = StringIO()

try:
    import pytest
    exit_code = pytest.main(['-v', '--tb=short', '-p', 'no:cacheprovider', 'test_submission.py'])
except Exception as e:
    print(f"Error: {e}")
    exit_code = -1
finally:
    _output = _captured.getvalue()
    sys.stdout = _stdout_backup

(_output, exit_code)
`;

    const result = pyodide.runPython(pytestRunner) as { toJs: () => [string, number] };
    const [output, exitCode] = result.toJs();

    const executionTime = performance.now() - startTime;
    const parsedResult = parsePytestOutput(output);

    const pytestResult: PytestResult = {
      ...parsedResult,
      executionTime,
    };

    sendResult(id, true, pytestResult, executionTime);
  } catch (error) {
    const executionTime = performance.now() - startTime;
    sendResult(id, false, {
      passed: 0,
      failed: 0,
      errors: 1,
      total: 0,
      output: error instanceof Error ? error.message : String(error),
      executionTime,
      testDetails: [],
    }, executionTime);
  }
}

/**
 * pytest 출력 파싱
 */
function parsePytestOutput(output: string): Omit<PytestResult, 'executionTime'> {
  const testDetails: PytestResult['testDetails'] = [];
  let passed = 0;
  let failed = 0;
  let errors = 0;

  const testResultPattern = /(\S+::\S+)\s+(PASSED|FAILED|ERROR|SKIPPED)/g;
  let match;

  while ((match = testResultPattern.exec(output)) !== null) {
    const [, name, status] = match;
    const statusLower = status.toLowerCase() as 'passed' | 'failed' | 'error' | 'skipped';

    testDetails.push({ name, status: statusLower });

    switch (statusLower) {
      case 'passed': passed++; break;
      case 'failed': failed++; break;
      case 'error': errors++; break;
    }
  }

  const summaryPattern = /(\d+)\s+passed|(\d+)\s+failed|(\d+)\s+error/g;
  while ((match = summaryPattern.exec(output)) !== null) {
    if (match[1]) passed = Math.max(passed, parseInt(match[1]));
    if (match[2]) failed = Math.max(failed, parseInt(match[2]));
    if (match[3]) errors = Math.max(errors, parseInt(match[3]));
  }

  return {
    passed,
    failed,
    errors,
    total: passed + failed + errors,
    output,
    testDetails,
  };
}

/**
 * Mutation Testing 실행
 */
async function runMutationTest(
  id: string,
  testCode: string,
  goldenCode: string,
  buggyImplementations: Array<{ id: string; code: string }>
): Promise<void> {
  if (!pyodide) {
    sendError('Pyodide가 초기화되지 않았습니다.', id);
    return;
  }

  const startTime = performance.now();
  const details: MutationTestResult['details'] = [];
  const totalSteps = 1 + buggyImplementations.length;
  let currentStep = 0;

  try {
    // Golden Code 테스트
    sendProgress({
      stage: 'testing',
      message: 'Golden Code 테스트 중...',
      current: ++currentStep,
      total: totalSteps,
      percent: Math.round((currentStep / totalSteps) * 100),
    }, id);

    pyodide.FS.writeFile('/home/pyodide/target.py', goldenCode);
    pyodide.FS.writeFile('/home/pyodide/test_submission.py', testCode);

    const goldenResult = await runPytestInternal(testCode, goldenCode);
    const goldenCodePassed = goldenResult.failed === 0 && goldenResult.errors === 0;

    if (!goldenCodePassed) {
      const totalTime = performance.now() - startTime;
      const result: MutationTestResult = {
        goldenCodePassed: false,
        mutantsKilled: 0,
        totalMutants: buggyImplementations.length,
        score: 0,
        details: [],
        totalExecutionTime: totalTime,
        // M6-2: Golden 테스트 실패 시 출력 포함 (에러 힌트용)
        goldenTestOutput: goldenResult.output,
      };
      sendResult(id, true, result, totalTime);
      return;
    }

    // Mutant 테스트
    let mutantsKilled = 0;

    for (const mutant of buggyImplementations) {
      sendProgress({
        stage: 'testing',
        message: `Mutant ${mutant.id} 테스트 중...`,
        current: ++currentStep,
        total: totalSteps,
        percent: Math.round((currentStep / totalSteps) * 100),
      }, id);

      const mutantStartTime = performance.now();
      const mutantResult = await runPytestInternal(testCode, mutant.code);
      const mutantExecutionTime = performance.now() - mutantStartTime;

      const killed = mutantResult.failed > 0 || mutantResult.errors > 0;
      if (killed) mutantsKilled++;

      details.push({
        mutantId: mutant.id,
        killed,
        testOutput: mutantResult.output,
        executionTime: mutantExecutionTime,
      });
    }

    const totalTime = performance.now() - startTime;
    const score = buggyImplementations.length > 0
      ? Math.round((mutantsKilled / buggyImplementations.length) * 100)
      : 100;

    const result: MutationTestResult = {
      goldenCodePassed: true,
      mutantsKilled,
      totalMutants: buggyImplementations.length,
      score,
      details,
      totalExecutionTime: totalTime,
    };

    sendResult(id, true, result, totalTime);
  } catch (error) {
    const totalTime = performance.now() - startTime;
    sendError(
      error instanceof Error ? error.message : 'Mutation testing 실패',
      id,
      error instanceof Error ? error.stack : undefined
    );
  }
}

/**
 * 내부용 pytest 실행 (결과만 반환)
 */
async function runPytestInternal(
  testCode: string,
  targetCode: string
): Promise<Omit<PytestResult, 'executionTime'>> {
  if (!pyodide) {
    throw new Error('Pyodide가 초기화되지 않았습니다.');
  }

  pyodide.FS.writeFile('/home/pyodide/target.py', targetCode);
  pyodide.FS.writeFile('/home/pyodide/test_submission.py', testCode);

  const pytestRunner = `
import sys
import os
from io import StringIO

os.chdir('/home/pyodide')
if '/home/pyodide' not in sys.path:
    sys.path.insert(0, '/home/pyodide')

for mod_name in list(sys.modules.keys()):
    if mod_name in ('target', 'test_submission') or mod_name.startswith('target.') or mod_name.startswith('test_submission.'):
        del sys.modules[mod_name]

_stdout_backup = sys.stdout
sys.stdout = _captured = StringIO()

try:
    import pytest
    exit_code = pytest.main(['-v', '--tb=short', '-p', 'no:cacheprovider', 'test_submission.py'])
except Exception as e:
    print(f"Error: {e}")
    exit_code = -1
finally:
    _output = _captured.getvalue()
    sys.stdout = _stdout_backup

(_output, exit_code)
`;

  const result = await runPythonWithTimeout(pytestRunner) as { toJs: () => [string, number] };
  const [output] = result.toJs();

  return parsePytestOutput(output);
}

/**
 * 파일시스템 정리
 */
function cleanup(id: string): void {
  if (!pyodide) {
    sendResult(id, true, { cleaned: false }, 0);
    return;
  }

  try {
    const files = pyodide.FS.readdir('/home/pyodide');
    for (const file of files) {
      if (file !== '.' && file !== '..') {
        try {
          pyodide.FS.unlink(`/home/pyodide/${file}`);
        } catch {
          // 디렉토리인 경우 무시
        }
      }
    }
    sendResult(id, true, { cleaned: true }, 0);
  } catch {
    sendResult(id, true, { cleaned: false }, 0);
  }
}

/**
 * AI Verifier Judge: 에러 타입 분류
 */
function classifyJudgeError(error: Error): { type: JudgeErrorType; userMessage: string } {
  const msg = error.message.toLowerCase();

  if (msg.includes('syntaxerror') || msg.includes('syntax error')) {
    return { type: 'E_SYNTAX', userMessage: '코드에 문법 오류가 있습니다.' };
  }
  if (msg.includes('e_timeout') || msg.includes('timeout') || msg.includes('시간 초과')) {
    return { type: 'E_TIMEOUT', userMessage: '실행 시간이 초과되었습니다. (5초)' };
  }
  if (msg.includes('memory') || msg.includes('heap')) {
    return { type: 'E_MEMORY', userMessage: '메모리 제한을 초과했습니다.' };
  }
  if (msg.includes('e_forbidden') || msg.includes('forbidden') || msg.includes('not allowed') || msg.includes('허용되지 않')) {
    return { type: 'E_FORBIDDEN', userMessage: '허용되지 않는 코드 패턴입니다.' };
  }
  if (msg.includes('e_input') || msg.includes('파싱할 수 없')) {
    return { type: 'E_INPUT', userMessage: '입력 형식이 올바르지 않습니다.' };
  }
  return { type: 'E_RUNTIME', userMessage: `실행 중 오류: ${error.message}` };
}

/**
 * AI Verifier Judge: 결과 비교
 */
function compareJudgeResults(
  actual: unknown,
  expected: unknown,
  expectedType: string,
  config: RunJudgeRequest['payload']['comparisonConfig']
): boolean {
  // Float 엡실론 비교
  if (expectedType === 'float') {
    const epsilon = config.float_epsilon ?? 1e-6;
    if (typeof actual === 'number' && typeof expected === 'number') {
      return Math.abs(actual - expected) < epsilon;
    }
  }

  // 리스트 순서
  if (expectedType === 'list' && Array.isArray(actual) && Array.isArray(expected)) {
    if (config.list_order_matters !== false) {
      return JSON.stringify(actual) === JSON.stringify(expected);
    }
    return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
  }

  // 문자열 대소문자
  if (expectedType === 'str' && config.case_sensitive === false) {
    return String(actual).toLowerCase() === String(expected).toLowerCase();
  }

  // 기본 비교
  return JSON.stringify(actual) === JSON.stringify(expected);
}

/**
 * AI Verifier Judge: 결과 포맷팅
 */
function formatJudgeResult(value: unknown): string {
  if (value === null) return 'None';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * AI Verifier Judge 실행
 */
async function runJudge(
  id: string,
  payload: RunJudgeRequest['payload']
): Promise<void> {
  if (!pyodide) {
    sendError('Pyodide가 초기화되지 않았습니다.', id);
    return;
  }

  const {
    userInput,
    buggyCode,
    correctCode,
    functionName,
    expectedOutputType,
    comparisonConfig,
  } = payload;

  const startTime = performance.now();

  try {
    sendProgress({ stage: 'executing', message: '입력값 파싱 중...' }, id);

    // 1. 입력 파싱 (2-Phase: JSON → ast.literal_eval)
    const parseCode = `
import json
import ast

def _parse_input(raw):
    raw = raw.strip()
    # Phase 1: JSON
    try:
        return json.loads(raw)
    except:
        pass
    # Phase 2: literal_eval
    try:
        return ast.literal_eval(raw)
    except Exception as e:
        raise ValueError(f"E_INPUT: 입력을 파싱할 수 없습니다 - {e}")

_parsed_input = _parse_input(${JSON.stringify(userInput)})
_parsed_input
`;

    const parseResult = await runPythonWithTimeout(parseCode);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsedInput = (parseResult as any)?.toJs ? (parseResult as any).toJs() : parseResult;

    sendProgress({ stage: 'executing', message: '보안 검사 중...' }, id);

    // 2. 보안 검사 (금지 패턴)
    const securityCheckCode = `
import re
_FORBIDDEN_PATTERNS = [
    r'\\bimport\\s+os\\b', r'\\bimport\\s+sys\\b', r'\\bimport\\s+subprocess\\b',
    r'\\bopen\\s*\\(', r'\\beval\\s*\\(', r'\\bexec\\s*\\(',
    r'\\b__import__\\s*\\(', r'\\bglobals\\s*\\(', r'\\blocals\\s*\\('
]
for _pattern in _FORBIDDEN_PATTERNS:
    if re.search(_pattern, ${JSON.stringify(buggyCode)}) or re.search(_pattern, ${JSON.stringify(correctCode)}):
        raise PermissionError("E_FORBIDDEN: 허용되지 않는 코드 패턴")
True
`;
    await runPythonWithTimeout(securityCheckCode);

    sendProgress({ stage: 'executing', message: '정답 코드 실행 중...' }, id);

    // 3. 정답 코드 실행 (격리된 globals)
    const correctExecCode = `
_correct_globals = {'__builtins__': __builtins__}
exec(${JSON.stringify(correctCode)}, _correct_globals)
_correct_func = _correct_globals['${functionName}']
_expected_result = _correct_func(_parsed_input)
_expected_result
`;
    const expectedResultRaw = await runPythonWithTimeout(correctExecCode);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expectedResult = (expectedResultRaw as any)?.toJs ? (expectedResultRaw as any).toJs() : expectedResultRaw;

    sendProgress({ stage: 'executing', message: '버그 코드 실행 중...' }, id);

    // 4. 버그 코드 실행 (별도 격리 globals)
    const buggyExecCode = `
_buggy_globals = {'__builtins__': __builtins__}
exec(${JSON.stringify(buggyCode)}, _buggy_globals)
_buggy_func = _buggy_globals['${functionName}']
_actual_result = _buggy_func(_parsed_input)
_actual_result
`;
    const actualResultRaw = await runPythonWithTimeout(buggyExecCode);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actualResult = (actualResultRaw as any)?.toJs ? (actualResultRaw as any).toJs() : actualResultRaw;

    // 5. 결과 비교 (타입별 규칙 적용)
    const resultsMatch = compareJudgeResults(
      actualResult,
      expectedResult,
      expectedOutputType,
      comparisonConfig
    );
    const bugFound = !resultsMatch;

    const executionTimeMs = Math.round(performance.now() - startTime);

    const judgeResult: JudgeResult = {
      success: true,
      bugFound,
      userInput,
      parsedInput,
      actualResult: formatJudgeResult(actualResult),
      expectedResult: formatJudgeResult(expectedResult),
      executionTimeMs,
    };

    sendResult(id, true, judgeResult, executionTimeMs);
  } catch (error) {
    const executionTimeMs = Math.round(performance.now() - startTime);
    const { type, userMessage } = classifyJudgeError(error as Error);

    const judgeResult: JudgeResult = {
      success: false,
      bugFound: false,
      userInput,
      parsedInput: null,
      actualResult: null,
      expectedResult: null,
      errorType: type,
      errorMessage: error instanceof Error ? error.message : String(error),
      userFriendlyMessage: userMessage,
      executionTimeMs,
    };

    sendResult(id, false, judgeResult, executionTimeMs);
  }
}

// 메시지 핸들러
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, id } = event.data;

  switch (type) {
    case 'init':
      await initializePyodide(id);
      break;

    case 'runPython':
      await runPython(id, event.data.payload.code);
      break;

    case 'runPytest':
      await runPytest(
        id,
        event.data.payload.testCode,
        event.data.payload.targetCode
      );
      break;

    case 'runMutationTest':
      await runMutationTest(
        id,
        event.data.payload.testCode,
        event.data.payload.goldenCode,
        event.data.payload.buggyImplementations
      );
      break;

    case 'runJudge':
      await runJudge(id, (event.data as RunJudgeRequest).payload);
      break;

    case 'cleanup':
      cleanup(id);
      break;

    default:
      sendError(`Unknown message type: ${type}`);
  }
};

// Worker 준비 완료 알림
self.postMessage({ type: 'ready' } as WorkerResponse);
