"""Celery application configuration."""

from datetime import timedelta

from celery import Celery

from app.core.config import settings

# Redis URL에서 broker와 backend URL 생성
# broker는 DB 0, backend는 DB 1 사용
redis_broker = settings.REDIS_URL
# Redis URL에서 마지막 DB 번호를 1로 변경
if redis_broker.endswith("/0"):
    redis_backend = redis_broker.replace("/0", "/1")
else:
    # DB 번호가 없거나 다른 경우, 마지막 / 뒤를 1로 변경하거나 추가
    if "/" in redis_broker.rsplit("@", 1)[-1]:
        # DB 번호가 있는 경우
        redis_backend = redis_broker.rsplit("/", 1)[0] + "/1"
    else:
        # DB 번호가 없는 경우
        redis_backend = redis_broker + "/1"

# Celery 앱 초기화
celery_app = Celery(
    "qa_arena",
    broker=redis_broker,
    backend=redis_backend,
    include=["app.workers.tasks", "app.workers.monitoring_tasks"],
)

# Celery 설정
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5분 타임아웃
    task_soft_time_limit=240,  # 4분 소프트 타임아웃
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
    # Worker 이벤트 활성화 (모니터링용)
    worker_send_task_events=True,
    task_send_sent_event=True,
    # Beat 스케줄 설정
    beat_schedule={
        "check-worker-health": {
            "task": "app.workers.monitoring_tasks.check_worker_health",
            "schedule": timedelta(seconds=settings.WORKER_MONITOR_INTERVAL_SECONDS),
        },
    },
)

