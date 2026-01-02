"""Slack notification service for alerts."""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class AlertSeverity(str, Enum):
    """알림 심각도."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class SlackNotifier:
    """Slack Webhook 기반 알림 서비스."""

    # 심각도별 이모지 및 색상
    SEVERITY_CONFIG = {
        AlertSeverity.INFO: {"emoji": ":information_source:", "color": "#36a64f"},
        AlertSeverity.WARNING: {"emoji": ":warning:", "color": "#f2c744"},
        AlertSeverity.ERROR: {"emoji": ":x:", "color": "#e01e5a"},
        AlertSeverity.CRITICAL: {"emoji": ":rotating_light:", "color": "#8b0000"},
    }

    def __init__(self):
        self.webhook_url = settings.SLACK_WEBHOOK_URL
        self.enabled = settings.SLACK_ALERT_ENABLED and bool(self.webhook_url)
        self.environment = settings.ENVIRONMENT

    async def send_alert(
        self,
        title: str,
        message: str,
        severity: AlertSeverity = AlertSeverity.WARNING,
        fields: Optional[List[Dict[str, str]]] = None,
    ) -> bool:
        """Slack 알림 전송."""
        if not self.enabled:
            logger.info(f"[SLACK_DISABLED] Would send: {title} - {message}")
            return False

        config = self.SEVERITY_CONFIG.get(
            severity, self.SEVERITY_CONFIG[AlertSeverity.INFO]
        )

        # Slack Block Kit 메시지 구성
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{config['emoji']} {title}",
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": message,
                },
            },
        ]

        # 추가 필드가 있는 경우
        if fields:
            field_blocks = {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*{f['title']}*\n{f['value']}"}
                    for f in fields
                ],
            }
            blocks.append(field_blocks)

        # 컨텍스트 정보 추가
        blocks.append(
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Environment:* {self.environment} | *Time:* {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
                    }
                ],
            }
        )

        payload = {
            "attachments": [
                {
                    "color": config["color"],
                    "blocks": blocks,
                }
            ]
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    timeout=10.0,
                )
                response.raise_for_status()
                logger.info(f"[SLACK_SENT] {title}")
                return True
        except httpx.HTTPStatusError as e:
            logger.error(f"[SLACK_ERROR] HTTP error: {e.response.status_code}")
            return False
        except Exception as e:
            logger.error(f"[SLACK_ERROR] Failed to send alert: {e}")
            return False

    async def send_worker_down_alert(
        self,
        worker_name: str,
        last_seen: Optional[datetime],
        consecutive_failures: int,
    ) -> bool:
        """Worker Down 알림 전송."""
        last_seen_str = (
            last_seen.strftime("%Y-%m-%d %H:%M:%S UTC") if last_seen else "Unknown"
        )

        logger.warning(
            f"[WORKER_DOWN_ALERT] worker={worker_name} last_seen={last_seen_str} failures={consecutive_failures}"
        )

        return await self.send_alert(
            title="Celery Worker DOWN",
            message=f"Worker `{worker_name}` is not responding.",
            severity=AlertSeverity.CRITICAL,
            fields=[
                {"title": "Worker Name", "value": worker_name},
                {"title": "Last Seen", "value": last_seen_str},
                {"title": "Failed Checks", "value": str(consecutive_failures)},
            ],
        )

    async def send_worker_recovery_alert(
        self,
        worker_name: str,
        downtime_minutes: Optional[int] = None,
    ) -> bool:
        """Worker 복구 알림 전송."""
        if not settings.SLACK_ALERT_ON_RECOVERY:
            logger.info(f"[RECOVERY_ALERT_DISABLED] Worker {worker_name} recovered")
            return False

        downtime_str = f"{downtime_minutes} minutes" if downtime_minutes else "Unknown"

        logger.info(
            f"[WORKER_RECOVERY_ALERT] worker={worker_name} downtime={downtime_str}"
        )

        return await self.send_alert(
            title="Celery Worker RECOVERED",
            message=f"Worker `{worker_name}` is back online.",
            severity=AlertSeverity.INFO,
            fields=[
                {"title": "Worker Name", "value": worker_name},
                {"title": "Downtime", "value": downtime_str},
            ],
        )

    async def send_all_workers_down_alert(self) -> bool:
        """모든 Worker Down 알림 (긴급)."""
        logger.critical("[ALL_WORKERS_DOWN_ALERT] All workers are unresponsive!")

        return await self.send_alert(
            title="ALL WORKERS DOWN - CRITICAL",
            message="All Celery workers are unresponsive. Immediate action required!",
            severity=AlertSeverity.CRITICAL,
        )

    def send_sync(
        self,
        title: str,
        message: str,
        severity: AlertSeverity = AlertSeverity.WARNING,
        fields: Optional[List[Dict[str, str]]] = None,
    ) -> bool:
        """동기 방식 Slack 알림 전송 (Celery Task에서 사용)."""
        if not self.enabled:
            logger.info(f"[SLACK_DISABLED] Would send: {title} - {message}")
            return False

        config = self.SEVERITY_CONFIG.get(
            severity, self.SEVERITY_CONFIG[AlertSeverity.INFO]
        )

        # Slack Block Kit 메시지 구성
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{config['emoji']} {title}",
                    "emoji": True,
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": message,
                },
            },
        ]

        # 추가 필드가 있는 경우
        if fields:
            field_blocks = {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*{f['title']}*\n{f['value']}"}
                    for f in fields
                ],
            }
            blocks.append(field_blocks)

        # 컨텍스트 정보 추가
        blocks.append(
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Environment:* {self.environment} | *Time:* {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
                    }
                ],
            }
        )

        payload = {
            "attachments": [
                {
                    "color": config["color"],
                    "blocks": blocks,
                }
            ]
        }

        try:
            with httpx.Client() as client:
                response = client.post(
                    self.webhook_url,
                    json=payload,
                    timeout=10.0,
                )
                response.raise_for_status()
                logger.info(f"[SLACK_SENT] {title}")
                return True
        except httpx.HTTPStatusError as e:
            logger.error(f"[SLACK_ERROR] HTTP error: {e.response.status_code}")
            return False
        except Exception as e:
            logger.error(f"[SLACK_ERROR] Failed to send alert: {e}")
            return False

    def send_worker_down_alert_sync(
        self,
        worker_name: str,
        last_seen: Optional[datetime],
        consecutive_failures: int,
    ) -> bool:
        """Worker Down 알림 전송 (동기)."""
        last_seen_str = (
            last_seen.strftime("%Y-%m-%d %H:%M:%S UTC") if last_seen else "Unknown"
        )

        logger.warning(
            f"[WORKER_DOWN_ALERT] worker={worker_name} last_seen={last_seen_str} failures={consecutive_failures}"
        )

        return self.send_sync(
            title="Celery Worker DOWN",
            message=f"Worker `{worker_name}` is not responding.",
            severity=AlertSeverity.CRITICAL,
            fields=[
                {"title": "Worker Name", "value": worker_name},
                {"title": "Last Seen", "value": last_seen_str},
                {"title": "Failed Checks", "value": str(consecutive_failures)},
            ],
        )

    def send_worker_recovery_alert_sync(
        self,
        worker_name: str,
        downtime_minutes: Optional[int] = None,
    ) -> bool:
        """Worker 복구 알림 전송 (동기)."""
        if not settings.SLACK_ALERT_ON_RECOVERY:
            logger.info(f"[RECOVERY_ALERT_DISABLED] Worker {worker_name} recovered")
            return False

        downtime_str = f"{downtime_minutes} minutes" if downtime_minutes else "Unknown"

        logger.info(
            f"[WORKER_RECOVERY_ALERT] worker={worker_name} downtime={downtime_str}"
        )

        return self.send_sync(
            title="Celery Worker RECOVERED",
            message=f"Worker `{worker_name}` is back online.",
            severity=AlertSeverity.INFO,
            fields=[
                {"title": "Worker Name", "value": worker_name},
                {"title": "Downtime", "value": downtime_str},
            ],
        )

    def send_all_workers_down_alert_sync(self) -> bool:
        """모든 Worker Down 알림 (동기)."""
        logger.critical("[ALL_WORKERS_DOWN_ALERT] All workers are unresponsive!")

        return self.send_sync(
            title="ALL WORKERS DOWN - CRITICAL",
            message="All Celery workers are unresponsive. Immediate action required!",
            severity=AlertSeverity.CRITICAL,
        )

    # ===== P0-4: 모니터링 알림 확장 =====

    async def send_judge_stuck_alert(
        self,
        container_id: str,
        duration_minutes: int,
        submission_id: Optional[str] = None,
    ) -> bool:
        """Judge 컨테이너 타임아웃/멈춤 알림."""
        logger.warning(
            f"[JUDGE_STUCK_ALERT] container_id={container_id} "
            f"duration={duration_minutes}min submission_id={submission_id or 'unknown'}"
        )

        fields = [
            {"title": "Container ID", "value": container_id[:12]},
            {"title": "Duration", "value": f"{duration_minutes} minutes"},
        ]
        if submission_id:
            fields.append({"title": "Submission ID", "value": submission_id})

        return await self.send_alert(
            title="Judge Container Stuck",
            message=f"Judge 컨테이너가 {duration_minutes}분 이상 실행 중입니다. 확인이 필요합니다.",
            severity=AlertSeverity.WARNING if duration_minutes < 10 else AlertSeverity.ERROR,
            fields=fields,
        )

    def send_judge_stuck_alert_sync(
        self,
        container_id: str,
        duration_minutes: int,
        submission_id: Optional[str] = None,
    ) -> bool:
        """Judge 컨테이너 타임아웃/멈춤 알림 (동기)."""
        logger.warning(
            f"[JUDGE_STUCK_ALERT] container_id={container_id} "
            f"duration={duration_minutes}min submission_id={submission_id or 'unknown'}"
        )

        fields = [
            {"title": "Container ID", "value": container_id[:12]},
            {"title": "Duration", "value": f"{duration_minutes} minutes"},
        ]
        if submission_id:
            fields.append({"title": "Submission ID", "value": submission_id})

        return self.send_sync(
            title="Judge Container Stuck",
            message=f"Judge 컨테이너가 {duration_minutes}분 이상 실행 중입니다. 확인이 필요합니다.",
            severity=AlertSeverity.WARNING if duration_minutes < 10 else AlertSeverity.ERROR,
            fields=fields,
        )

    async def send_queue_depth_alert(
        self,
        queue_name: str,
        current_depth: int,
        threshold: int,
    ) -> bool:
        """큐 깊이 임계값 초과 알림."""
        logger.warning(
            f"[QUEUE_DEPTH_ALERT] queue={queue_name} depth={current_depth} threshold={threshold}"
        )

        # 초과 비율에 따라 심각도 결정
        ratio = current_depth / threshold if threshold > 0 else 1
        if ratio >= 3:
            severity = AlertSeverity.CRITICAL
        elif ratio >= 2:
            severity = AlertSeverity.ERROR
        else:
            severity = AlertSeverity.WARNING

        return await self.send_alert(
            title="Queue Depth Threshold Exceeded",
            message=f"큐 `{queue_name}`의 대기 작업이 임계값을 초과했습니다.",
            severity=severity,
            fields=[
                {"title": "Queue Name", "value": queue_name},
                {"title": "Current Depth", "value": str(current_depth)},
                {"title": "Threshold", "value": str(threshold)},
                {"title": "Ratio", "value": f"{ratio:.1f}x"},
            ],
        )

    def send_queue_depth_alert_sync(
        self,
        queue_name: str,
        current_depth: int,
        threshold: int,
    ) -> bool:
        """큐 깊이 임계값 초과 알림 (동기)."""
        logger.warning(
            f"[QUEUE_DEPTH_ALERT] queue={queue_name} depth={current_depth} threshold={threshold}"
        )

        ratio = current_depth / threshold if threshold > 0 else 1
        if ratio >= 3:
            severity = AlertSeverity.CRITICAL
        elif ratio >= 2:
            severity = AlertSeverity.ERROR
        else:
            severity = AlertSeverity.WARNING

        return self.send_sync(
            title="Queue Depth Threshold Exceeded",
            message=f"큐 `{queue_name}`의 대기 작업이 임계값을 초과했습니다.",
            severity=severity,
            fields=[
                {"title": "Queue Name", "value": queue_name},
                {"title": "Current Depth", "value": str(current_depth)},
                {"title": "Threshold", "value": str(threshold)},
                {"title": "Ratio", "value": f"{ratio:.1f}x"},
            ],
        )

    async def send_high_error_rate_alert(
        self,
        error_rate: float,
        window_minutes: int,
        error_count: int,
        total_count: int,
    ) -> bool:
        """에러율 급증 알림."""
        logger.warning(
            f"[HIGH_ERROR_RATE_ALERT] rate={error_rate:.1%} window={window_minutes}min "
            f"errors={error_count}/{total_count}"
        )

        # 에러율에 따라 심각도 결정
        if error_rate >= 0.5:  # 50% 이상
            severity = AlertSeverity.CRITICAL
        elif error_rate >= 0.25:  # 25% 이상
            severity = AlertSeverity.ERROR
        else:
            severity = AlertSeverity.WARNING

        return await self.send_alert(
            title="High Error Rate Detected",
            message=f"최근 {window_minutes}분간 에러율이 {error_rate:.1%}로 급증했습니다.",
            severity=severity,
            fields=[
                {"title": "Error Rate", "value": f"{error_rate:.1%}"},
                {"title": "Time Window", "value": f"{window_minutes} minutes"},
                {"title": "Error Count", "value": str(error_count)},
                {"title": "Total Requests", "value": str(total_count)},
            ],
        )

    def send_high_error_rate_alert_sync(
        self,
        error_rate: float,
        window_minutes: int,
        error_count: int,
        total_count: int,
    ) -> bool:
        """에러율 급증 알림 (동기)."""
        logger.warning(
            f"[HIGH_ERROR_RATE_ALERT] rate={error_rate:.1%} window={window_minutes}min "
            f"errors={error_count}/{total_count}"
        )

        if error_rate >= 0.5:
            severity = AlertSeverity.CRITICAL
        elif error_rate >= 0.25:
            severity = AlertSeverity.ERROR
        else:
            severity = AlertSeverity.WARNING

        return self.send_sync(
            title="High Error Rate Detected",
            message=f"최근 {window_minutes}분간 에러율이 {error_rate:.1%}로 급증했습니다.",
            severity=severity,
            fields=[
                {"title": "Error Rate", "value": f"{error_rate:.1%}"},
                {"title": "Time Window", "value": f"{window_minutes} minutes"},
                {"title": "Error Count", "value": str(error_count)},
                {"title": "Total Requests", "value": str(total_count)},
            ],
        )
