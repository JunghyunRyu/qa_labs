"""
Daily Bounty Service - 일일 현상금 시스템

매일 Easy/Medium 문제 1개를 선정하여 해결 시 토큰 보상을 지급합니다.
- 기본 보상: +5 토큰
- 스트릭 보너스: 3일 연속 시 +50 토큰
"""

import logging
import hashlib
from datetime import date, datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.problem import Problem
from app.models.daily_bounty import DailyBounty, DailyBountyCompletion
from app.models.token_transaction import ActionType, SourceType
from app.repositories.token_repository import TokenRepository

logger = logging.getLogger(__name__)

# Constants
KST = ZoneInfo("Asia/Seoul")
BASE_REWARD = 5  # 해결 시 기본 보상
STREAK_BONUS = 50  # 3일 연속 보너스
STREAK_THRESHOLD = 3  # 보너스 지급 조건 (연속 일수)
ELIGIBLE_DIFFICULTIES = ["Easy", "Medium"]  # 선정 대상 난이도
RECENT_EXCLUSION_DAYS = 7  # 최근 N일 이내 선정된 문제 제외


class DailyBountyService:
    """일일 현상금 서비스"""

    def __init__(self, db: Session):
        self.db = db
        self.token_repo = TokenRepository(db)

    def get_today_date(self) -> date:
        """KST 기준 오늘 날짜 반환"""
        return datetime.now(KST).date()

    def get_or_create_daily_bounty(self, target_date: Optional[date] = None) -> Optional[DailyBounty]:
        """
        오늘의 일일 현상금 문제 조회/생성 (Lazy Evaluation)

        Args:
            target_date: 대상 날짜 (기본: 오늘)

        Returns:
            DailyBounty 또는 None (적합한 문제 없음)
        """
        if target_date is None:
            target_date = self.get_today_date()

        # 기존 선정 확인
        existing = self.db.query(DailyBounty).filter(
            DailyBounty.date == target_date
        ).first()

        if existing:
            return existing

        # 새로운 문제 선정
        problem = self._select_daily_problem(target_date)
        if not problem:
            logger.warning(f"[DAILY_BOUNTY] No eligible problem for {target_date}")
            return None

        # DailyBounty 생성
        daily_bounty = DailyBounty(
            date=target_date,
            problem_id=problem.id,
        )
        self.db.add(daily_bounty)
        self.db.commit()
        self.db.refresh(daily_bounty)

        logger.info(f"[DAILY_BOUNTY_CREATED] date={target_date} problem_id={problem.id} title={problem.title}")
        return daily_bounty

    def _select_daily_problem(self, target_date: date) -> Optional[Problem]:
        """
        날짜 기반 결정론적 랜덤으로 문제 선정

        - 동일 날짜에는 항상 같은 문제가 선정됩니다.
        - 최근 N일 이내 선정된 문제는 제외됩니다.
        """
        # 1. 최근 N일 이내 선정된 문제 ID 조회 (중복 방지)
        exclusion_start = target_date - timedelta(days=RECENT_EXCLUSION_DAYS)
        recent_bounties = self.db.query(DailyBounty.problem_id).filter(
            DailyBounty.date >= exclusion_start,
            DailyBounty.date < target_date,  # 오늘 이전까지만
        ).all()
        excluded_problem_ids = {b.problem_id for b in recent_bounties}

        # 2. 적합한 문제 목록 조회 (중복 제외)
        query = self.db.query(Problem).filter(
            Problem.is_visible == True,
            Problem.published_at <= datetime.now(),
            Problem.difficulty.in_(ELIGIBLE_DIFFICULTIES),
        )

        # 제외할 문제가 있으면 필터링
        if excluded_problem_ids:
            query = query.filter(~Problem.id.in_(excluded_problem_ids))

        eligible_problems = query.order_by(Problem.id).all()  # 정렬로 일관성 보장

        # 후보가 없으면 제외 없이 전체에서 선정 (fallback)
        if not eligible_problems:
            logger.warning(
                f"[DAILY_BOUNTY] No eligible problems after exclusion, "
                f"falling back to all eligible problems"
            )
            eligible_problems = self.db.query(Problem).filter(
                Problem.is_visible == True,
                Problem.published_at <= datetime.now(),
                Problem.difficulty.in_(ELIGIBLE_DIFFICULTIES),
            ).order_by(Problem.id).all()

        if not eligible_problems:
            return None

        # 3. 날짜 기반 시드로 결정론적 선택
        date_seed = hashlib.md5(target_date.isoformat().encode()).hexdigest()
        seed_int = int(date_seed, 16)
        index = seed_int % len(eligible_problems)

        selected = eligible_problems[index]
        logger.info(
            f"[DAILY_BOUNTY_SELECTION] date={target_date} "
            f"candidates={len(eligible_problems)} excluded={len(excluded_problem_ids)} "
            f"selected_id={selected.id}"
        )

        return selected

    def get_daily_bounty_status(
        self,
        user: Optional[User],
        target_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        일일 현상금 상태 조회

        Returns:
            {
                "date": "2026-01-16",
                "problem": { ... },  # 문제 정보
                "is_completed": bool,  # 오늘 완료 여부
                "user_streak": int,  # 현재 스트릭
                "streak_progress": int,  # 3일 보너스까지 남은 일수
                "time_remaining_seconds": int,  # 자정까지 남은 시간
                "rewards": {
                    "base_reward": 5,
                    "streak_bonus": 50,
                    "streak_threshold": 3,
                }
            }
        """
        if target_date is None:
            target_date = self.get_today_date()

        # 일일 현상금 문제 가져오기
        daily_bounty = self.get_or_create_daily_bounty(target_date)

        if not daily_bounty:
            return {
                "date": target_date.isoformat(),
                "problem": None,
                "is_completed": False,
                "error": "No eligible problem for today",
            }

        problem = daily_bounty.problem

        # 문제 정보 구성
        problem_info = {
            "id": problem.id,
            "slug": problem.slug,
            "title": problem.title,
            "difficulty": problem.difficulty,
            "domain": getattr(problem, 'domain', 'common'),
            "short_description": problem.short_description,
        }

        # 사용자별 완료 상태
        is_completed = False
        user_streak = 0
        completion = None

        if user:
            completion = self.db.query(DailyBountyCompletion).filter(
                DailyBountyCompletion.user_id == user.id,
                DailyBountyCompletion.date == target_date,
            ).first()
            is_completed = completion is not None

            # 스트릭 유효성 체크: 하루 이상 놓치면 0으로 표시
            if is_completed:
                # 오늘 완료했으면 현재 스트릭 값 사용
                user_streak = user.bounty_streak
            elif user.last_bounty_completed_at:
                # 오늘 미완료 상태에서 어제 완료했는지 확인
                yesterday = target_date - timedelta(days=1)
                last_completed_date = user.last_bounty_completed_at.astimezone(KST).date()
                if last_completed_date == yesterday:
                    # 어제 완료 → 스트릭 유효 (연속 가능)
                    user_streak = user.bounty_streak
                else:
                    # 어제 미완료 → 스트릭 끊김, 0으로 표시
                    user_streak = 0
            # else: 첫 도전, user_streak = 0

        # 3일 보너스까지 남은 일수 계산
        streak_progress = (user_streak % STREAK_THRESHOLD) if user_streak > 0 else 0

        # 자정까지 남은 시간 계산
        now_kst = datetime.now(KST)
        midnight_kst = (now_kst + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        time_remaining_seconds = int((midnight_kst - now_kst).total_seconds())

        return {
            "date": target_date.isoformat(),
            "problem": problem_info,
            "is_completed": is_completed,
            "user_streak": user_streak,
            "streak_progress": streak_progress,
            "time_remaining_seconds": time_remaining_seconds,
            "rewards": {
                "base_reward": BASE_REWARD,
                "streak_bonus": STREAK_BONUS,
                "streak_threshold": STREAK_THRESHOLD,
            },
            "completion": {
                "base_reward_granted": completion.base_reward_granted if completion else False,
                "streak_bonus_granted": completion.streak_bonus_granted if completion else False,
            } if completion else None,
        }

    def check_and_grant_reward(
        self,
        user: User,
        problem_id: int,
        submission_id: UUID
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        제출 성공 시 일일 현상금 보상 확인 및 지급

        Args:
            user: 사용자
            problem_id: 해결한 문제 ID
            submission_id: 제출 ID

        Returns:
            (granted: bool, details: dict)
        """
        today = self.get_today_date()

        # 오늘의 일일 현상금 확인
        daily_bounty = self.db.query(DailyBounty).filter(
            DailyBounty.date == today
        ).first()

        if not daily_bounty or daily_bounty.problem_id != problem_id:
            return False, {"reason": "not_daily_bounty"}

        # 이미 완료했는지 확인
        existing_completion = self.db.query(DailyBountyCompletion).filter(
            DailyBountyCompletion.user_id == user.id,
            DailyBountyCompletion.date == today,
        ).first()

        if existing_completion:
            return False, {"reason": "already_completed"}

        # 비관적 잠금으로 사용자 조회
        locked_user = self.token_repo.get_user_with_lock(user.id)
        if not locked_user:
            return False, {"reason": "user_not_found"}

        # 스트릭 계산
        yesterday = today - timedelta(days=1)
        new_streak = 1

        if locked_user.last_bounty_completed_at:
            last_completed_date = locked_user.last_bounty_completed_at.astimezone(KST).date()
            if last_completed_date == yesterday:
                new_streak = locked_user.bounty_streak + 1
            elif last_completed_date == today:
                # 이미 오늘 완료됨 (동시성 방어)
                return False, {"reason": "already_completed"}

        # 보상 지급
        rewards_granted = []

        # 1. 기본 보상 (+5 토큰)
        self.token_repo.grant_tokens(
            user=locked_user,
            action_type=ActionType.DAILY_BOUNTY_SOLVE,
            source_type=SourceType.SYSTEM,
            amount=BASE_REWARD,
            description=f"Daily Bounty reward for {today.isoformat()}",
        )
        rewards_granted.append({"type": "base_reward", "amount": BASE_REWARD})

        # 2. 스트릭 보너스 (3일 연속 시 +50 토큰)
        streak_bonus_granted = False
        if new_streak >= STREAK_THRESHOLD and new_streak % STREAK_THRESHOLD == 0:
            self.token_repo.grant_tokens(
                user=locked_user,
                action_type=ActionType.DAILY_BOUNTY_STREAK,
                source_type=SourceType.SYSTEM,
                amount=STREAK_BONUS,
                description=f"Daily Bounty {new_streak}-day streak bonus",
            )
            rewards_granted.append({"type": "streak_bonus", "amount": STREAK_BONUS})
            streak_bonus_granted = True

        # 사용자 스트릭 업데이트
        locked_user.bounty_streak = new_streak
        locked_user.bounty_streak_updated_at = datetime.now(KST)
        locked_user.last_bounty_completed_at = datetime.now(KST)

        # 완료 기록 생성
        completion = DailyBountyCompletion(
            user_id=locked_user.id,
            date=today,
            problem_id=problem_id,
            submission_id=submission_id,
            base_reward_granted=True,
            streak_bonus_granted=streak_bonus_granted,
            streak_count=new_streak,
        )
        self.db.add(completion)
        self.db.commit()

        logger.info(
            f"[DAILY_BOUNTY_COMPLETED] user_id={user.id} problem_id={problem_id} "
            f"streak={new_streak} rewards={rewards_granted}"
        )

        return True, {
            "streak": new_streak,
            "rewards_granted": rewards_granted,
            "total_granted": sum(r["amount"] for r in rewards_granted),
        }


def get_daily_bounty_service(db: Session) -> DailyBountyService:
    """Factory function"""
    return DailyBountyService(db)
