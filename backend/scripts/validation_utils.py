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
