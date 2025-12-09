"""Docker service for managing judge containers."""

import docker
import tempfile
import os
from pathlib import Path
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Judge Docker 이미지 이름
JUDGE_IMAGE = "qa-arena-judge:latest"
# 작업 디렉토리 (컨테이너 내부)
WORKDIR = "/workdir"
# 타임아웃 (초)
DEFAULT_TIMEOUT = 5


class DockerService:
    """Docker 컨테이너 관리를 위한 서비스 클래스."""

    def __init__(self):
        """Docker 클라이언트 초기화."""
        try:
            import platform
            import os
            
            # 컨테이너 내부에서 실행 중인지 확인
            is_in_container = os.path.exists("/.dockerenv") or os.environ.get("DOCKER_CONTAINER") == "true"
            
            # DOCKER_HOST 환경변수 확인
            docker_host = os.environ.get("DOCKER_HOST")
            
            # Windows 환경에서 호스트에서 실행 중인 경우
            if platform.system() == "Windows" and not is_in_container:
                # Windows 호스트에서는 named pipe 사용
                try:
                    self.client = docker.DockerClient(base_url="npipe:////./pipe/docker_engine")
                    self.client.ping()
                    logger.info("Docker 클라이언트 초기화 성공 (Windows named pipe)")
                except Exception:
                    # 실패 시 기본값 사용
                    self.client = docker.from_env()
                    logger.info("Docker 클라이언트 초기화 성공 (from_env)")
            # 컨테이너 내부에서 실행 중인 경우
            elif is_in_container:
                # 컨테이너 내부에서는 Docker 소켓 사용
                # Windows Docker Desktop에서는 DOCKER_HOST가 잘못 설정될 수 있으므로 정리
                original_docker_host = os.environ.pop("DOCKER_HOST", None)
                original_docker_tls = os.environ.pop("DOCKER_TLS_VERIFY", None)
                original_docker_cert = os.environ.pop("DOCKER_CERT_PATH", None)
                
                try:
                    # 먼저 Unix 소켓 시도
                    try:
                        self.client = docker.DockerClient(base_url="unix:///var/run/docker.sock")
                        self.client.ping()
                        logger.info("Docker 클라이언트 초기화 성공 (Unix socket)")
                    except Exception as e:
                        # Unix 소켓 실패 시 환경변수 없이 from_env 시도
                        logger.warning(f"Unix socket 연결 실패: {e}, from_env 시도")
                        self.client = docker.from_env()
                        self.client.ping()
                        logger.info("Docker 클라이언트 초기화 성공 (from_env)")
                finally:
                    # 원래 환경변수 복원 (다른 프로세스에 영향 주지 않도록)
                    if original_docker_host:
                        os.environ["DOCKER_HOST"] = original_docker_host
                    if original_docker_tls:
                        os.environ["DOCKER_TLS_VERIFY"] = original_docker_tls
                    if original_docker_cert:
                        os.environ["DOCKER_CERT_PATH"] = original_docker_cert
            # Linux/Mac 호스트에서 실행 중인 경우
            else:
                self.client = docker.from_env()
                logger.info("Docker 클라이언트 초기화 성공 (from_env)")
                
        except Exception as e:
            error_msg = (
                f"Docker 클라이언트 초기화 실패: {type(e).__name__}: {str(e)}. "
                f"환경: Windows={platform.system() == 'Windows'}, "
                f"컨테이너 내부={is_in_container}, "
                f"DOCKER_HOST={docker_host or 'None'}"
            )
            logger.error(error_msg)
            raise RuntimeError(f"Docker 클라이언트를 초기화할 수 없습니다: {str(e)}") from e

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
        temp_dir = tempfile.mkdtemp(prefix="qa_arena_judge_")
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

            logger.info(f"컨테이너 생성 완료: {container.id}")
            return container, temp_path

        except Exception as e:
            # 에러 발생 시 임시 디렉토리 정리
            self._cleanup_temp_dir(temp_path)
            error_msg = (
                f"Judge 컨테이너 생성 실패: {type(e).__name__}: {str(e)}. "
                f"이미지: {JUDGE_IMAGE}, 타임아웃: {timeout}초"
            )
            logger.error(error_msg)
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

        try:
            # 컨테이너 시작
            container.start()

            # 타임아웃까지 대기
            try:
                result = container.wait(timeout=timeout)
                exit_code = result.get("StatusCode", -1)
            except Exception as e:
                # 타임아웃 발생
                timeout_msg = (
                    f"Judge 컨테이너 실행 타임아웃: 컨테이너 ID={container.id[:12]}, "
                    f"타임아웃={timeout}초, 에러={type(e).__name__}: {str(e)}"
                )
                logger.warning(timeout_msg)
                try:
                    container.kill()
                    logger.info(f"타임아웃으로 인해 컨테이너 강제 종료: {container.id[:12]}")
                except Exception as kill_error:
                    logger.error(f"컨테이너 강제 종료 실패: {container.id[:12]}, 에러: {kill_error}")
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
                f"컨테이너 실행 완료: {container.id}, "
                f"성공: {success}, 시간: {execution_time:.2f}초"
            )

            return result

        except Exception as e:
            execution_time = time.time() - start_time
            error_msg = (
                f"Judge 컨테이너 실행 중 예외 발생: 컨테이너 ID={container.id[:12]}, "
                f"에러 타입={type(e).__name__}, 에러 메시지={str(e)}, "
                f"실행 시간={execution_time:.2f}초"
            )
            logger.error(error_msg, exc_info=True)
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

