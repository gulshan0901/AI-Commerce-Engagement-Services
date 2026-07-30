from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException, status

from .config import Settings, get_settings
from .models import User


async def current_user(
    authorization: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> User:
    if not authorization:
        if settings.require_auth:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
        return User(id="demo-user", email="demo@commerce.ai")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        algorithm = jwt.get_unverified_header(token).get("alg")
        if algorithm == "HS256" and settings.supabase_jwt_secret:
            claims = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
        elif algorithm in {"RS256", "ES256"} and settings.supabase_url:
            jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
            key = jwt.PyJWKClient(jwks_url).get_signing_key_from_jwt(token).key
            claims = jwt.decode(token, key, algorithms=[algorithm], audience="authenticated")
        else:
            raise HTTPException(status_code=401, detail="Unsupported or unverifiable access token")
    except HTTPException:
        raise
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    return User(id=claims["sub"], email=claims.get("email"))
