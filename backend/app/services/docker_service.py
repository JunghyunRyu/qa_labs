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
            # Windows 환경에서 환경변수 문제 해결
            import platform
            import os
            
            if platform.system() == "Windows":
                # Windows에서는 DOCKER_HOST 환경변수를 제거하고 기본값 사용
                original_docker_host = os.environ.pop("DOCKER_HOST", None)
                original_docker_tls = os.environ.pop("DOCKER_TLS_VERIFY", None)
                original_docker_cert = os.environ.pop("DOCKER_CERT_PATH", None)
                
                try:
                    # Windows에서는 named pipe를 명시적으로 사용
                    try:
                        self.client = docker.DockerClient(base_url="npipe:////./pipe/docker_engine")
                        # 연결 테스트
                        self.client.ping()
                    except Exception:
                        # named pipe 실패 시 기본값 사용
                        self.client = docker.from_env()
                finally:
                    # 원래 값 복원 (다른 프로세스에 영향 주지 않도록)
                    if original_docker_host:
                        os.environ["DOCKER_HOST"] = original_docker_host
                    if original_docker_tls:
                        os.environ["DOCKER_TLS_VERIFY"] = original_docker_tls
                    if original_docker_cert:
                        os.environ["DOCKER_CERT_PATH"] = original_docker_cert
            else:
                self.client = docker.from_env()
        except Exception as e:
            logger.error(f"Docker 클라이언트 초기화 실패: {e}")
            raise

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
                command=["pytest", "-q", "--disable-warnings", "--maxfail=1", "test_user.py"],
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
            logger.error(f"컨테이너 생성 실패: {e}")
            raise

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
                logger.warning(f"컨테이너 실행 타임아웃: {container.id}")
                container.kill()
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
            logger.error(f"컨테이너 실행 실패: {container.id}, 에러: {e}")
            return {
                "success": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": str(e),
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
            logger.warning(f"컨테이너 정리 중 에러: {e}")

    def _cleanup_temp_dir(self, temp_path: Path):
        """임시 디렉토리를 정리합니다."""
        try:
            import shutil

            if temp_path.exists():
                shutil.rmtree(temp_path)
                logger.debug(f"임시 디렉토리 정리 완료: {temp_path}")
        except Exception as e:
            logger.warning(f"임시 디렉토리 정리 중 에러: {e}")

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
            logger.error(f"pytest 실행 실패: {e}")
            return {
                "success": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": str(e),
                "execution_time": 0.0,
                "logs": "",
            }

        finally:
            # 임시 디렉토리 정리
            if temp_path and temp_path.exists():
                self._cleanup_temp_dir(temp_path)

