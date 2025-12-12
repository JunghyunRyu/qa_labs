"""공통 유틸리티 모듈 for problem validation."""

import json
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from contextlib import contextmanager

# Constants
DEFAULT_TIMEOUT = 5
SHARED_VOLUME_PATH = "/tmp/qa_arena_judge"
SCRIPT_DIR = Path(__file__).parent
PROBLEMS_DIR = SCRIPT_DIR.parent / "generated_problems"
CONFTEST_PATH = SCRIPT_DIR.parent.parent / "judge" / "conftest.py"
RESULTS_DIR = SCRIPT_DIR.parent / "results"


class ProblemLoader:
    """문제 JSON 파일을 로드하고 검증하는 클래스."""

    REQUIRED_FIELDS = [
        "function_signature",
        "golden_code",
        "buggy_implementations",
        "description_md",
        "initial_test_template",
        "tags",
        "difficulty",
    ]

    @staticmethod
    def load_problem(problem_path: Path) -> Dict[str, Any]:
        """
        단일 문제 파일을 로드합니다.

        Args:
            problem_path: 문제 JSON 파일 경로

        Returns:
            문제 데이터 딕셔너리

        Raises:
            FileNotFoundError: 파일이 존재하지 않을 때
            json.JSONDecodeError: JSON 파싱 실패 시
            ValueError: 필수 필드 누락 시
        """
        if not problem_path.exists():
            raise FileNotFoundError(f"Problem file not found: {problem_path}")

        with open(problem_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 필수 필드 검증
        missing_fields = [
            field for field in ProblemLoader.REQUIRED_FIELDS
            if field not in data
        ]

        if missing_fields:
            raise ValueError(
                f"Missing required fields in {problem_path.name}: "
                f"{', '.join(missing_fields)}"
            )

        # problem_id 추가 (파일명 기반)
        data["problem_id"] = problem_path.stem

        return data

    @staticmethod
    def load_all_problems(
        problems_dir: Optional[Path] = None,
        filter_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        디렉토리의 모든 문제를 로드합니다.

        Args:
            problems_dir: 문제 디렉토리 경로 (기본값: PROBLEMS_DIR)
            filter_ids: 특정 문제 ID만 로드 (예: ['E01', 'M01'])

        Returns:
            문제 리스트 (problem_id 순으로 정렬)
        """
        if problems_dir is None:
            problems_dir = PROBLEMS_DIR

        if not problems_dir.exists():
            raise FileNotFoundError(f"Problems directory not found: {problems_dir}")

        # JSON 파일 목록
        json_files = sorted(problems_dir.glob("*.json"))

        # 필터링
        if filter_ids:
            json_files = [
                f for f in json_files
                if f.stem in filter_ids
            ]

        # 로드
        problems = []
        for json_file in json_files:
            try:
                problem = ProblemLoader.load_problem(json_file)
                problems.append(problem)
            except Exception as e:
                print(f"[WARNING] Failed to load {json_file.name}: {e}")

        return problems


@contextmanager
def TestEnvironment(
    golden_code: str,
    test_code: str,
    conftest_code: Optional[str] = None,
):
    """
    테스트 환경을 생성하는 Context Manager.

    임시 디렉토리를 생성하고 target.py, test_user.py, conftest.py를 작성합니다.
    with 블록 종료 시 자동으로 정리됩니다.

    Args:
        golden_code: Golden code (target.py)
        test_code: Test code (test_user.py)
        conftest_code: conftest.py 내용 (None이면 judge/conftest.py 복사)

    Yields:
        임시 디렉토리 Path 객체

    Example:
        ```python
        with TestEnvironment(golden, test) as temp_dir:
            result = run_pytest(temp_dir)
        # 자동으로 temp_dir 삭제됨
        ```
    """
    temp_dir = None
    try:
        # 임시 디렉토리 생성
        temp_dir = Path(tempfile.mkdtemp(prefix="qa_test_"))

        # target.py 작성
        target_file = temp_dir / "target.py"
        target_file.write_text(golden_code, encoding="utf-8")

        # test_user.py 작성
        test_file = temp_dir / "test_user.py"
        test_file.write_text(test_code, encoding="utf-8")

        # conftest.py 작성
        if conftest_code is None:
            # judge/conftest.py 복사
            if CONFTEST_PATH.exists():
                conftest_code = CONFTEST_PATH.read_text(encoding="utf-8")
            else:
                # conftest.py가 없으면 기본 보안 설정 사용
                conftest_code = """
# Security restrictions
collect_ignore = ["target.py"]

BLOCKED_MODULES = ['os', 'sys', 'subprocess', 'socket', 'shutil']

def pytest_runtest_setup(item):
    import builtins
    if not hasattr(builtins, '_original_import'):
        builtins._original_import = builtins.__import__

    def _blocked_import(name, *args, **kwargs):
        if name.split('.')[0] in BLOCKED_MODULES:
            raise ImportError(f"Import of '{name}' is not allowed")
        return builtins._original_import(name, *args, **kwargs)

    builtins.__import__ = _blocked_import

def pytest_runtest_teardown(item):
    import builtins
    if hasattr(builtins, '_original_import'):
        builtins.__import__ = builtins._original_import
"""

        conftest_file = temp_dir / "conftest.py"
        conftest_file.write_text(conftest_code, encoding="utf-8")

        yield temp_dir

    finally:
        # 정리
        if temp_dir and temp_dir.exists():
            shutil.rmtree(temp_dir, ignore_errors=True)


class ResultCollector:
    """검증 결과를 수집하고 저장하는 클래스."""

    def __init__(self, environment: str = "local"):
        """
        ResultCollector 초기화.

        Args:
            environment: 실행 환경 ("local" 또는 "judge")
        """
        self.environment = environment
        self.timestamp = datetime.now().isoformat()
        self.problems: List[Dict[str, Any]] = []

    def add_result(self, problem_result: Dict[str, Any]) -> None:
        """
        문제 검증 결과를 추가합니다.

        Args:
            problem_result: 문제 검증 결과 딕셔너리
        """
        self.problems.append(problem_result)

    def get_all_results(self) -> Dict[str, Any]:
        """
        전체 결과를 반환합니다.

        Returns:
            전체 결과 딕셔너리
        """
        passed = sum(1 for p in self.problems if p.get("status") == "PASS")
        failed = sum(1 for p in self.problems if p.get("status") == "FAIL")

        return {
            "timestamp": self.timestamp,
            "environment": self.environment,
            "total_problems": len(self.problems),
            "passed": passed,
            "failed": failed,
            "problems": self.problems,
        }

    def save_to_json(self, output_path: Optional[Path] = None) -> Path:
        """
        결과를 JSON 파일로 저장합니다.

        Args:
            output_path: 저장할 파일 경로 (None이면 자동 생성)

        Returns:
            저장된 파일 경로
        """
        if output_path is None:
            # 자동 파일명 생성
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{self.environment}_validation_{timestamp_str}.json"
            output_path = RESULTS_DIR / filename

        # results 디렉토리 생성
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # JSON 저장
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(self.get_all_results(), f, indent=2, ensure_ascii=False)

        return output_path


class ProgressReporter:
    """진행률을 표시하는 클래스 (tqdm 래퍼)."""

    def __init__(self, total: int, desc: str = "Processing"):
        """
        ProgressReporter 초기화.

        Args:
            total: 전체 작업 수
            desc: 진행률 바 설명
        """
        self.total = total
        self.desc = desc
        self.current = 0

        try:
            from tqdm import tqdm
            self.pbar = tqdm(total=total, desc=desc, unit="problem")
            self.use_tqdm = True
        except ImportError:
            self.pbar = None
            self.use_tqdm = False
            print(f"{desc}: 0/{total}")

    def update(self, n: int = 1, message: str = "") -> None:
        """
        진행률을 업데이트합니다.

        Args:
            n: 진행 단위 (기본값: 1)
            message: 추가 메시지
        """
        self.current += n

        if self.use_tqdm and self.pbar:
            if message:
                self.pbar.set_postfix_str(message)
            self.pbar.update(n)
        else:
            status = f"{self.desc}: {self.current}/{self.total}"
            if message:
                status += f" - {message}"
            print(status)

    def close(self) -> None:
        """진행률 바를 닫습니다."""
        if self.use_tqdm and self.pbar:
            self.pbar.close()
        else:
            print(f"{self.desc}: Complete")

    def __enter__(self):
        """Context manager enter."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


def ensure_results_dir() -> Path:
    """
    results 디렉토리가 존재하는지 확인하고, 없으면 생성합니다.

    Returns:
        results 디렉토리 Path
    """
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    return RESULTS_DIR


# =============================================================================
# E2E Submission Testing Utilities
# =============================================================================

import time
import requests


class SubmissionClient:
    """API를 통한 제출 클라이언트 (로컬 또는 원격)."""

    def __init__(self, base_url: str = "https://qa-arena.qalabs.kr/api/v1"):
        """
        SubmissionClient 초기화.

        Args:
            base_url: API 베이스 URL (예: https://qa-arena.qalabs.kr/api/v1)
        """
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
        })
        # 네트워크 지연 고려한 타임아웃 설정
        self.request_timeout = 30

    def health_check(self) -> bool:
        """
        서버 헬스체크를 수행합니다.

        Returns:
            서버가 정상이면 True, 아니면 False
        """
        try:
            # /api/v1 앞의 base URL에서 /healthz 호출
            health_url = self.base_url.replace("/api/v1", "") + "/healthz"
            resp = self.session.get(health_url, timeout=10)
            return resp.status_code == 200
        except Exception as e:
            print(f"[ERROR] Health check failed: {e}")
            return False

    def get_problem_id_by_title(self, title: str) -> Optional[int]:
        """
        문제 제목으로 problem_id를 조회합니다.

        Args:
            title: 문제 제목

        Returns:
            problem_id (int) 또는 None
        """
        try:
            resp = self.session.get(
                f"{self.base_url}/problems",
                timeout=self.request_timeout,
            )
            resp.raise_for_status()
            data = resp.json()

            # API 응답이 {"problems": [...]} 형식인 경우 처리
            if isinstance(data, dict) and "problems" in data:
                problems = data["problems"]
            elif isinstance(data, list):
                problems = data
            else:
                print(f"[WARNING] Unexpected API response format: {type(data)}")
                return None

            for problem in problems:
                if problem.get("title") == title:
                    return problem.get("id")

            return None
        except Exception as e:
            print(f"[ERROR] Failed to get problem ID: {e}")
            return None

    def submit(self, problem_id: int, code: str) -> Dict[str, Any]:
        """
        제출을 생성합니다.

        Args:
            problem_id: 문제 ID (DB ID)
            code: 테스트 코드

        Returns:
            제출 응답 딕셔너리 (id, status 등)
        """
        try:
            resp = self.session.post(
                f"{self.base_url}/submissions",
                json={
                    "problem_id": problem_id,
                    "code": code,
                },
                timeout=self.request_timeout,
            )
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.HTTPError as e:
            return {"error": f"HTTP Error: {e.response.status_code}", "detail": str(e)}
        except Exception as e:
            return {"error": str(e)}

    def get_result(
        self,
        submission_id: str,
        timeout: int = 120,
        poll_interval: int = 3,
    ) -> Dict[str, Any]:
        """
        제출 결과를 폴링합니다.

        상태가 PENDING/RUNNING이 아닐 때까지 대기합니다.

        Args:
            submission_id: 제출 ID
            timeout: 최대 대기 시간 (초)
            poll_interval: 폴링 간격 (초)

        Returns:
            최종 제출 결과 딕셔너리
        """
        start_time = time.time()
        final_statuses = {"SUCCESS", "FAILURE", "ERROR"}

        while time.time() - start_time < timeout:
            try:
                resp = self.session.get(
                    f"{self.base_url}/submissions/{submission_id}",
                    timeout=self.request_timeout,
                )
                resp.raise_for_status()
                result = resp.json()

                status = result.get("status", "UNKNOWN")
                if status in final_statuses:
                    return result

                # 아직 처리 중이면 대기
                time.sleep(poll_interval)

            except Exception as e:
                return {"error": str(e), "status": "ERROR"}

        # 타임아웃
        return {
            "error": f"Polling timeout after {timeout}s",
            "status": "TIMEOUT",
        }


