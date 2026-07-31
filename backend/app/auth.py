"""Assign a browser-scoped guest identity without requiring authentication."""

import re
from typing import Annotated

from fastapi import Header

from .models import User

GUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9-]{1,64}$")


async def current_user(x_guest_id: Annotated[str | None, Header(alias="X-Guest-ID")] = None) -> User:
    """Return a stable guest user while rejecting malformed identity headers."""
    safe_id = x_guest_id if x_guest_id and GUEST_ID_PATTERN.fullmatch(x_guest_id) else "public"
    return User(id=f"guest-{safe_id}", email=None)
