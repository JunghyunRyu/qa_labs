"""Health check API endpoints."""

import logging
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status

from app.services.worker_monitor import WorkerMonitor, WorkerStatus
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


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
    """
    result = {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "services": {
            "api": {"status": "healthy"},
        },
    }

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
            result["status"] = "degraded"
    except Exception as e:
        logger.error(f"Failed to check worker health: {e}")
        result["services"]["celery"] = {"status": "unknown", "error": str(e)}
        result["status"] = "degraded"

    return result