class E2EResultCollector(ResultCollector):
    """End-to-End 테스트 결과 수집기."""

    def __init__(self, api_url: str = "https://qa-arena.qalabs.kr/api/v1"):
        """
        E2EResultCollector 초기화.

        Args:
            api_url: API 베이스 URL
        """
        super().__init__(environment="e2e")
        self.api_url = api_url
        self.scenarios: List[Dict[str, Any]] = []
        self.summary = {
            "total_scenarios": 0,
            "passed": 0,
            "failed": 0,
            "by_scenario_type": {},
            "by_problem": {},
        }

    def add_scenario_result(
        self,
        problem_id: str,
        scenario_name: str,
        test_code: str,
        submission_result: Dict[str, Any],
        expected: Dict[str, Any],
        passed: bool,
        execution_time: float,
    ) -> None:
        """
        시나리오 결과를 추가합니다.

        Args:
            problem_id: 문제 ID (예: "E01")
            scenario_name: 시나리오 이름 (예: "strong", "weak", "syntax_error")
            test_code: 제출한 테스트 코드
            submission_result: API에서 받은 제출 결과
            expected: 예상 결과 딕셔너리
            passed: 테스트 통과 여부
            execution_time: 실행 시간 (초)
        """
        scenario_result = {
            "problem_id": problem_id,
            "scenario": scenario_name,
            "passed": passed,
            "execution_time": round(execution_time, 2),
            "expected": expected,
            "actual": {
                "status": submission_result.get("status"),
                "score": submission_result.get("score"),
                "killed_mutants": submission_result.get("killed_mutants"),
                "total_mutants": submission_result.get("total_mutants"),
            },
            "submission_id": submission_result.get("id"),
        }

        # 실패 시 추가 정보
        if not passed:
            scenario_result["error_detail"] = submission_result.get("execution_log")

        self.scenarios.append(scenario_result)

        # Summary 업데이트
        self.summary["total_scenarios"] += 1
        if passed:
            self.summary["passed"] += 1
        else:
            self.summary["failed"] += 1

        # 시나리오 타입별 통계
        if scenario_name not in self.summary["by_scenario_type"]:
            self.summary["by_scenario_type"][scenario_name] = {"passed": 0, "failed": 0}
        if passed:
            self.summary["by_scenario_type"][scenario_name]["passed"] += 1
        else:
            self.summary["by_scenario_type"][scenario_name]["failed"] += 1

        # 문제별 통계
        if problem_id not in self.summary["by_problem"]:
            self.summary["by_problem"][problem_id] = {"passed": 0, "failed": 0}
        if passed:
            self.summary["by_problem"][problem_id]["passed"] += 1
        else:
            self.summary["by_problem"][problem_id]["failed"] += 1

    def get_all_results(self) -> Dict[str, Any]:
        """전체 E2E 테스트 결과를 반환합니다."""
        return {
            "timestamp": self.timestamp,
            "environment": self.environment,
            "api_url": self.api_url,
            "summary": self.summary,
            "scenarios": self.scenarios,
        }

    def save_to_json(self, output_path: Optional[Path] = None) -> Path:
        """결과를 JSON 파일로 저장합니다."""
        if output_path is None:
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"e2e_validation_{timestamp_str}.json"
            output_path = RESULTS_DIR / filename

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(self.get_all_results(), f, indent=2, ensure_ascii=False)

        return output_path


def generate_error_test_code(error_type: str) -> str:
    """
    에러를 발생시키는 테스트 코드를 생성합니다.

    Args:
        error_type: "syntax_error" 또는 "import_error"

    Returns:
        에러가 포함된 테스트 코드 문자열
    """
    if error_type == "syntax_error":
        return '''import pytest

def test_broken(:
    # syntax error - missing closing parenthesis
    pass
'''
    elif error_type == "import_error":
        return '''import pytest
from target import non_existent_function_xyz123

def test_import():
    non_existent_function_xyz123()
'''
    else:
        raise ValueError(f"Unknown error_type: {error_type}")
