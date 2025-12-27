"""Security utility functions for log sanitization and data filtering."""

import re
from typing import List, Tuple

# 민감정보 패턴 정의
SENSITIVE_PATTERNS: List[Tuple[str, str]] = [
    # 이메일 주소
    (r"[\w\.-]+@[\w\.-]+\.\w+", "[EMAIL]"),
    # 한국 휴대폰 번호 (010-1234-5678, 01012345678)
    (r"\b01[016789][-\s]?\d{3,4}[-\s]?\d{4}\b", "[PHONE]"),
    # API 키/시크릿 파라미터 (api_key=xxx, secret=xxx)
    (r"(password|token|secret|api_key|apikey|auth|authorization|bearer)=\S+", r"\1=[MASKED]"),
    # Bearer 토큰
    (r"Bearer\s+[\w\-\.]+", "Bearer [MASKED]"),
    # JWT 토큰 패턴 (xxx.xxx.xxx)
    (r"\beyJ[\w-]*\.[\w-]*\.[\w-]*\b", "[JWT_TOKEN]"),
    # 신용카드 번호 (16자리)
    (r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b", "[CARD_NUMBER]"),
]


def sanitize_log_message(msg: str) -> str:
    """
    로그 메시지에서 민감한 정보를 마스킹합니다.

    Args:
        msg: 원본 로그 메시지

    Returns:
        민감정보가 마스킹된 메시지
    """
    if not msg:
        return msg

    sanitized = msg
    for pattern, replacement in SENSITIVE_PATTERNS:
        sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)

    return sanitized


def sanitize_url_path(url_path: str) -> str:
    """
    URL 경로에서 민감한 쿼리 파라미터를 마스킹합니다.

    Args:
        url_path: 원본 URL 경로 (쿼리 파라미터 포함 가능)

    Returns:
        민감정보가 마스킹된 URL 경로
    """
    if not url_path or "?" not in url_path:
        return url_path

    # 쿼리 파라미터 부분만 처리
    path_part, query_part = url_path.split("?", 1)

    # 민감한 파라미터 마스킹
    sensitive_params = ["password", "token", "secret", "api_key", "auth", "key"]
    params = query_part.split("&")
    sanitized_params = []

    for param in params:
        if "=" in param:
            key, value = param.split("=", 1)
            if any(sensitive in key.lower() for sensitive in sensitive_params):
                sanitized_params.append(f"{key}=[MASKED]")
            else:
                sanitized_params.append(param)
        else:
            sanitized_params.append(param)

    return f"{path_part}?{'&'.join(sanitized_params)}"


def filter_sensitive_dict(data: dict, sensitive_keys: List[str] = None) -> dict:
    """
    딕셔너리에서 민감한 키의 값을 필터링합니다.

    Args:
        data: 원본 딕셔너리
        sensitive_keys: 필터링할 키 목록 (기본값 제공)

    Returns:
        민감정보가 필터링된 딕셔너리
    """
    if sensitive_keys is None:
        sensitive_keys = [
            "password", "token", "api_key", "secret", "authorization",
            "email", "phone", "credit_card", "ssn", "address"
        ]

    if not isinstance(data, dict):
        return data

    filtered = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_keys):
            filtered[key] = "[FILTERED]"
        elif isinstance(value, dict):
            filtered[key] = filter_sensitive_dict(value, sensitive_keys)
        elif isinstance(value, list):
            filtered[key] = [
                filter_sensitive_dict(item, sensitive_keys) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            filtered[key] = value

    return filtered
