#!/usr/bin/env python3
import asyncio
import sys
import os

# 현재 디렉토리를 Python path에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.user import User

async def list_users():
    async with async_session_maker() as session:
        result = await session.execute(select(User).limit(10))
        users = result.scalars().all()
        for u in users:
            print(f'{u.name} | {u.email} | {u.id}')

if __name__ == "__main__":
    asyncio.run(list_users())
