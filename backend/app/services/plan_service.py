"""
Plan/Entitlement Service

사용자의 플랜 정보를 조회하고 기능/제한 권한을 확인합니다.
Redis 캐싱을 통해 DB 부하를 최소화합니다.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.user import User
from app.core.plan_config import (
    PlanKey,
    Feature,
    Limit,
    TierConfig,
    get_plan_config,
    PLAN_CONFIGS,
)
from app.services.redis_cache import RedisCache, get_redis_cache

logger = logging.getLogger(__name__)


class PlanService:
    """
    Plan/Entitlement 관리 서비스

    주요 기능:
    - 사용자 플랜 조회 (캐시 우선)
    - 기능 권한 확인 (Fail-safe)
    - 수량 제한 조회 (Fail-safe)
    - 캐시 무효화
    """

    CACHE_TTL_SECONDS = 300  # 5분
    CACHE_KEY_PREFIX = "plan"

    def __init__(
        self,
        db: Session,
        cache: Optional[RedisCache] = None
    ):
        """
        Args:
            db: SQLAlchemy 세션
            cache: Redis 캐시 인스턴스 (기본: 싱글톤)
        """
        self.db = db
        self.cache = cache or get_redis_cache()

    def get_user_plan(self, user: User) -> TierConfig:
        """
        사용자의 현재 Plan 조회 (캐시 우선)

        Args:
            user: User 인스턴스

        Returns:
            TierConfig: 플랜 설정
        """
        cache_key = self._get_cache_key(user.id)

        # 캐시 조회
        if self.cache.is_available():
            cached = self.cache.get(cache_key)
            if cached:
                logger.debug(f"Plan cache hit for user {user.id}")
                return get_plan_config(cached)

        # DB에서 조회 (User.plan_key 또는 User.tier 폴백)
        plan_key = getattr(user, 'plan_key', None) or getattr(user, 'tier', None) or "free"
        plan_config = get_plan_config(plan_key)

        # 캐시 저장
        if self.cache.is_available():
            self.cache.set(cache_key, plan_key, ttl=self.CACHE_TTL_SECONDS)
            logger.debug(f"Plan cached for user {user.id}: {plan_key}")

        return plan_config

    def has_feature(self, user: User, feature: Feature) -> bool:
        """
        특정 기능 사용 가능 여부 확인 (Fail-safe)

        Fail-safe 원칙:
        - 존재하지 않는 Feature Key → False 반환
        - 캐시/DB 오류 시 → False 반환 (안전한 기본값)

        Args:
            user: User 인스턴스
            feature: 확인할 Feature

        Returns:
            bool: 기능 사용 가능 여부
        """
        try:
            plan = self.get_user_plan(user)
            return feature in plan.features
        except Exception as e:
            logger.error(f"Error checking feature {feature} for user {user.id}: {e}")
            return False  # Fail-safe

    def get_limit(self, user: User, limit: Limit) -> int:
        """
        수량 제한 조회 (Fail-safe)

        Fail-safe 원칙:
        - 존재하지 않는 Limit Key → 최소값(0) 반환

        Args:
            user: User 인스턴스
            limit: 조회할 Limit

        Returns:
            int: 제한 값
        """
        try:
            plan = self.get_user_plan(user)
            return plan.limits.get(limit, 0)
        except Exception as e:
            logger.error(f"Error getting limit {limit} for user {user.id}: {e}")
            return 0  # Fail-safe

    def invalidate_cache(self, user_id: UUID) -> bool:
        """
        캐시 무효화 (Plan 변경 시 호출)

        Args:
            user_id: 사용자 ID

        Returns:
            bool: 성공 여부
        """
        cache_key = self._get_cache_key(user_id)
        result = self.cache.delete(cache_key)
        if result:
            logger.info(f"Plan cache invalidated for user {user_id}")
        return result

    def upgrade_plan(
        self,
        user: User,
        new_plan_key: PlanKey,
        expires_at: Optional[datetime] = None
    ) -> Tuple[bool, str]:
        """
        Plan 업그레이드 (결제 연동 후 사용)

        Args:
            user: User 인스턴스
            new_plan_key: 새 플랜 키
            expires_at: 플랜 만료일 (None = 영구)

        Returns:
            Tuple[bool, str]: (성공 여부, 메시지)
        """
        try:
            old_plan_key = getattr(user, 'plan_key', 'free')

            # User 모델 업데이트
            user.plan_key = new_plan_key.value
            user.plan_started_at = datetime.now(timezone.utc)
            user.plan_expires_at = expires_at

            self.db.commit()

            # 캐시 무효화
            self.invalidate_cache(user.id)

            logger.info(
                f"User {user.id} upgraded from {old_plan_key} to {new_plan_key.value}"
            )
            return True, f"Plan upgraded to {new_plan_key.value}"

        except Exception as e:
            self.db.rollback()
            logger.error(f"Plan upgrade failed for user {user.id}: {e}")
            return False, f"Upgrade failed: {str(e)}"

    def downgrade_plan(
        self,
        user: User,
        new_plan_key: PlanKey = PlanKey.FREE
    ) -> Tuple[bool, str]:
        """
        Plan 다운그레이드

        Args:
            user: User 인스턴스
            new_plan_key: 새 플랜 키 (기본: FREE)

        Returns:
            Tuple[bool, str]: (성공 여부, 메시지)
        """
        try:
            old_plan_key = getattr(user, 'plan_key', 'free')

            user.plan_key = new_plan_key.value
            user.plan_expires_at = None  # 만료일 초기화

            self.db.commit()
            self.invalidate_cache(user.id)

            logger.info(
                f"User {user.id} downgraded from {old_plan_key} to {new_plan_key.value}"
            )
            return True, f"Plan changed to {new_plan_key.value}"

        except Exception as e:
            self.db.rollback()
            logger.error(f"Plan downgrade failed for user {user.id}: {e}")
            return False, f"Downgrade failed: {str(e)}"

    def check_plan_expiry(self, user: User) -> bool:
        """
        플랜 만료 여부 확인 및 자동 다운그레이드

        Args:
            user: User 인스턴스

        Returns:
            bool: 만료되어 다운그레이드 되었으면 True
        """
        expires_at = getattr(user, 'plan_expires_at', None)
        if expires_at is None:
            return False  # 만료일 없음 = 영구

        if datetime.now(timezone.utc) > expires_at:
            # 자동 다운그레이드
            self.downgrade_plan(user, PlanKey.FREE)
            logger.info(f"User {user.id} plan expired, downgraded to free")
            return True

        return False

    def _get_cache_key(self, user_id: UUID) -> str:
        """캐시 키 생성"""
        return f"{self.CACHE_KEY_PREFIX}:{user_id}"


# 의존성 주입용 팩토리 함수
def get_plan_service(db: Session) -> PlanService:
    """PlanService 인스턴스 반환"""
    return PlanService(db)


# 편의 함수: 모든 플랜 정보 조회
def get_all_plans() -> list[TierConfig]:
    """모든 플랜 설정 목록 반환"""
    return list(PLAN_CONFIGS.values())


def get_plan_by_key(plan_key: str) -> TierConfig:
    """플랜 키로 설정 조회"""
    return get_plan_config(plan_key)
