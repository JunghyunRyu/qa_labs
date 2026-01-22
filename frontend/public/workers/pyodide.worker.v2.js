/**
 * Pyodide Web Worker
 *
 * 메인 스레드 블로킹 없이 Python 코드를 실행합니다.
 * 이 파일은 Turbopack 번들링을 우회하기 위해 public 폴더에 위치합니다.
 */

// Pyodide CDN URL
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.29.0/full/';

// 전역 상태
let pyodide = null;
let micropip = null;

// 진행률 전송 헬퍼
function sendProgress(info, id) {
  self.postMessage({
    type: 'progress',
    id: id,
    payload: info,
  });
}

// 에러 전송 헬퍼
function sendError(message, id, stack) {
  self.postMessage({
    type: 'error',
    id: id,
    payload: { message: message, stack: stack },
  });
}

// 결과 전송 헬퍼
function sendResult(id, success, data, executionTime) {
  self.postMessage({
    type: 'result',
    id: id,
    payload: { success: success, data: data, executionTime: executionTime },
  });
}

/**
 * Pyodide 초기화
 */
async function initializePyodide(id) {
  const startTime = performance.now();

  try {
    sendProgress({ stage: 'loading', message: 'Pyodide 스크립트 로드 중...' }, id);

    // Pyodide 스크립트 로드
    importScripts(PYODIDE_CDN_URL + 'pyodide.js');

    sendProgress({ stage: 'loading', message: 'Pyodide 런타임 초기화 중...' }, id);

    pyodide = await loadPyodide({
      indexURL: PYODIDE_CDN_URL,
    });

    sendProgress({ stage: 'installing', message: 'micropip 패키지 관리자 로드 중...' }, id);

    await pyodide.loadPackage('micropip');
    micropip = pyodide.pyimport('micropip');

    sendProgress({ stage: 'installing', message: 'pytest 설치 중...' }, id);

    await micropip.install('pytest');

    const loadTime = performance.now() - startTime;

    self.postMessage({
      type: 'initialized',
      id: id,
      payload: {
        version: pyodide.version,
        loadTime: loadTime,
      },
    });
  } catch (error) {
    sendError(
      error instanceof Error ? error.message : 'Pyodide 초기화 실패',
      id,
      error instanceof Error ? error.stack : undefined
    );
  }
}

/**
 * Python 코드 실행
 */
async function runPython(id, code) {
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

    const result = pyodide.runPython(wrappedCode);
    const [output, error] = result.toJs();

    const executionTime = performance.now() - startTime;

    const codeResult = {
      success: true,
      output: output + (error ? '\n[stderr]\n' + error : ''),
      executionTime: executionTime,
    };

    sendResult(id, true, codeResult, executionTime);
  } catch (error) {
    const executionTime = performance.now() - startTime;
    const codeResult = {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
      executionTime: executionTime,
    };
    sendResult(id, false, codeResult, executionTime);
  }
}

/**
 * pytest 실행
 */
async function runPytest(id, testCode, targetCode) {
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

    const result = pyodide.runPython(pytestRunner);
    const [output, exitCode] = result.toJs();

    const executionTime = performance.now() - startTime;
    const parsedResult = parsePytestOutput(output);

    const pytestResult = {
      ...parsedResult,
      executionTime: executionTime,
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
      executionTime: executionTime,
      testDetails: [],
    }, executionTime);
  }
}

/**
 * pytest 출력 파싱
 */
function parsePytestOutput(output) {
  const testDetails = [];
  let passed = 0;
  let failed = 0;
  let errors = 0;

  const testResultPattern = /(\S+::\S+)\s+(PASSED|FAILED|ERROR|SKIPPED)/g;
  let match;

  while ((match = testResultPattern.exec(output)) !== null) {
    const [, name, status] = match;
    const statusLower = status.toLowerCase();

    testDetails.push({ name: name, status: statusLower });

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
    passed: passed,
    failed: failed,
    errors: errors,
    total: passed + failed + errors,
    output: output,
    testDetails: testDetails,
  };
}

/**
 * Mutation Testing 실행
 */
