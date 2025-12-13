"""Middleware package."""

from app.middleware.anonymous import AnonymousIDMiddleware

__all__ = ["AnonymousIDMiddleware"]
