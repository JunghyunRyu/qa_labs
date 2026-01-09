#!/usr/bin/env python3
"""
Daily Monitoring Report Generator

EC2 프로덕션 환경에서 실행되어 DB, 로그, 시스템 메트릭을 수집합니다.
사용법: python scripts/daily_report.py --output json
"""

import json
import os
import sys
import subprocess
import re
import requests
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, asdict, field
from pathlib import Path

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# ============================================================
# 설정
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")
LOGS_DIR = Path("/app/logs")
TIMEZONE = "Asia/Seoul"


# ============================================================
# 데이터 클래스
# ============================================================

@dataclass
class ErrorInfo:
    timestamp: str
    level: str
    message: str
    file: Optional[str] = None
    line: Optional[int] = None
    probable_cause: Optional[str] = None


@dataclass
class ProblemStats:
    problem_id: int
    slug: str
    title: str
    difficulty: str
    total: int
    success: int
    failure: int
    error: int
    failure_rate: float


@dataclass
class TokenStats:
    action_type: str
    count: int
    total_amount: int


@dataclass
class SystemResources:
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    memory_used_gb: float
    memory_total_gb: float
    disk_used_gb: float
    disk_total_gb: float


@dataclass
class JudgeStats:
    avg_execution_time_seconds: float
    timeout_count: int
    timeout_rate: float
    queue_pending: int
    queue_running: int
    worker_status: str
    worker_online: int
    worker_total: int


@dataclass
class ContainerInfo:
    name: str
    service: str
    state: str
    status: str


@dataclass
class DailyReport:
    generated_at: str
    report_date: str

    # DB 현황
    total_users: int = 0
    new_users_today: int = 0
    total_submissions: int = 0
    submissions_today: int = 0
    total_problems: int = 0
    published_problems: int = 0

    # 회원/비회원 제출 구분
    submissions_by_member: int = 0
    submissions_by_anonymous: int = 0
    submissions_today_by_member: int = 0
    submissions_today_by_anonymous: int = 0

    # 문제별 통계
    problem_stats: List[Dict] = field(default_factory=list)

    # 토큰 사용
    token_stats: List[Dict] = field(default_factory=list)
    total_tokens_used_today: int = 0

    # 오류 현황
    errors_today: List[Dict] = field(default_factory=list)
    error_count: int = 0

    # 시스템 리소스
    system_resources: Dict = field(default_factory=dict)

    # 채점 시스템
    judge_stats: Dict = field(default_factory=dict)

    # 컨테이너 상태
    container_status: List[Dict] = field(default_factory=list)


# ============================================================
# DB 쿼리
# ============================================================

