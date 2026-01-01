"""
Redis Cache Helper

Redis DB 3을 사용하는 캐싱 헬퍼 모듈입니다.
- Celery: DB 0-1
- Rate Limiting: DB 2
- Caching: DB 3
"""

import json
import logging
from typing import Optional, Any, Union
import redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    """
    Redis 캐싱 헬퍼 (Singleton)

    Plan/Entitlement 캐싱 및 일일 사용량 카운팅에 사용됩니다.
    """

    _instance: Optional['RedisCache'] = None

    CACHE_DB = 3  # Redis DB 3 사용

    def __init__(self):
        """Redis 클라이언트 초기화"""
        try:
            # Redis URL에서 DB 번호 교체
            base_url = settings.REDIS_URL.rsplit('/', 1)[0]
            redis_url = f"{base_url}/{self.CACHE_DB}"

            self.client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )
            # 연결 테스트
            self.client.ping()
            logger.info(f"Redis cache initialized (DB {self.CACHE_DB})")
        except Exception as e:
            logger.error(f"Redis cache initialization failed: {e}")
            self.client = None

    @classmethod
    def get_instance(cls) -> 'RedisCache':
        """
        싱글톤 인스턴스 반환

        Returns:
            RedisCache: 캐시 인스턴스
        """
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset_instance(cls) -> None:
        """싱글톤 인스턴스 리셋 (테스트용)"""
        if cls._instance is not None:
            try:
                cls._instance.client.close()
            except Exception:
                pass
            cls._instance = None

    def is_available(self) -> bool:
        """Redis 연결 가능 여부 확인"""
        if self.client is None:
            return False
        try:
            self.client.ping()
            return True
        except Exception:
            return False

    def get(self, key: str) -> Optional[str]:
        """
        캐시 조회

        Args:
            key: 캐시 키

        Returns:
            str | None: 캐시 값 (없거나 오류 시 None)
        """
        if self.client is None:
            return None
        try:
            return self.client.get(key)
        except Exception as e:
            logger.warning(f"Redis GET failed for key '{key}': {e}")
            return None

    def get_json(self, key: str) -> Optional[Any]:
        """
        JSON 캐시 조회

        Args:
            key: 캐시 키

        Returns:
            Any | None: 파싱된 JSON 객체
        """
        value = self.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return None

    def set(
        self,
        key: str,
        value: Union[str, dict, list],
        ttl: int = 300
    ) -> bool:
        """
        캐시 저장

        Args:
            key: 캐시 키
            value: 저장할 값 (str, dict, list)
            ttl: TTL (초, 기본 5분)

        Returns:
            bool: 성공 여부
        """
        if self.client is None:
            return False
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value, ensure_ascii=False)
            self.client.setex(key, ttl, value)
            return True
        except Exception as e:
            logger.warning(f"Redis SET failed for key '{key}': {e}")
            return False

    def delete(self, key: str) -> bool:
        """
        캐시 삭제

        Args:
            key: 캐시 키

        Returns:
            bool: 성공 여부
        """
        if self.client is None:
            return False
        try:
            return self.client.delete(key) > 0
        except Exception as e:
            logger.warning(f"Redis DELETE failed for key '{key}': {e}")
            return False

    def incr_with_expire(self, key: str, ttl: int) -> int:
        """
        Atomic increment with expiry

        일일 사용량 카운팅에 사용됩니다.
        키가 없으면 1로 설정하고, TTL을 적용합니다.

        Args:
            key: 캐시 키
            ttl: TTL (초)

        Returns:
            int: 현재 카운트 (오류 시 0)
        """
        if self.client is None:
            return 0
        try:
            pipe = self.client.pipeline()
            pipe.incr(key)
            pipe.expire(key, ttl)
            results = pipe.execute()
            return results[0]  # INCR 결과
        except Exception as e:
            logger.warning(f"Redis INCR failed for key '{key}': {e}")
            return 0

    def get_count(self, key: str) -> int:
        """
        카운트 조회

        Args:
            key: 캐시 키

        Returns:
            int: 현재 카운트 (없거나 오류 시 0)
        """
        value = self.get(key)
        if value is None:
            return 0
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0


# 편의 함수
def get_redis_cache() -> RedisCache:
    """Redis 캐시 인스턴스 반환"""
    return RedisCache.get_instance()