async function runMutationTest(id, testCode, goldenCode, buggyImplementations) {
  if (!pyodide) {
    sendError('Pyodide가 초기화되지 않았습니다.', id);
    return;
  }

  const startTime = performance.now();
  const details = [];
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
      const result = {
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
        message: 'Mutant ' + mutant.id + ' 테스트 중...',
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
        killed: killed,
        testOutput: mutantResult.output,
        executionTime: mutantExecutionTime,
      });
    }

    const totalTime = performance.now() - startTime;
    const score = buggyImplementations.length > 0
      ? Math.round((mutantsKilled / buggyImplementations.length) * 100)
      : 100;

    const result = {
      goldenCodePassed: true,
      mutantsKilled: mutantsKilled,
      totalMutants: buggyImplementations.length,
      score: score,
      details: details,
      totalExecutionTime: totalTime,
    };

    sendResult(id, true, result, totalTime);
  } catch (error) {
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
async function runPytestInternal(testCode, targetCode) {
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

  const result = pyodide.runPython(pytestRunner);
  const [output] = result.toJs();

  return parsePytestOutput(output);
}

/**
 * AI Verifier Judge 실행
 * 사용자 입력으로 버그 코드와 정답 코드를 실행하여 결과 비교
 */
async function runJudge(id, payload) {
  if (!pyodide) {
    sendError('Pyodide가 초기화되지 않았습니다.', id);
    return;
  }

  const startTime = performance.now();
  const { userInput, buggyCode, correctCode, functionName, expectedOutputType, comparisonConfig } = payload;

  try {
    sendProgress({ stage: 'judging', message: '입력값 파싱 중...' }, id);

    // Python 코드로 입력 파싱 및 함수 실행
    const judgeCode = `
import json
import sys
from io import StringIO

def parse_input(input_str):
    """사용자 입력을 Python 값으로 파싱"""
    input_str = input_str.strip()

    # JSON 파싱 시도
    try:
        return json.loads(input_str)
    except:
        pass

    # Python literal 평가 시도
    try:
        return eval(input_str)
    except:
        pass

    # 문자열 그대로 반환
    return input_str

def compare_results(actual, expected, config):
    """결과 비교"""
    float_epsilon = config.get('float_epsilon', 1e-9)
    list_order_matters = config.get('list_order_matters', True)
    case_sensitive = config.get('case_sensitive', True)

    # None 체크
    if actual is None and expected is None:
        return True
    if actual is None or expected is None:
        return False

    # 타입이 다르면 False
    if type(actual) != type(expected):
        # float와 int는 허용
        if not (isinstance(actual, (int, float)) and isinstance(expected, (int, float))):
            return False

    # 숫자 비교
    if isinstance(actual, (int, float)) and isinstance(expected, (int, float)):
        if float_epsilon > 0:
            return abs(actual - expected) < float_epsilon
        return actual == expected

    # 문자열 비교
    if isinstance(actual, str) and isinstance(expected, str):
        if case_sensitive:
            return actual == expected
        return actual.lower() == expected.lower()

    # 리스트 비교
    if isinstance(actual, list) and isinstance(expected, list):
        if len(actual) != len(expected):
            return False
        if not list_order_matters:
            try:
                return sorted(actual) == sorted(expected)
            except:
                pass
        return all(compare_results(a, e, config) for a, e in zip(actual, expected))

    # 딕셔너리 비교
    if isinstance(actual, dict) and isinstance(expected, dict):
        if set(actual.keys()) != set(expected.keys()):
            return False
        return all(compare_results(actual[k], expected[k], config) for k in actual.keys())

    # 그 외
    return actual == expected

# 입력 파싱
user_input_str = ${JSON.stringify(userInput)}
parsed_input = parse_input(user_input_str)

# 코드 실행을 위한 네임스페이스 설정
buggy_ns = {}
correct_ns = {}

# 버그 코드 실행
buggy_code = ${JSON.stringify(buggyCode)}
correct_code = ${JSON.stringify(correctCode)}
function_name = ${JSON.stringify(functionName)}
comparison_config = ${JSON.stringify(comparisonConfig || {})}

buggy_error = None
correct_error = None
buggy_result = None
correct_result = None

try:
    exec(buggy_code, buggy_ns)
except Exception as e:
    buggy_error = str(e)

try:
    exec(correct_code, correct_ns)
except Exception as e:
    correct_error = str(e)

# 함수 실행
if buggy_error is None:
    try:
        buggy_func = buggy_ns.get(function_name)
        if buggy_func is None:
            buggy_error = f"함수 '{function_name}'을 찾을 수 없습니다."
        else:
            if isinstance(parsed_input, (list, tuple)):
                buggy_result = buggy_func(*parsed_input)
            else:
                buggy_result = buggy_func(parsed_input)
    except Exception as e:
        buggy_error = str(e)

if correct_error is None:
    try:
        correct_func = correct_ns.get(function_name)
        if correct_func is None:
            correct_error = f"함수 '{function_name}'을 찾을 수 없습니다."
        else:
            if isinstance(parsed_input, (list, tuple)):
                correct_result = correct_func(*parsed_input)
            else:
                correct_result = correct_func(parsed_input)
    except Exception as e:
        correct_error = str(e)

# 결과 비교
results_match = False
if buggy_error is None and correct_error is None:
    results_match = compare_results(buggy_result, correct_result, comparison_config)

# 버그 발견 여부: 결과가 다르거나 버그 코드에서 에러 발생
bug_found = not results_match or (buggy_error is not None and correct_error is None)

# 결과 반환
result = {
    'parsed_input': parsed_input,
    'buggy_result': buggy_result,
    'buggy_error': buggy_error,
    'correct_result': correct_result,
    'correct_error': correct_error,
    'results_match': results_match,
    'bug_found': bug_found,
}

json.dumps(result)
`;

    const resultJson = pyodide.runPython(judgeCode);
    const resultObj = JSON.parse(resultJson);

    const executionTime = performance.now() - startTime;

    // 결과 구성
    let errorType = null;
    let errorMessage = null;
    let userFriendlyMessage = '';

    if (resultObj.buggy_error && !resultObj.correct_error) {
      errorType = 'E_BUGGY_CODE';
      errorMessage = resultObj.buggy_error;
      userFriendlyMessage = '버그 코드에서 오류가 발생했습니다!';
    } else if (resultObj.correct_error) {
      errorType = 'E_CORRECT_CODE';
      errorMessage = resultObj.correct_error;
      userFriendlyMessage = '정답 코드에서 오류가 발생했습니다.';
    } else if (resultObj.bug_found) {
      userFriendlyMessage = '버그를 찾았습니다! 입력값 ' + userInput + '에서 버그 코드와 정답 코드의 결과가 다릅니다.';
    } else {
      userFriendlyMessage = '이 입력값에서는 버그를 찾지 못했습니다. 다른 입력값을 시도해보세요.';
    }

    const judgeResult = {
      success: true,
      bugFound: resultObj.bug_found,
      userInput: userInput,
      parsedInput: resultObj.parsed_input,
      actualResult: resultObj.buggy_result,
      expectedResult: resultObj.correct_result,
      errorType: errorType,
      errorMessage: errorMessage,
      userFriendlyMessage: userFriendlyMessage,
      executionTimeMs: executionTime,
    };

    sendResult(id, true, judgeResult, executionTime);
  } catch (error) {
    const executionTime = performance.now() - startTime;
    const judgeResult = {
      success: false,
      bugFound: false,
      userInput: userInput,
      parsedInput: null,
      actualResult: null,
      expectedResult: null,
      errorType: 'E_RUNTIME',
      errorMessage: error instanceof Error ? error.message : String(error),
      userFriendlyMessage: '검증 중 오류가 발생했습니다.',
      executionTimeMs: executionTime,
    };
    sendResult(id, false, judgeResult, executionTime);
  }
}

/**
 * 파일시스템 정리
 */
function cleanup(id) {
  if (!pyodide) {
    sendResult(id, true, { cleaned: false }, 0);
    return;
  }

  try {
    const files = pyodide.FS.readdir('/home/pyodide');
    for (const file of files) {
      if (file !== '.' && file !== '..') {
        try {
          pyodide.FS.unlink('/home/pyodide/' + file);
        } catch (e) {
          // 디렉토리인 경우 무시
        }
      }
    }
    sendResult(id, true, { cleaned: true }, 0);
  } catch (e) {
    sendResult(id, true, { cleaned: false }, 0);
  }
}

// 메시지 핸들러
self.onmessage = async function(event) {
  const { type, id, payload } = event.data;

  switch (type) {
    case 'init':
      await initializePyodide(id);
      break;

    case 'runPython':
      await runPython(id, payload.code);
      break;

    case 'runPytest':
      await runPytest(id, payload.testCode, payload.targetCode);
      break;

    case 'runMutationTest':
      await runMutationTest(id, payload.testCode, payload.goldenCode, payload.buggyImplementations);
      break;

    case 'runJudge':
      await runJudge(id, payload);
      break;

    case 'cleanup':
      cleanup(id);
      break;

    default:
      sendError('Unknown message type: ' + type);
  }
};

// Worker 준비 완료 알림
self.postMessage({ type: 'ready' });