def get_db_session():
    """DB 세션 생성"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL 환경 변수가 설정되지 않았습니다")
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    return Session()


def get_today_start() -> datetime:
    """오늘 00:00:00 반환 (Asia/Seoul 기준)"""
    from zoneinfo import ZoneInfo
    tz = ZoneInfo("Asia/Seoul")
    now = datetime.now(tz)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def get_user_stats(session) -> tuple:
    """사용자 통계"""
    today = get_today_start()

    total = session.execute(
        text("SELECT COUNT(*) FROM users WHERE is_deleted = false")
    ).scalar() or 0

    new_today = session.execute(
        text("SELECT COUNT(*) FROM users WHERE created_at >= :today AND is_deleted = false"),
        {"today": today}
    ).scalar() or 0

    return total, new_today


def get_submission_stats(session) -> dict:
    """제출 통계 (회원/비회원 구분 포함)"""
    today = get_today_start()

    # 전체 통계
    total = session.execute(text("SELECT COUNT(*) FROM submissions")).scalar() or 0
    today_count = session.execute(
        text("SELECT COUNT(*) FROM submissions WHERE created_at >= :today"),
        {"today": today}
    ).scalar() or 0

    # 회원 제출 (user_id가 있는 경우)
    member_total = session.execute(
        text("SELECT COUNT(*) FROM submissions WHERE user_id IS NOT NULL")
    ).scalar() or 0
    member_today = session.execute(
        text("SELECT COUNT(*) FROM submissions WHERE user_id IS NOT NULL AND created_at >= :today"),
        {"today": today}
    ).scalar() or 0

    # 비회원 제출 (user_id가 없고 anonymous_id가 있는 경우)
    anonymous_total = session.execute(
        text("SELECT COUNT(*) FROM submissions WHERE user_id IS NULL AND anonymous_id IS NOT NULL")
    ).scalar() or 0
    anonymous_today = session.execute(
        text("SELECT COUNT(*) FROM submissions WHERE user_id IS NULL AND anonymous_id IS NOT NULL AND created_at >= :today"),
        {"today": today}
    ).scalar() or 0

    return {
        "total": total,
        "today": today_count,
        "member_total": member_total,
        "member_today": member_today,
        "anonymous_total": anonymous_total,
        "anonymous_today": anonymous_today,
    }


def get_problem_stats_summary(session) -> tuple:
    """문제 통계 요약"""
    total = session.execute(text("SELECT COUNT(*) FROM problems")).scalar() or 0

    published = session.execute(
        text("""
            SELECT COUNT(*) FROM problems
            WHERE is_visible = true
            AND (published_at IS NULL OR published_at <= NOW())
        """)
    ).scalar() or 0

    return total, published


def get_problem_failure_rates(session) -> List[ProblemStats]:
    """문제별 실패율"""
    query = text("""
        SELECT
            p.id,
            p.slug,
            p.title,
            p.difficulty,
            COUNT(s.id) as total,
            SUM(CASE WHEN s.status = 'SUCCESS' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN s.status = 'FAILURE' THEN 1 ELSE 0 END) as failure,
            SUM(CASE WHEN s.status = 'ERROR' THEN 1 ELSE 0 END) as error
        FROM problems p
        LEFT JOIN submissions s ON p.id = s.problem_id
        WHERE p.is_visible = true
        GROUP BY p.id, p.slug, p.title, p.difficulty
        ORDER BY p.id
    """)

    results = []
    for row in session.execute(query):
        total = row.total or 0
        failure_count = (row.failure or 0) + (row.error or 0)
        failure_rate = (failure_count / total * 100) if total > 0 else 0.0

        results.append(ProblemStats(
            problem_id=row.id,
            slug=row.slug,
            title=row.title[:30] + "..." if len(row.title) > 30 else row.title,
            difficulty=row.difficulty,
            total=total,
            success=row.success or 0,
            failure=row.failure or 0,
            error=row.error or 0,
            failure_rate=round(failure_rate, 1)
        ))

    # 실패율 높은 순으로 정렬
    results.sort(key=lambda x: x.failure_rate, reverse=True)
    return results


def get_token_usage_today(session) -> tuple:
    """금일 토큰 사용 통계"""
    today = get_today_start()

    query = text("""
        SELECT
            action_type,
            COUNT(*) as count,
            SUM(ABS(amount)) as total_amount
        FROM token_transactions
        WHERE created_at >= :today AND amount < 0
        GROUP BY action_type
        ORDER BY total_amount DESC
    """)

    results = []
    total_used = 0

    for row in session.execute(query, {"today": today}):
        amount = int(row.total_amount or 0)
        results.append(TokenStats(
            action_type=row.action_type,
            count=row.count,
            total_amount=amount
        ))
        total_used += amount

    return results, total_used


def get_judge_stats(session) -> JudgeStats:
    """채점 시스템 통계"""
    today = get_today_start()

    # 평균 채점 시간 (execution_log에서 추출)
    avg_time_query = text("""
        SELECT AVG((execution_log->>'execution_time')::float) as avg_time
        FROM submissions
        WHERE created_at >= :today
        AND status IN ('SUCCESS', 'FAILURE')
        AND execution_log IS NOT NULL
        AND execution_log->>'execution_time' IS NOT NULL
    """)
    avg_time = session.execute(avg_time_query, {"today": today}).scalar() or 0.0

    # 타임아웃 발생 수 (ERROR 상태 + timeout 키워드)
    timeout_query = text("""
        SELECT COUNT(*) FROM submissions
        WHERE created_at >= :today AND status = 'ERROR'
        AND (
            execution_log->>'error' ILIKE '%timeout%'
            OR execution_log->>'error' ILIKE '%timed out%'
        )
    """)
    timeout_count = session.execute(timeout_query, {"today": today}).scalar() or 0

    # 전체 금일 제출 대비 타임아웃 비율
    total_today = session.execute(
        text("SELECT COUNT(*) FROM submissions WHERE created_at >= :today"),
        {"today": today}
    ).scalar() or 0

    timeout_rate = (timeout_count / total_today * 100) if total_today > 0 else 0.0

    # 큐 대기 (PENDING/RUNNING 상태)
    pending = session.execute(
        text("SELECT COUNT(*) FROM submissions WHERE status = 'PENDING'")
    ).scalar() or 0

    running = session.execute(
        text("SELECT COUNT(*) FROM submissions WHERE status = 'RUNNING'")
    ).scalar() or 0

    return JudgeStats(
        avg_execution_time_seconds=round(avg_time, 2),
        timeout_count=timeout_count,
        timeout_rate=round(timeout_rate, 2),
        queue_pending=pending,
        queue_running=running,
        worker_status="ONLINE",
        worker_online=1,
        worker_total=1
    )


# ============================================================
# 로그 파싱
# ============================================================

def parse_error_logs() -> List[ErrorInfo]:
    """error.log 파싱"""
    errors = []
    log_path = LOGS_DIR / "error.log"

    if not log_path.exists():
        return errors

    today_str = datetime.now().strftime("%Y-%m-%d")

    # 로그 형식: 2025-01-09 14:32:15,123 - module - ERROR - message
    pattern = r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ - ([^ ]+) - (ERROR|CRITICAL) - (.+)"

    try:
        with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()

        for line in lines:
            if today_str not in line:
                continue

            match = re.match(pattern, line.strip())
            if match:
                timestamp_str, module, level, message = match.groups()

                # 파일/라인 추출 시도
                file_match = re.search(r'File "([^"]+)", line (\d+)', line)
                file_path = file_match.group(1) if file_match else None
                line_no = int(file_match.group(2)) if file_match else None

                # 원인 추정
                cause = guess_error_cause(message)

                # 시간만 추출
                time_only = timestamp_str.split()[1] if " " in timestamp_str else timestamp_str

                errors.append(ErrorInfo(
                    timestamp=time_only,
                    level=level,
                    message=message[:200],
                    file=file_path,
                    line=line_no,
                    probable_cause=cause
                ))
    except Exception as e:
        errors.append(ErrorInfo(
            timestamp=datetime.now().strftime("%H:%M:%S"),
            level="ERROR",
            message=f"로그 파싱 실패: {str(e)}",
            probable_cause="로그 파일 접근 문제"
        ))

    return errors[-20:]  # 최근 20개만


def guess_error_cause(message: str) -> str:
    """오류 원인 추정"""
    message_lower = message.lower()

    if "connection refused" in message_lower or "connect" in message_lower:
        return "네트워크 연결 문제 (Redis/DB 과부하 또는 다운)"
    elif "timeout" in message_lower or "timed out" in message_lower:
        return "타임아웃 (무한루프, 리소스 부족, 네트워크 지연)"
    elif "memory" in message_lower or "oom" in message_lower:
        return "메모리 부족"
    elif "permission" in message_lower or "denied" in message_lower:
        return "권한 문제"
    elif "disk" in message_lower or "space" in message_lower or "no space" in message_lower:
        return "디스크 공간 부족"
    elif "docker" in message_lower:
        return "Docker 관련 문제"
    elif "redis" in message_lower:
        return "Redis 연결/명령 문제"
    elif "database" in message_lower or "postgres" in message_lower or "sqlalchemy" in message_lower:
        return "DB 연결/쿼리 문제"
    elif "openai" in message_lower or "api" in message_lower:
        return "외부 API 호출 실패"
    else:
        return "원인 분석 필요"


# ============================================================
# 시스템 메트릭
# ============================================================

def get_system_resources() -> SystemResources:
    """시스템 리소스 수집"""
    try:
        import psutil

        cpu = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage("/")

        return SystemResources(
            cpu_percent=cpu,
            memory_percent=memory.percent,
            disk_percent=disk.percent,
            memory_used_gb=round(memory.used / (1024**3), 1),
            memory_total_gb=round(memory.total / (1024**3), 1),
            disk_used_gb=round(disk.used / (1024**3), 1),
            disk_total_gb=round(disk.total / (1024**3), 1)
        )
    except ImportError:
        # psutil이 없는 경우 기본값 반환
        return SystemResources(
            cpu_percent=0.0,
            memory_percent=0.0,
            disk_percent=0.0,
            memory_used_gb=0.0,
            memory_total_gb=0.0,
            disk_used_gb=0.0,
            disk_total_gb=0.0
        )
    except Exception:
        return SystemResources(
            cpu_percent=0.0,
            memory_percent=0.0,
            disk_percent=0.0,
            memory_used_gb=0.0,
            memory_total_gb=0.0,
            disk_used_gb=0.0,
            disk_total_gb=0.0
        )


def get_container_status() -> List[ContainerInfo]:
    """Docker 컨테이너 상태"""
    containers = []

    try:
        # docker compose ps --format json
        result = subprocess.run(
            ["docker", "compose", "-f", "/home/ssm-user/qa_labs/docker-compose.prod.yml", "ps", "--format", "json"],
            capture_output=True,
            text=True,
            cwd="/home/ssm-user/qa_labs",
            timeout=30
        )

        if result.returncode == 0 and result.stdout.strip():
            for line in result.stdout.strip().split("\n"):
                if line:
                    try:
                        container = json.loads(line)
                        containers.append(ContainerInfo(
                            name=container.get("Name", ""),
                            service=container.get("Service", ""),
                            state=container.get("State", ""),
                            status=container.get("Status", "")
                        ))
                    except json.JSONDecodeError:
                        pass
    except subprocess.TimeoutExpired:
        containers.append(ContainerInfo(
            name="error",
            service="error",
            state="timeout",
            status="Docker 명령어 타임아웃"
        ))
    except FileNotFoundError:
        # Docker가 없는 환경 (개발 환경)
        pass
    except Exception as e:
        containers.append(ContainerInfo(
            name="error",
            service="error",
            state="error",
            status=str(e)[:100]
        ))

    return containers


# ============================================================
# 리포트 생성
# ============================================================

def generate_report() -> DailyReport:
    """리포트 생성"""
    from zoneinfo import ZoneInfo
    tz = ZoneInfo("Asia/Seoul")
    now = datetime.now(tz)

    report = DailyReport(
        generated_at=now.isoformat(),
        report_date=now.strftime("%Y-%m-%d")
    )

    try:
        session = get_db_session()

        # DB 통계
        report.total_users, report.new_users_today = get_user_stats(session)
        report.total_problems, report.published_problems = get_problem_stats_summary(session)

        # 제출 통계 (회원/비회원 구분)
        submission_stats = get_submission_stats(session)
        report.total_submissions = submission_stats["total"]
        report.submissions_today = submission_stats["today"]
        report.submissions_by_member = submission_stats["member_total"]
        report.submissions_by_anonymous = submission_stats["anonymous_total"]
        report.submissions_today_by_member = submission_stats["member_today"]
        report.submissions_today_by_anonymous = submission_stats["anonymous_today"]

        # 문제별 통계
        problem_stats = get_problem_failure_rates(session)
        report.problem_stats = [asdict(p) for p in problem_stats]

        # 토큰 사용
        token_stats, total_tokens = get_token_usage_today(session)
        report.token_stats = [asdict(t) for t in token_stats]
        report.total_tokens_used_today = total_tokens

        # 채점 시스템
        judge_stats = get_judge_stats(session)
        report.judge_stats = asdict(judge_stats)

        session.close()

    except Exception as e:
        report.errors_today.append(asdict(ErrorInfo(
            timestamp=now.strftime("%H:%M:%S"),
            level="ERROR",
            message=f"DB 쿼리 실패: {str(e)}",
            probable_cause="DB 연결 문제"
        )))

    # 오류 로그 (DB 외부)
    errors = parse_error_logs()
    report.errors_today.extend([asdict(e) for e in errors])
    report.error_count = len(report.errors_today)

    # 시스템 리소스
    resources = get_system_resources()
    report.system_resources = asdict(resources)

    # 컨테이너 상태
    containers = get_container_status()
    report.container_status = [asdict(c) for c in containers]

    return report


# ============================================================
# 출력 포맷팅
# ============================================================

def format_text_report(report: DailyReport) -> str:
    """텍스트 형식 리포트"""
    # 회원/비회원 비율 계산
    member_pct = (report.submissions_by_member / report.total_submissions * 100) if report.total_submissions > 0 else 0
    anon_pct = (report.submissions_by_anonymous / report.total_submissions * 100) if report.total_submissions > 0 else 0

    lines = [
        f"========================================",
        f"QA Labs Daily Report - {report.report_date}",
        f"========================================",
        f"",
        f"[DB 현황]",
        f"  총 사용자: {report.total_users}명 (금일 가입: +{report.new_users_today}명)",
        f"  총 제출: {report.total_submissions}건 (금일: {report.submissions_today}건)",
        f"    - 회원: {report.submissions_by_member}건 ({member_pct:.1f}%) / 금일: {report.submissions_today_by_member}건",
        f"    - 비회원: {report.submissions_by_anonymous}건 ({anon_pct:.1f}%) / 금일: {report.submissions_today_by_anonymous}건",
        f"  총 문제: {report.total_problems}개 (공개: {report.published_problems}개)",
        f"",
        f"[문제별 실패율 Top 5]",
    ]

    for i, p in enumerate(report.problem_stats[:5]):
        status = "정상" if p["failure_rate"] < 30 else ("주의" if p["failure_rate"] < 50 else "높음")
        lines.append(f"  {i+1}. {p['slug']}: {p['failure_rate']}% ({p['failure']+p['error']}/{p['total']}) - {status}")

    lines.extend([
        f"",
        f"[토큰 사용 현황]",
        f"  금일 총 소비: {report.total_tokens_used_today} 토큰",
    ])
    for t in report.token_stats[:5]:
        lines.append(f"  - {t['action_type']}: {t['count']}회 ({t['total_amount']} 토큰)")

    lines.extend([
        f"",
        f"[오류 현황] ({report.error_count}건)",
    ])
    for e in report.errors_today[:5]:
        lines.append(f"  [{e['timestamp']}] {e['message'][:50]}...")
        if e.get("probable_cause"):
            lines.append(f"    -> 원인: {e['probable_cause']}")

    lines.extend([
        f"",
        f"[시스템 리소스]",
        f"  CPU: {report.system_resources.get('cpu_percent', 0)}%",
        f"  메모리: {report.system_resources.get('memory_percent', 0)}%",
        f"  디스크: {report.system_resources.get('disk_percent', 0)}%",
        f"",
        f"[채점 시스템]",
        f"  평균 시간: {report.judge_stats.get('avg_execution_time_seconds', 0)}초",
        f"  타임아웃: {report.judge_stats.get('timeout_count', 0)}건 ({report.judge_stats.get('timeout_rate', 0)}%)",
        f"  큐 대기: {report.judge_stats.get('queue_pending', 0)}건",
        f"  Worker: {report.judge_stats.get('worker_status', 'UNKNOWN')}",
        f"",
        f"[컨테이너 상태]",
    ])
    for c in report.container_status:
        lines.append(f"  {c['service']}: {c['state']} - {c['status']}")

    lines.append(f"\n생성 시각: {report.generated_at}")

    return "\n".join(lines)


# ============================================================
# Discord 알림
# ============================================================

def send_discord_notification(report: DailyReport) -> bool:
    """Discord Webhook으로 리포트 알림 전송"""
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return False

    # 위험 상태 체크
    alerts = []
    cpu = report.system_resources.get("cpu_percent", 0)
    memory = report.system_resources.get("memory_percent", 0)
    disk = report.system_resources.get("disk_percent", 0)

    if cpu > 80:
        alerts.append(f"🔴 CPU 사용률 {cpu}% (80% 초과)")
    elif cpu > 60:
        alerts.append(f"⚠️ CPU 사용률 {cpu}% (60% 초과)")

    if memory > 85:
        alerts.append(f"🔴 메모리 사용률 {memory}% (85% 초과)")
    elif memory > 70:
        alerts.append(f"⚠️ 메모리 사용률 {memory}% (70% 초과)")

    if disk > 85:
        alerts.append(f"🔴 디스크 사용률 {disk}% (85% 초과)")
    elif disk > 70:
        alerts.append(f"⚠️ 디스크 사용률 {disk}% (70% 초과)")

    if report.error_count > 10:
        alerts.append(f"🔴 오류 {report.error_count}건 발생")
    elif report.error_count > 5:
        alerts.append(f"⚠️ 오류 {report.error_count}건 발생")

    timeout_rate = report.judge_stats.get("timeout_rate", 0)
    if timeout_rate > 5:
        alerts.append(f"🔴 타임아웃 비율 {timeout_rate}% (5% 초과)")

    # 상태에 따른 색상
    if any("🔴" in a for a in alerts):
        color = 0xFF0000  # 빨강
    elif any("⚠️" in a for a in alerts):
        color = 0xFFA500  # 주황
    else:
        color = 0x00FF00  # 초록

    # 회원/비회원 비율
    member_pct = (report.submissions_by_member / report.total_submissions * 100) if report.total_submissions > 0 else 0

    # Discord Embed 생성
    embed = {
        "title": f"📊 QA Labs Daily Report - {report.report_date}",
        "color": color,
        "fields": [
            {
                "name": "👥 사용자",
                "value": f"{report.total_users}명 (+{report.new_users_today})",
                "inline": True
            },
            {
                "name": "📝 금일 제출",
                "value": f"{report.submissions_today}건",
                "inline": True
            },
            {
                "name": "📊 총 제출",
                "value": f"{report.total_submissions}건 (회원 {member_pct:.0f}%)",
                "inline": True
            },
            {
                "name": "💻 CPU",
                "value": f"{cpu}%",
                "inline": True
            },
            {
                "name": "🧠 메모리",
                "value": f"{memory}%",
                "inline": True
            },
            {
                "name": "💾 디스크",
                "value": f"{disk}%",
                "inline": True
            },
            {
                "name": "🔴 오류",
                "value": f"{report.error_count}건",
                "inline": True
            },
            {
                "name": "⏱️ 평균 채점",
                "value": f"{report.judge_stats.get('avg_execution_time_seconds', 0)}초",
                "inline": True
            },
            {
                "name": "📋 큐 대기",
                "value": f"{report.judge_stats.get('queue_pending', 0)}건",
                "inline": True
            },
        ],
        "footer": {
            "text": f"생성: {report.generated_at}"
        }
    }

    # 알림 항목이 있으면 추가
    if alerts:
        embed["fields"].insert(0, {
            "name": "⚠️ 주의 필요",
            "value": "\n".join(alerts),
            "inline": False
        })

    payload = {
        "embeds": [embed]
    }

    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        return response.status_code == 204
    except Exception as e:
        print(f"Discord 알림 전송 실패: {e}", file=sys.stderr)
        return False


# ============================================================
# 메인
# ============================================================

def main():
    """메인 실행"""
    import argparse

    parser = argparse.ArgumentParser(description="Daily Monitoring Report Generator")
    parser.add_argument(
        "--output",
        choices=["json", "text"],
        default="json",
        help="Output format (default: json)"
    )
    parser.add_argument(
        "--notify",
        action="store_true",
        help="Send Discord notification"
    )
    args = parser.parse_args()

    report = generate_report()

    if args.output == "json":
        print(json.dumps(asdict(report), ensure_ascii=False, indent=2))
    else:
        print(format_text_report(report))

    # Discord 알림 전송
    if args.notify:
        if send_discord_notification(report):
            print("\n✅ Discord 알림 전송 완료", file=sys.stderr)
        else:
            print("\n⚠️ Discord 알림 전송 실패 (DISCORD_WEBHOOK_URL 확인)", file=sys.stderr)


if __name__ == "__main__":
    main()
