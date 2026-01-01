"""
Plan/Entitlement Configuration

QA Arena의 플랜별 기능 및 제한 설정을 정의합니다.
정적 설정으로 DB 조회 없이 빠르게 접근 가능합니다.
"""

from enum import Enum
from typing import Dict, Set
from dataclasses import dataclass, field


class PlanKey(str, Enum):
    """플랜 키"""
    FREE = "free"
    LITE = "lite"
    PRO = "pro"


class Feature(str, Enum):
    """
    기능 플래그 - Plan별 on/off

    각 기능은 Plan에 따라 활성화/비활성화됩니다.
    """
    AI_COACH = "ai_coach"                     # AI 코치 채팅
    AI_HINT = "ai_hint"                       # AI 힌트
    FEEDBACK_DEEP = "feedback_deep"           # 심화 분석
    FEEDBACK_REGENERATE = "feedback_regenerate"  # 피드백 재생성
    SUCCESS_ANALYSIS = "success_analysis"     # 100점 성공 분석
    EXPORT_PDF = "export_pdf"                 # PDF 내보내기 (향후)
    PRIORITY_QUEUE = "priority_queue"         # 채점 우선 큐 (향후)


class Limit(str, Enum):
    """
    수량 제한 - Plan별 숫자 값

    각 제한은 Plan에 따라 다른 값을 가집니다.
    """
    MONTHLY_TOKENS = "monthly_tokens"         # 월간 토큰 수
    DAILY_FREE = "daily_free"                 # 일일 무료 토큰 수
    DAILY_AI_CAP = "daily_ai_cap"             # 일일 AI 호출 상한
    MAX_CODE_LENGTH = "max_code_length"       # 코드 길이 제한 (문자)
    MAX_CONTEXT_MESSAGES = "max_context_messages"  # AI 대화 컨텍스트 메시지 수


class ActionType(str, Enum):
    """
    토큰 사용 액션 유형

    각 액션은 토큰 비용이 다를 수 있습니다.
    """
    AI_COACH = "ai_coach"
    AI_HINT = "ai_hint"
    FEEDBACK_DEEP = "feedback_deep"
    FEEDBACK_REGENERATE = "feedback_regenerate"
    SUCCESS_ANALYSIS = "success_analysis"


# ActionType -> Feature 매핑
ACTION_TO_FEATURE: Dict[ActionType, Feature] = {
    ActionType.AI_COACH: Feature.AI_COACH,
    ActionType.AI_HINT: Feature.AI_HINT,
    ActionType.FEEDBACK_DEEP: Feature.FEEDBACK_DEEP,
    ActionType.FEEDBACK_REGENERATE: Feature.FEEDBACK_REGENERATE,
    ActionType.SUCCESS_ANALYSIS: Feature.SUCCESS_ANALYSIS,
}


# ActionType -> 토큰 비용 (token-policy.md §5.2)
ACTION_COSTS: Dict[ActionType, int] = {
    ActionType.AI_COACH: 1,
    ActionType.AI_HINT: 1,
    ActionType.FEEDBACK_DEEP: 2,
    ActionType.FEEDBACK_REGENERATE: 1,
    ActionType.SUCCESS_ANALYSIS: 1,
}


@dataclass
class TierConfig:
    """
    Plan별 설정

    Attributes:
        plan_key: 플랜 식별자
        display_name: 표시 이름
        features: 활성화된 기능 Set
        limits: 수량 제한 Dict
        price_monthly: 월간 가격 (KRW, 0 = 무료)
        description: 플랜 설명
    """
    plan_key: PlanKey
    display_name: str
    features: Set[Feature]
    limits: Dict[Limit, int]
    price_monthly: int = 0
    description: str = ""


# Plan 설정 정의 (정적)
PLAN_CONFIGS: Dict[PlanKey, TierConfig] = {
    PlanKey.FREE: TierConfig(
        plan_key=PlanKey.FREE,
        display_name="Free",
        features={
            Feature.AI_COACH,
            Feature.AI_HINT,
            Feature.FEEDBACK_REGENERATE,
            # Feature.FEEDBACK_DEEP 제외 (유료 전용)
            # Feature.SUCCESS_ANALYSIS 제외 (유료 전용)
        },
        limits={
            Limit.MONTHLY_TOKENS: 100,
            Limit.DAILY_FREE: 3,
            Limit.DAILY_AI_CAP: 30,
            Limit.MAX_CODE_LENGTH: 10000,
            Limit.MAX_CONTEXT_MESSAGES: 5,
        },
        price_monthly=0,
        description="기본 무료 플랜",
    ),
    PlanKey.LITE: TierConfig(
        plan_key=PlanKey.LITE,
        display_name="Lite",
        features={
            Feature.AI_COACH,
            Feature.AI_HINT,
            Feature.FEEDBACK_REGENERATE,
            Feature.SUCCESS_ANALYSIS,
            # Feature.FEEDBACK_DEEP 제외
        },
        limits={
            Limit.MONTHLY_TOKENS: 300,
            Limit.DAILY_FREE: 5,
            Limit.DAILY_AI_CAP: 100,
            Limit.MAX_CODE_LENGTH: 20000,
            Limit.MAX_CONTEXT_MESSAGES: 10,
        },
        price_monthly=9900,
        description="라이트 플랜 - 성공 분석 포함",
    ),
    PlanKey.PRO: TierConfig(
        plan_key=PlanKey.PRO,
        display_name="Pro",
        features={
            Feature.AI_COACH,
            Feature.AI_HINT,
            Feature.FEEDBACK_REGENERATE,
            Feature.FEEDBACK_DEEP,
            Feature.SUCCESS_ANALYSIS,
            Feature.EXPORT_PDF,
            Feature.PRIORITY_QUEUE,
        },
        limits={
            Limit.MONTHLY_TOKENS: 1000,
            Limit.DAILY_FREE: 10,
            Limit.DAILY_AI_CAP: 500,
            Limit.MAX_CODE_LENGTH: 50000,
            Limit.MAX_CONTEXT_MESSAGES: 20,
        },
        price_monthly=29900,
        description="프로 플랜 - 모든 기능 포함",
    ),
}


def get_plan_config(plan_key: str) -> TierConfig:
    """
    Plan 설정 조회 (Fail-safe)

    Args:
        plan_key: 플랜 키 문자열

    Returns:
        TierConfig: 플랜 설정 (알 수 없는 키면 FREE 반환)
    """
    try:
        return PLAN_CONFIGS[PlanKey(plan_key)]
    except (ValueError, KeyError):
        return PLAN_CONFIGS[PlanKey.FREE]


def get_action_cost(action_type: str) -> int:
    """
    액션별 토큰 비용 조회

    Args:
        action_type: 액션 유형 문자열

    Returns:
        int: 토큰 비용 (알 수 없는 액션은 1 반환)
    """
    try:
        return ACTION_COSTS[ActionType(action_type)]
    except (ValueError, KeyError):
        return 1


def get_feature_for_action(action_type: str) -> Feature | None:
    """
    액션에 해당하는 Feature 조회

    Args:
        action_type: 액션 유형 문자열

    Returns:
        Feature | None: 해당 Feature (없으면 None)
    """
    try:
        return ACTION_TO_FEATURE.get(ActionType(action_type))
    except (ValueError, KeyError):
        return None
