import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from gotrue.errors import AuthApiError
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.audit import record_staff_activity
from core.security import get_user_role, require_admin_user
from db.database import get_supabase_admin_client
from models.schemas import UserCreateRequest, UserResponse, UserRoleUpdateRequest, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


def _to_user_response(user) -> UserResponse:
    """Map a Supabase auth user object to the API's UserResponse shape."""
    metadata = user.user_metadata or {}
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=metadata.get("full_name"),
        role=get_user_role(user),
        is_disabled=bool(metadata.get("is_disabled")),
        created_at=user.created_at,
    )


def _get_auth_user_by_id(user_id: str):
    """Return one auth user from the admin list by id."""
    supabase_admin = get_supabase_admin_client()
    response = supabase_admin.auth.admin.list_users()
    users = response if isinstance(response, list) else getattr(response, "users", [])
    return next((user for user in users if user.id == user_id), None)


def _build_update_metadata(user, payload: UserUpdateRequest) -> dict:
    """Merge account metadata updates without deleting existing values."""
    metadata = dict(user.user_metadata or {})

    if payload.full_name is not None:
        metadata["full_name"] = payload.full_name
    if payload.role is not None:
        metadata["role"] = payload.role.value
    if payload.is_disabled is not None:
        metadata["is_disabled"] = payload.is_disabled

    return metadata


@router.get("", response_model=list[UserResponse])
@limiter.limit("20/minute")
async def list_users(
    request: Request,
    admin_user_id: str = Depends(require_admin_user),
) -> list[UserResponse]:
    """Return every registered account with its role, for admin management."""
    supabase_admin = get_supabase_admin_client()

    try:
        response = supabase_admin.auth.admin.list_users()
    except AuthApiError as exc:
        logger.exception("Failed to list users from Supabase Auth")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load users.",
        ) from exc

    users = response if isinstance(response, list) else getattr(response, "users", [])
    return [_to_user_response(user) for user in users]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_user(
    request: Request,
    payload: UserCreateRequest,
    admin_user_id: str = Depends(require_admin_user),
) -> UserResponse:
    """Create a managed account for staff, admin, or buyer use."""
    supabase_admin = get_supabase_admin_client()

    try:
        response = supabase_admin.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": payload.full_name,
                    "role": payload.role.value,
                    "is_disabled": False,
                },
            }
        )
    except AuthApiError as exc:
        err_msg = getattr(exc, "message", str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg if err_msg else "Unable to create account.",
        ) from None

    user = getattr(response, "user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create account.",
        )

    user_response = _to_user_response(user)
    record_staff_activity(admin_user_id, f"Created {user_response.role} account: {user_response.email}")
    return user_response


@router.patch("/{user_id}", response_model=UserResponse)
@limiter.limit("20/minute")
async def update_user(
    request: Request,
    user_id: str,
    payload: UserUpdateRequest,
    admin_user_id: str = Depends(require_admin_user),
) -> UserResponse:
    """Edit account information, role, and disabled status for a managed user."""
    if user_id == admin_user_id and payload.is_disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot disable your own account.",
        )

    existing_user = _get_auth_user_by_id(user_id)
    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    updates = {"user_metadata": _build_update_metadata(existing_user, payload)}
    if payload.email is not None:
        updates["email"] = str(payload.email)

    try:
        response = get_supabase_admin_client().auth.admin.update_user_by_id(user_id, updates)
    except AuthApiError as exc:
        err_msg = getattr(exc, "message", str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err_msg if err_msg else "Unable to update account.",
        ) from None

    user = getattr(response, "user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update account.",
        )

    user_response = _to_user_response(user)
    action = "Disabled" if user_response.is_disabled else "Updated"
    record_staff_activity(admin_user_id, f"{action} account: {user_response.email}")
    return user_response


@router.patch("/{user_id}/role", response_model=UserResponse)
@limiter.limit("20/minute")
async def update_user_role(
    request: Request,
    user_id: str,
    payload: UserRoleUpdateRequest,
    admin_user_id: str = Depends(require_admin_user),
) -> UserResponse:
    """Update a user's role. Admins cannot change their own role."""
    if user_id == admin_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role.",
        )

    existing_user = _get_auth_user_by_id(user_id)
    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    metadata = dict(existing_user.user_metadata or {})
    metadata["role"] = payload.role.value
    supabase_admin = get_supabase_admin_client()

    try:
        response = supabase_admin.auth.admin.update_user_by_id(
            user_id,
            {"user_metadata": metadata},
        )
    except AuthApiError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        ) from None

    user = getattr(response, "user", None)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update user role.",
        )

    user_response = _to_user_response(user)
    record_staff_activity(admin_user_id, f"Changed account role: {user_response.email} to {user_response.role}")
    return user_response
