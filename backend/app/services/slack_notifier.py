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
