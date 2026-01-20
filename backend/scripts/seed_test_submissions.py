#!/usr/bin/env python3
"""
테스트용 가짜 제출 데이터를 생성하는 스크립트.
대시보드 점수 추이 차트 테스트용.

Usage:
    python scripts/seed_test_submissions.py --user-email <email>
"""

import random
import uuid
from datetime import datetime, timedelta
from typing import Optional

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import click
from sqlalchemy import select

from app.models.db import SessionLocal
from app.models.user import User
from app.models.problem import Problem
from app.models.submission import Submission


def get_user_by_email(session, email: str) -> Optional[User]:
    """이메일로 사용자 조회."""
    return session.query(User).filter(User.email == email).first()


def get_user_by_name(session, name: str) -> Optional[User]:
    """이름으로 사용자 조회."""
    return session.query(User).filter(User.username == name).first()


def get_all_problems(session) -> list:
    """모든 문제 조회."""
    return session.query(Problem).filter(Problem.is_visible == True).limit(10).all()


def create_test_submissions(
    session,
    user_id: uuid.UUID,
    problems: list,
    days: int = 30,
    submissions_per_day_range: tuple = (1, 5),
):
    """테스트용 제출 데이터 생성."""

    created_count = 0

    # 과거 days일 동안의 데이터 생성
    for day_offset in range(days, 0, -1):
        date = datetime.now() - timedelta(days=day_offset)

        # 각 날짜별로 랜덤한 수의 제출 생성
        num_submissions = random.randint(*submissions_per_day_range)

        for _ in range(num_submissions):
            problem = random.choice(problems)

            # 점수 패턴: 시간이 지날수록 점수가 높아지는 경향
            # 초반에는 낮은 점수, 후반에는 높은 점수
            base_score = min(100, max(0, 20 + (days - day_offset) * 2 + random.randint(-20, 30)))

            # 가끔 실패 케이스도 포함
            if random.random() < 0.15:  # 15% 실패
                status = "FAILURE"
                score = 0
                killed = 0
                total = random.randint(3, 8)
            else:
                status = "SUCCESS"
                score = base_score
                total = random.randint(3, 8)
                killed = int(total * (score / 100))

            # 제출 시간에 약간의 랜덤성 추가
            submission_time = date + timedelta(
                hours=random.randint(9, 22),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59),
            )

            submission = Submission(
                id=uuid.uuid4(),
                user_id=user_id,
                problem_id=problem.id,
                code=f"# Test submission for {problem.title}\nimport pytest\n\ndef test_example():\n    assert True",
                status=status,
                score=score,
                killed_mutants=killed,
                total_mutants=total,
                execution_mode="client",
                verified=True,
                verification_status="verified",
                created_at=submission_time,
            )

            session.add(submission)
            created_count += 1

    session.commit()
    return created_count


@click.command()
@click.option("--user-email", default=None, help="테스트 데이터를 생성할 사용자 이메일")
@click.option("--user-name", default=None, help="테스트 데이터를 생성할 사용자 이름")
@click.option("--days", default=30, help="생성할 기간 (일)")
@click.option("--min-per-day", default=1, help="일일 최소 제출 수")
@click.option("--max-per-day", default=4, help="일일 최대 제출 수")
@click.option("--list-users", is_flag=True, help="사용자 목록 출력")
def main(user_email: str, user_name: str, days: int, min_per_day: int, max_per_day: int, list_users: bool):
    """테스트용 제출 데이터 생성."""

    session = SessionLocal()

    try:
        if list_users:
            # 사용자 목록 출력
            users = session.query(User).limit(20).all()
            click.echo("=== 사용자 목록 ===")
            for u in users:
                click.echo(f"  {u.username} | {u.email} | {u.id}")
            return

        if not user_email and not user_name:
            click.echo("❌ --user-email 또는 --user-name 옵션을 지정하세요.")
            click.echo("   사용자 목록을 보려면: --list-users")
            return

        # 사용자 조회
        user = None
        if user_email:
            user = get_user_by_email(session, user_email)
        elif user_name:
            user = get_user_by_name(session, user_name)

        if not user:
            click.echo(f"❌ 사용자를 찾을 수 없습니다: {user_email or user_name}")
            return

        click.echo(f"✅ 사용자 확인: {user.username} ({user.email})")

        # 문제 조회
        problems = get_all_problems(session)
        if not problems:
            click.echo("❌ 활성화된 문제가 없습니다.")
            return

        click.echo(f"✅ 문제 {len(problems)}개 확인")

        # 제출 데이터 생성
        click.echo(f"📝 {days}일간의 테스트 데이터 생성 중...")
        count = create_test_submissions(
            session,
            user.id,
            problems,
            days=days,
            submissions_per_day_range=(min_per_day, max_per_day),
        )

        click.echo(f"✅ {count}개의 테스트 제출 데이터가 생성되었습니다!")

    finally:
        session.close()


if __name__ == "__main__":
    main()
