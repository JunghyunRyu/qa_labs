"""Health check API endpoints."""

import logging
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text
import redis

from app.services.worker_monitor import WorkerMonitor, WorkerStatus
from app.core.config import settings
from app.models.db import SessionLocal

logger = logging.getLogger(__name__)
router = APIRouter()


def check_database() -> Dict[str, Any]:
    """DB 연결 상태 체크."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


def check_redis() -> Dict[str, Any]:
    """Redis 연결 상태 체크."""
    try:
        client = redis.from_url(settings.REDIS_URL)
        client.ping()
        client.close()
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)}


@router.get("/worker")
async def worker_health() -> Dict[str, Any]:
    """
    Celery Worker 헬스 체크.

    Returns:
        Worker 상태 요약 정보
    """
    try:
        monitor = WorkerMonitor()
        summary = monitor.get_summary()

        # HTTP 상태 코드 결정
        if summary["total_workers"] == 0:
            # Worker가 하나도 없으면 503
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No workers available",
            )

        if summary["offline"] > 0 and summary["online"] == 0:
            # 모든 Worker가 offline이면 503
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="All workers are offline",
            )

        return {
            "status": "healthy" if summary["online"] > 0 else "degraded",
            **summary,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Worker health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )


@router.get("/worker/{worker_name:path}")
async def worker_detail(worker_name: str) -> Dict[str, Any]:
    """
    특정 Worker 상세 상태 조회.

    Args:
        worker_name: Worker 이름 (예: celery@hostname)
    """
    try:
        monitor = WorkerMonitor()
        states = monitor.check_health()

        if worker_name not in states:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Worker '{worker_name}' not found",
            )

        return states[worker_name].to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Worker detail check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Check failed: {str(e)}",
        )


@router.get("")
async def system_health() -> Dict[str, Any]:
    """
    전체 시스템 헬스 체크.

    기존 /health 엔드포인트를 확장한 버전.
    DB, Redis, Celery Worker 상태를 모두 체크합니다.
    """
    result = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "services": {
            "api": {"status": "healthy"},
        },
    }

    # DB 연결 체크
    db_status = check_database()
    result["services"]["database"] = db_status
    if db_status["status"] != "healthy":
        result["status"] = "unhealthy"

    # Redis 연결 체크
    redis_status = check_redis()
    result["services"]["redis"] = redis_status
    if redis_status["status"] != "healthy":
        result["status"] = "unhealthy"

    # Worker 상태 확인
    try:
        monitor = WorkerMonitor()
        summary = monitor.get_summary()
        result["services"]["celery"] = {
            "status": "healthy" if summary["online"] > 0 else "unhealthy",
            "workers_online": summary["online"],
            "workers_offline": summary["offline"],
        }

        if summary["online"] == 0:
            if result["status"] == "healthy":
                result["status"] = "degraded"
    except Exception as e:
        logger.error(f"Failed to check worker health: {e}")
        result["services"]["celery"] = {"status": "unknown", "error": str(e)}
        if result["status"] == "healthy":
            result["status"] = "degraded"

    return result


@router.get("/judge")
async def judge_health() -> Dict[str, Any]:
    """
    Judge 컨테이너 상태 확인.
    
    실행 중인 Judge 컨테이너와 최근 종료된 컨테이너 정보를 반환합니다.
    """
    result = {
        "status": "healthy",
        "running_containers": [],
        "recent_containers": [],
        "stats": {
            "total_checked": 0,
            "running": 0,
            "exited_success": 0,
            "exited_failed": 0,
        }
    }
    
    try:
        import docker
        import platform
        import os
        
        # Docker 클라이언트 초기화
        is_in_container = os.path.exists("/.dockerenv") or os.environ.get("DOCKER_CONTAINER") == "true"
        
        if platform.system() == "Windows" and not is_in_container:
            client = docker.DockerClient(base_url="npipe:////./pipe/docker_engine")
        elif is_in_container:
            client = docker.DockerClient(base_url="unix:///var/run/docker.sock")
        else:
            client = docker.from_env()
        
        # Judge 컨테이너 조회 (qa_arena_judge_ 접두사로 필터링)
        all_containers = client.containers.list(all=True)
        judge_containers = [c for c in all_containers if "qa_arena_judge" in c.name or "qa-arena-judge" in c.image.tags[0] if c.image.tags]
        
        for container in judge_containers[:20]:  # 최대 20개만
            container_info = {
                "id": container.id[:12],
                "name": container.name,
                "status": container.status,
                "created": container.attrs.get("Created", ""),
            }
            
            result["stats"]["total_checked"] += 1
            
            if container.status == "running":
                result["running_containers"].append(container_info)
                result["stats"]["running"] += 1
            else:
                # 종료된 컨테이너
                exit_code = container.attrs.get("State", {}).get("ExitCode", -1)
                container_info["exit_code"] = exit_code
                result["recent_containers"].append(container_info)
                
                if exit_code == 0:
                    result["stats"]["exited_success"] += 1
                else:
                    result["stats"]["exited_failed"] += 1
        
        # 상태 판단
        if result["stats"]["running"] > 5:  # 동시에 5개 이상 실행 중이면 경고
            result["status"] = "warning"
            result["message"] = f"Many judge containers running: {result['stats']['running']}"
            
    except Exception as e:
        logger.error(f"[HEALTH_JUDGE_ERROR] error={e}")
        result["status"] = "error"
        result["error"] = str(e)
    
    return result
