"""Judge service for running pytest tests in Docker containers."""

from typing import Dict, Any, Optional
import logging

from app.services.docker_service import DockerService, DEFAULT_TIMEOUT

logger = logging.getLogger(__name__)


class JudgeService:
    """채점을 위한 Judge 서비스 클래스."""

    def __init__(self, timeout: int = DEFAULT_TIMEOUT):
        """
        JudgeService 초기화.

        Args:
            timeout: pytest 실행 타임아웃 (초)
        """
        self.docker_service = DockerService()
        self.timeout = timeout

    def run_pytest(
        self,
        target_code: str,
        user_test_code: str,
        timeout: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        pytest를 실행하고 결과를 반환합니다.

        Args:
            target_code: 테스트 대상 코드 (golden_code 또는 buggy_code)
            user_test_code: 사용자가 작성한 테스트 코드
            timeout: 실행 타임아웃 (초). None이면 기본값 사용

        Returns:
            실행 결과 딕셔너리:
            {
                "success": bool,  # 모든 테스트 통과 여부
                "exit_code": int,
                "stdout": str,
                "stderr": str,
                "execution_time": float,
                "logs": str,
                "all_tests_passed": bool,  # pytest 결과 기반
                "any_test_failed": bool,  # pytest 결과 기반
            }
        """
        if timeout is None:
            timeout = self.timeout

        try:
            # Docker 컨테이너에서 pytest 실행
            result = self.docker_service.run_pytest(
                target_code=target_code,
                test_code=user_test_code,
                timeout=timeout,
            )

            # pytest 결과 파싱
            all_tests_passed = result["success"] and result["exit_code"] == 0
            any_test_failed = not all_tests_passed and result["exit_code"] != -1

            # 결과에 추가 정보 포함
            result["all_tests_passed"] = all_tests_passed
            result["any_test_failed"] = any_test_failed

            logger.info(
                f"pytest 실행 완료: 성공={all_tests_passed}, "
                f"시간={result['execution_time']:.2f}초"
            )

            return result

        except Exception as e:
            logger.error(f"pytest 실행 중 에러 발생: {e}")
            return {
                "success": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": str(e),
                "execution_time": 0.0,
                "logs": "",
                "all_tests_passed": False,
                "any_test_failed": False,
            }

    def test_golden_code(
        self,
        golden_code: str,
        user_test_code: str,
    ) -> Dict[str, Any]:
        """
        Golden Code에 대해 테스트를 실행합니다.

        Args:
            golden_code: 정답 구현 코드
            user_test_code: 사용자가 작성한 테스트 코드

        Returns:
            실행 결과 딕셔너리
        """
        logger.info("Golden Code 테스트 실행 시작")
        return self.run_pytest(
            target_code=golden_code,
            user_test_code=user_test_code,
        )

    def test_buggy_code(
        self,
        buggy_code: str,
        user_test_code: str,
    ) -> Dict[str, Any]:
        """
        Buggy Code에 대해 테스트를 실행합니다.

        Args:
            buggy_code: 버그가 있는 구현 코드
            user_test_code: 사용자가 작성한 테스트 코드

        Returns:
            실행 결과 딕셔너리
        """
        logger.info("Buggy Code 테스트 실행 시작")
        return self.run_pytest(
            target_code=buggy_code,
            user_test_code=user_test_code,
        )

