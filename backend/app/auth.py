"""Verify invisible Supabase sessions while retaining a local guest fallback."""

import asyncio
import re
from functools import lru_cache
from typing import Annotated

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

from .config import get_settings
from .models import User

GUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,64}$")


@lru_cache
def _jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(f"{url.rstrip('/')}/auth/v1/.well-known/jwks.json", cache_keys=True)


def _verify_token(token: str) -> dict:
    settings = get_settings()
    if not settings.supabase_url:
        raise ValueError("Supabase URL is not configured")
    header = jwt.get_unverified_header(token)
    algorithm = header.get("alg")
    if algorithm == "HS256":
        if not settings.supabase_jwt_secret:
            raise ValueError("Supabase JWT secret is not configured")
        key = settings.supabase_jwt_secret
    elif algorithm in {"RS256", "ES256", "EdDSA"}:
        key = _jwks_client(settings.supabase_url).get_signing_key_from_jwt(token).key
    else:
        raise ValueError("Unsupported JWT algorithm")
    return jwt.decode(
        token,
        key,
        algorithms=[algorithm],
        audience="authenticated",
        issuer=f"{settings.supabase_url.rstrip('/')}/auth/v1",
    )


async def current_user(
    authorization: Annotated[str | None, Header()] = None,
    x_guest_id: Annotated[str | None, Header(alias="X-Guest-ID")] = None,
) -> User:
    """Require a signed anonymous session in production and isolate local guests."""
    settings = get_settings()
    if settings.require_api_auth:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="A valid visitor session is required")
        try:
            claims = await asyncio.to_thread(_verify_token, authorization.removeprefix("Bearer ").strip())
            subject = str(claims["sub"])
        except (KeyError, ValueError, jwt.PyJWTError):
            raise HTTPException(status_code=401, detail="Invalid or expired visitor session") from None
        return User(id=subject, email=claims.get("email"))
    safe_id = x_guest_id if x_guest_id and GUEST_ID_PATTERN.fullmatch(x_guest_id) else "public"
    return User(id=f"guest-{safe_id}", email=None)
