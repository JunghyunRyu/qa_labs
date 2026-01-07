"""Docker service for managing judge containers."""

import docker
import tempfile
import os
from pathlib import Path
from typing import Optional, Dict, Any
import logging

from app.middleware.request_context import get_correlation_id

logger = logging.getLogger(__name__)


def _get_log_prefix() -> str:
    """현재 Correlation ID를 포함한 로그 접두사 반환."""
    correlation_id = get_correlation_id()
    return f"[{correlation_id}]" if correlation_id else ""

# Judge Docker 이미지 이름
JUDGE_IMAGE = "qa-arena-judge:latest"
# 작업 디렉토리 (컨테이너 내부)
WORKDIR = "/workdir"
# 타임아웃 (초)
DEFAULT_TIMEOUT = 5

# Docker 연결 재시도 설정
DOCKER_CONNECT_MAX_RETRIES = 3
DOCKER_CONNECT_INITIAL_DELAY = 1.0  # 초
DOCKER_CONNECT_BACKOFF_MULTIPLIER = 2.0


class DockerService:
    """Docker 컨테이너 관리를 위한 서비스 클래스."""

    def __init__(self):
        """Docker 클라이언트 초기화 (재시도 로직 포함)."""
        import platform
        import time

        is_in_container = os.path.exists("/.dockerenv") or os.environ.get("DOCKER_CONTAINER") == "true"
        docker_host = os.environ.get("DOCKER_HOST")
        platform_system = platform.system()

        logger.info(
            f"[DOCKER_INIT_START] is_in_container={is_in_container} "
            f"platform={platform_system} docker_host={docker_host}"
        )

        last_error = None
        self._connection_method = "unknown"

        for attempt in range(1, DOCKER_CONNECT_MAX_RETRIES + 1):
            try:
                self.client = self._create_docker_client(
                    is_in_container=is_in_container,
                    docker_host=docker_host,
                    platform_system=platform_system,
                )
                # 연결 확인
                self.client.ping()
                logger.info(
                    f"[DOCKER_INIT_SUCCESS] attempt={attempt}/{DOCKER_CONNECT_MAX_RETRIES} "
                    f"method={self._connection_method}"
                )
                return

            except Exception as e:
                last_error = e
                delay = DOCKER_CONNECT_INITIAL_DELAY * (DOCKER_CONNECT_BACKOFF_MULTIPLIER ** (attempt - 1))

                logger.warning(
                    f"[DOCKER_INIT_RETRY] attempt={attempt}/{DOCKER_CONNECT_MAX_RETRIES} "
                    f"method={self._connection_method} "
                    f"error_type={type(e).__name__} error={str(e)} "
                    f"next_retry_in={delay:.1f}s"
                )

                if attempt < DOCKER_CONNECT_MAX_RETRIES:
                    time.sleep(delay)

        # 모든 재시도 실패
        error_msg = (
            f"[DOCKER_INIT_FAILED] Docker 클라이언트 초기화 실패 "
            f"after {DOCKER_CONNECT_MAX_RETRIES} attempts. "
            f"is_in_container={is_in_container}, docker_host={docker_host}, "
            f"last_error={type(last_error).__name__}: {str(last_error)}"
        )
        logger.error(error_msg)
        raise RuntimeError(f"Docker 클라이언트를 초기화할 수 없습니다: {str(last_error)}") from last_error

    def _create_docker_client(
        self,
        is_in_container: bool,
        docker_host: Optional[str],
        platform_system: str,
    ) -> docker.DockerClient:
        """
        Docker 클라이언트 생성.

        우선순위:
        1. DOCKER_HOST 환경변수가 TCP로 설정된 경우 (docker-socket-proxy)
        2. Windows named pipe (Windows 호스트)
        3. Unix socket (컨테이너 내부, 소켓 존재 시)
        4. from_env 폴백
        """
        # 1. DOCKER_HOST가 TCP로 설정된 경우 (docker-socket-proxy 사용)
        if docker_host and docker_host.startswith("tcp://"):
            self._connection_method = f"tcp ({docker_host})"
            return docker.DockerClient(base_url=docker_host)

        # 2. Windows 호스트에서 실행 중인 경우
        if platform_system == "Windows" and not is_in_container:
            self._connection_method = "windows_named_pipe"
            try:
                return docker.DockerClient(base_url="npipe:////./pipe/docker_engine")
            except Exception:
                # Windows에서 named pipe 실패 시 from_env 폴백
                self._connection_method = "from_env (windows fallback)"
                return docker.from_env()

        # 3. 컨테이너 내부에서 Unix socket 사용 가능한 경우
        if is_in_container and os.path.exists("/var/run/docker.sock"):
            self._connection_method = "unix_socket"
            return docker.DockerClient(base_url="unix:///var/run/docker.sock")

        # 4. from_env 폴백 (DOCKER_HOST 환경변수 존중)
        self._connection_method = "from_env"
        return docker.from_env()

    def create_container(
        self,
        target_code: str,
        test_code: str,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> tuple[docker.models.containers.Container, Path]:
        """
        Docker 컨테이너를 생성하고 파일을 마운트합니다.

        Args:
            target_code: 테스트 대상 코드 (target.py)
            test_code: 사용자가 작성한 테스트 코드 (test_user.py)
            timeout: 실행 타임아웃 (초)

        Returns:
            (생성된 Docker 컨테이너 객체, 임시 디렉토리 경로) 튜플
        """
        # 임시 디렉토리 생성
        # Docker-in-Docker 환경을 위해 호스트와 공유되는 경로 사용
        temp_dir = tempfile.mkdtemp(prefix="qa_arena_judge_", dir="/tmp/qa_arena_judge")
        temp_path = Path(temp_dir)

        try:
            # 파일 작성
            (temp_path / "target.py").write_text(target_code, encoding="utf-8")
            (temp_path / "test_user.py").write_text(test_code, encoding="utf-8")

            # conftest.py 복사 (judge 디렉토리에서)
            # backend/app/services/docker_service.py -> backend -> qa_labs -> judge
            backend_dir = Path(__file__).parent.parent.parent
            project_root = backend_dir.parent
            judge_dir = project_root / "judge"
            conftest_path = judge_dir / "conftest.py"
            if conftest_path.exists():
                (temp_path / "conftest.py").write_text(
                    conftest_path.read_text(encoding="utf-8"), encoding="utf-8"
                )

            # 볼륨 마운트 설정
            volumes = {
                str(temp_path): {"bind": WORKDIR, "mode": "ro"},
            }

            # 컨테이너 생성
            container = self.client.containers.create(
                image=JUDGE_IMAGE,
                command=["pytest", "-q", "--disable-warnings", "--maxfail=1", "--ignore=target.py", "test_user.py"],
                volumes=volumes,
                network_disabled=True,  # 네트워크 비활성화 (보안)
                mem_limit="128m",  # 메모리 제한
                cpu_period=100000,
                cpu_quota=50000,  # CPU 제한 (50%)
                working_dir=WORKDIR,
                detach=True,
            )

            prefix = _get_log_prefix()
            logger.info(
                f"{prefix} [JUDGE_CREATED] container_id={container.id[:12]} "
                f"image={JUDGE_IMAGE} temp_dir={temp_path}"
            )
            return container, temp_path

        except Exception as e:
            # 에러 발생 시 임시 디렉토리 정리
            self._cleanup_temp_dir(temp_path)
            prefix = _get_log_prefix()
            logger.error(
                f"{prefix} [JUDGE_CREATE_ERROR] image={JUDGE_IMAGE} "
                f"error_type={type(e).__name__} error={str(e)}"
            )
            raise RuntimeError(
                f"Judge 컨테이너를 생성할 수 없습니다. "
                f"이미지 '{JUDGE_IMAGE}'가 존재하는지 확인하세요: {str(e)}"
            ) from e

    def run_container(
        self,
        container: docker.models.containers.Container,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> Dict[str, Any]:
        """
        컨테이너를 실행하고 결과를 수집합니다.

        Args:
            container: 실행할 컨테이너 객체
            timeout: 실행 타임아웃 (초)

        Returns:
            실행 결과 딕셔너리:
            {
                "success": bool,
                "exit_code": int,
                "stdout": str,
                "stderr": str,
                "execution_time": float,
                "logs": str
            }
        """
        import time

        start_time = time.time()
        prefix = _get_log_prefix()
        container_id = container.id[:12]

        try:
            # 컨테이너 시작
            logger.info(f"{prefix} [JUDGE_START] container_id={container_id} timeout={timeout}s")
            container.start()

            # 타임아웃까지 대기
            try:
                result = container.wait(timeout=timeout)
                exit_code = result.get("StatusCode", -1)
            except Exception as e:
                # 타임아웃 발생
                logger.warning(
                    f"{prefix} [JUDGE_TIMEOUT] container_id={container_id} "
                    f"timeout={timeout}s error_type={type(e).__name__}"
                )
                try:
                    container.kill()
                    logger.info(f"{prefix} [JUDGE_KILLED] container_id={container_id} reason=timeout")
                except Exception as kill_error:
                    logger.error(
                        f"{prefix} [JUDGE_KILL_ERROR] container_id={container_id} "
                        f"error={kill_error}"
                    )
                exit_code = -1

            execution_time = time.time() - start_time

            # 로그 수집
            logs = container.logs(stdout=True, stderr=True).decode("utf-8", errors="replace")

            # stdout/stderr 분리 (pytest는 stdout에 출력)
            stdout = logs
            stderr = ""

            # 성공 여부 판단 (exit_code 0이면 성공)
            success = exit_code == 0

            result = {
                "success": success,
                "exit_code": exit_code,
                "stdout": stdout,
                "stderr": stderr,
                "execution_time": execution_time,
                "logs": logs,
            }

            logger.info(
                f"{prefix} [JUDGE_COMPLETE] container_id={container_id} "
                f"success={success} exit_code={exit_code} time={execution_time:.2f}s"
            )

            return result

        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                f"{prefix} [JUDGE_ERROR] container_id={container_id} "
                f"error_type={type(e).__name__} error={str(e)} time={execution_time:.2f}s",
                exc_info=True
            )
            return {
                "success": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": f"컨테이너 실행 실패: {type(e).__name__}: {str(e)}",
                "execution_time": execution_time,
                "logs": "",
            }

        finally:
            # 컨테이너 정리
            self.cleanup_container(container)

    def cleanup_container(self, container: docker.models.containers.Container):
        """
        컨테이너를 정리합니다.

        Args:
            container: 정리할 컨테이너 객체
        """
        try:
            if container:
                # 컨테이너 중지 (실행 중인 경우)
                try:
                    container.stop(timeout=1)
                except:
                    pass

                # 컨테이너 제거
                try:
                    container.remove()
                except:
                    pass

                logger.debug(f"컨테이너 정리 완료: {container.id}")

        except Exception as e:
            logger.warning(
                f"컨테이너 정리 중 에러 발생: 컨테이너 ID={container.id[:12] if container else 'None'}, "
                f"에러 타입={type(e).__name__}, 에러 메시지={str(e)}"
            )

    def _cleanup_temp_dir(self, temp_path: Path):
        """임시 디렉토리를 정리합니다."""
        try:
            import shutil

            if temp_path.exists():
                shutil.rmtree(temp_path)
                logger.debug(f"임시 디렉토리 정리 완료: {temp_path}")
        except Exception as e:
            logger.warning(
                f"임시 디렉토리 정리 중 에러 발생: 경로={temp_path}, "
                f"에러 타입={type(e).__name__}, 에러 메시지={str(e)}"
            )

    def run_pytest(
        self,
        target_code: str,
        test_code: str,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> Dict[str, Any]:
        """
        pytest를 Docker 컨테이너에서 실행하는 통합 함수.

        Args:
            target_code: 테스트 대상 코드
            test_code: 사용자가 작성한 테스트 코드
            timeout: 실행 타임아웃 (초)

        Returns:
            실행 결과 딕셔너리
        """
        container = None
        temp_path = None

        try:
            # 컨테이너 생성 (임시 디렉토리도 함께 생성됨)
            container, temp_path = self.create_container(target_code, test_code, timeout)

            # 컨테이너 실행
            result = self.run_container(container, timeout)

            return result

        except Exception as e:
            error_msg = (
                f"pytest 실행 실패: {type(e).__name__}: {str(e)}. "
                f"타임아웃: {timeout}초"
            )
            logger.error(error_msg, exc_info=True)
            return {
                "success": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": f"pytest 실행 중 오류 발생: {type(e).__name__}: {str(e)}",
                "execution_time": 0.0,
                "logs": "",
            }

        finally:
            # 임시 디렉토리 정리
            if temp_path and temp_path.exists():
                self._cleanup_temp_dir(temp_path)

