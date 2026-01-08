"""
Client Result Verification Service

클라이언트 실행 결과의 서버 재검증을 관리하는 서비스입니다.

주요 기능:
- 재검증 필요 여부 판단 (랜덤 샘플링 + 조건부 트리거)
- 이상 패턴 감지 (반복 고득점, 중복 코드 해시)
- 검증 결과 처리
"""

import hashlib
import logging
import random
from datetime import datetime
from typing import Optional, Tuple
from uuid import UUID

from redis import Redis
import redis as redis_module
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.submission import Submission
from app.repositories.submission_repository import SubmissionRepository

logger = logging.getLogger(__name__)


class VerificationService:
    """클라이언트 실행 결과 검증 서비스."""

    # 검증 설정 [P0 Fix: 점수 조작 방지 강화]
    RANDOM_SAMPLE_RATE = 0.20  # 20% 랜덤 샘플링 (기존 5%)
    HIGH_SCORE_THRESHOLD = 70  # 고득점 기준 (기존 90)
    MEDIUM_SCORE_THRESHOLD = 50  # 중간 점수 기준 (추가 검증)
    FAST_EXECUTION_THRESHOLD_MS = 1000  # 1초 미만

    # Redis 키 패턴 (이상 패턴 감지용) - DB 2 사용
    REDIS_DB = 2  # Rate Limiting과 동일한 DB 사용
    REDIS_HIGH_SCORE_PREFIX = "verify:high_score:"
    REDIS_CODE_HASH_PREFIX = "verify:code_hash:"

    # 이상 패턴 감지 임계값
    HIGH_SCORE_COUNT_THRESHOLD = 5  # 1시간 내 5회 80점+
    DUPLICATE_HASH_THRESHOLD = 3  # 24시간 내 동일 코드 3회+

    def __init__(self, db: Session, redis_client: Optional[Redis] = None):
        """
        VerificationService 초기화.

        Args:
            db: SQLAlchemy 세션
            redis_client: Redis 클라이언트 (없으면 자동 생성)
        """
        self.db = db
        self.submission_repo = SubmissionRepository(db)
        self._redis = redis_client

    @property
    def redis(self) -> Optional[Redis]:
        """Redis 클라이언트 (lazy initialization)."""
        if self._redis is None:
            self._redis = self._get_redis()
        return self._redis

    def _get_redis(self) -> Optional[Redis]:
        """Redis 클라이언트 생성."""
        try:
            base_url = settings.REDIS_URL.rsplit("/", 1)[0]
            redis_url = f"{base_url}/{self.REDIS_DB}"
            client = redis_module.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            client.ping()
            return client
        except Exception as e:
            logger.warning(f"Redis connection failed for verification: {e}")
            return None

    def compute_code_hash(self, code: str) -> str:
        """
        코드 SHA256 해시 계산.

        공백을 정규화하여 동일한 로직의 코드를 동일 해시로 매핑합니다.

        Args:
            code: 사용자 제출 코드

        Returns:
            SHA256 해시 문자열 (64자)
        """
        # 공백/줄바꿈 정규화
        normalized = code.strip()
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    def should_verify(
        self,
        submission: Submission,
        score: int,
        execution_time_ms: float,
        client_ip: str,
    ) -> Tuple[bool, Optional[str]]:
        """
        재검증이 필요한지 결정.

        PRO 플랜 사용자의 Hard 난이도 문제에서 50점 이상일 때만 검증.
        이는 PRO 플랜의 프리미엄 기능으로, 서버 사이드 재검증을 통해
        더 정확한 채점 결과를 제공합니다.

        Args:
            submission: Submission 객체
            score: 클라이언트 보고 점수
            execution_time_ms: 실행 시간 (밀리초) - 현재 미사용
            client_ip: 클라이언트 IP 주소 - 현재 미사용

        Returns:
            (should_verify, trigger_reason) 튜플
        """
        # PRO 플랜 확인 (익명 사용자는 제외)
        is_pro = submission.user and submission.user.plan_key == "pro"

        # Hard 난이도 확인
        is_hard = submission.problem and submission.problem.difficulty == "Hard"

        # PRO + Hard + 50점 이상만 검증
        if is_pro and is_hard and score >= 50:
            logger.info(
                f"[VERIFICATION_TRIGGER] pro_hard_high_score submission_id={submission.id} "
                f"score={score} difficulty={submission.problem.difficulty}"
            )
            return True, "pro_hard_high_score"

        return False, None

    def _detect_repeated_high_scores(self, client_ip: str, score: int) -> bool:
        """
        동일 IP에서 반복적인 고득점 감지.

        1시간 내 80점 이상 제출이 5회 이상이면 의심 패턴으로 판단합니다.

        Args:
            client_ip: 클라이언트 IP 주소
            score: 현재 제출 점수

        Returns:
            의심 패턴 여부
        """
        if score < 80:  # 80점 이상만 카운트
            return False

        if not self.redis:
            return False

        try:
            key = f"{self.REDIS_HIGH_SCORE_PREFIX}{client_ip}"
            count = self.redis.incr(key)
            self.redis.expire(key, 3600)  # 1시간 윈도우

            return count >= self.HIGH_SCORE_COUNT_THRESHOLD
        except Exception as e:
            logger.error(f"Redis error in repeated high scores detection: {e}")
            return False

    def _detect_duplicate_code_hash(self, code_hash: str, problem_id: int) -> bool:
        """
        동일 코드 해시 중복 제출 감지.

        24시간 내 동일 problem_id + code_hash 조합이 3회 이상이면 의심 패턴으로 판단합니다.

        Args:
            code_hash: 코드 SHA256 해시
            problem_id: 문제 ID

        Returns:
            의심 패턴 여부
        """
        if not self.redis:
            return False

        try:
            key = f"{self.REDIS_CODE_HASH_PREFIX}{problem_id}:{code_hash}"
            count = self.redis.incr(key)
            self.redis.expire(key, 86400)  # 24시간 윈도우

            return count >= self.DUPLICATE_HASH_THRESHOLD
        except Exception as e:
            logger.error(f"Redis error in duplicate code hash detection: {e}")
            return False

    def mark_for_verification(
        self,
        submission: Submission,
        trigger_reason: str,
    ) -> None:
        """
        재검증 대기 상태로 마킹.

        Args:
            submission: Submission 객체
            trigger_reason: 트리거 사유
        """
        submission.verification_status = "pending"
        submission.verification_triggered_by = trigger_reason
        self.submission_repo.update(submission)

        logger.info(
            f"[VERIFICATION_QUEUED] submission_id={submission.id} "
            f"trigger={trigger_reason}"
        )

    def verify_submission(
        self,
        submission: Submission,
        server_score: int,
    ) -> str:
        """
        서버 재검증 결과 처리.

        클라이언트 점수와 서버 점수를 비교하여 상태를 결정합니다:
        - 5점 이내 차이: verified (허용 오차 범위)
        - 5점 초과 차이: mismatch (점수 확정 보류)

        Args:
            submission: Submission 객체
            server_score: 서버 재검증 점수

        Returns:
            verification_status: "verified" | "mismatch"
        """
        score_diff = abs(submission.score - server_score)

        if score_diff <= 5:
            # 5점 이내 차이는 타이밍 이슈 등으로 허용
            status = "verified"
        else:
            status = "mismatch"

        submission.verification_status = status
        submission.server_score = server_score
        submission.verified = (status == "verified")
        submission.verified_at = datetime.utcnow()
        self.submission_repo.update(submission)

        logger.info(
            f"[VERIFICATION_COMPLETE] submission_id={submission.id} "
            f"client_score={submission.score} server_score={server_score} "
            f"diff={score_diff} status={status}"
        )

        return status

    def get_pending_verifications(self, limit: int = 100) -> list[Submission]:
        """
        대기 중인 재검증 목록 조회.

        Args:
            limit: 최대 조회 개수

        Returns:
            Submission 목록
        """
        return (
            self.db.query(Submission)
            .filter(Submission.verification_status == "pending")
            .order_by(Submission.created_at.asc())
            .limit(limit)
            .all()
        )
