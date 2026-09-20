from fastapi import APIRouter, HTTPException, Request, status
from gotrue.errors import AuthApiError
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

from db.database import get_supabase_admin_client, get_supabase_client
from models.schemas import (
    AuthResponse,
    AuthRefreshRequest,
    BootstrapAdminRequest,
    BootstrapStatusResponse,
    UserLoginRequest,
    UserRegisterRequest,
)

from core.security import get_user_role, is_user_disabled
from core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


def _build_auth_response(auth_data: object) -> AuthResponse:
    session = getattr(auth_data, "session", None)
    user = getattr(auth_data, "user", None)

    if session is None or user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        )

    if is_user_disabled(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    role = get_user_role(user)

    return AuthResponse(
        access_token=session.access_token,
        expires_in=session.expires_in,
        refresh_token=session.refresh_token,
        user_id=user.id,
        email=user.email,
        role=role,
    )


def _list_auth_users() -> list:
    """Return all Supabase Auth users using the service role client."""
    supabase_admin = get_supabase_admin_client()
    response = supabase_admin.auth.admin.list_users()
    return response if isinstance(response, list) else getattr(response, "users", [])


def _has_admin_account() -> bool:
    """Return whether any existing auth user has the admin role."""
    return any(get_user_role(user) == "admin" for user in _list_auth_users())


@router.get("/bootstrap-status", response_model=BootstrapStatusResponse)
@limiter.limit("20/minute")
async def get_bootstrap_status(request: Request) -> BootstrapStatusResponse:
    """Return whether the one-time first admin setup is still available."""
    try:
        return BootstrapStatusResponse(needs_admin=not _has_admin_account())
    except AuthApiError as exc:
        logger.exception("Failed to inspect bootstrap status")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to check setup status.",
        ) from exc


@router.post(
    "/bootstrap-admin",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("3/minute")
async def bootstrap_admin(request: Request, payload: BootstrapAdminRequest) -> AuthResponse:
    """Create the first admin account when no admin exists yet."""
    settings = get_settings()

    if settings.admin_registration_secret and payload.setup_secret != settings.admin_registration_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid setup secret.",
        )

    try:
        if _has_admin_account():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An admin account already exists.",
            )

        supabase_admin = get_supabase_admin_client()
        supabase_admin.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": payload.full_name,
                    "role": "admin",
                    "is_disabled": False,
                },
            }
        )
    except HTTPException:
        raise
    except AuthApiError as exc:
        err_msg = getattr(exc, "message", str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg if err_msg else "Unable to create the first admin.",
        ) from None

    supabase = get_supabase_client()
    try:
        auth_data = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except AuthApiError as exc:
        logger.exception("First admin was created but automatic login failed")
        raise HTTPException(
            status_code=status.HTTP_201_CREATED,
            detail="Admin account created. Please sign in.",
        ) from exc

    return _build_auth_response(auth_data)


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def register_user(request: Request, payload: UserRegisterRequest) -> AuthResponse:
    """Create a customer account and return its authentication session."""
    supabase = get_supabase_client()
    role = "user"

    try:
        auth_data = supabase.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
                "options": {
                    "data": {
                        "full_name": payload.full_name,
                        "role": role,
                        "is_disabled": False,
                    }
                },
            }
        )
    except AuthApiError as exc:
        logger.warning("Supabase sign_up failed: %s", repr(exc))
        err_msg = getattr(exc, "message", str(exc))
        if "rate limit" in err_msg.lower() or "rate limit" in repr(exc).lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many sign-up attempts. Please wait a few minutes and try again.",
            ) from None
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg if err_msg else "Unable to register with the provided credentials.",
        ) from None

    # When Supabase has email confirmation enabled, sign_up returns a user
    # but no session. Handle this gracefully instead of returning a 401.
    user = getattr(auth_data, "user", None)
    session = getattr(auth_data, "session", None)

    if user and session is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A confirmation email has been sent. Please verify your email before signing in.",
        )

    return _build_auth_response(auth_data)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login_user(request: Request, payload: UserLoginRequest) -> AuthResponse:
    """Authenticate a customer and return an access token session."""
    supabase = get_supabase_client()

    try:
        auth_data = supabase.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except AuthApiError as exc:
        err_msg = getattr(exc, "message", str(exc))
        detail = err_msg if err_msg else "Invalid email or password."
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
        ) from None

    return _build_auth_response(auth_data)


@router.post("/refresh", response_model=AuthResponse)
@limiter.limit("20/minute")
async def refresh_session(request: Request, payload: AuthRefreshRequest) -> AuthResponse:
    """Exchange a refresh token for a new access-token session."""
    supabase = get_supabase_client()

    try:
        auth_data = supabase.auth.refresh_session(payload.refresh_token)
    except AuthApiError as exc:
        logger.warning("Supabase session refresh failed: %s", repr(exc))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
        ) from None

    return _build_auth_response(auth_data)
