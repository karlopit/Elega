import logging
import time

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.security import require_admin_user
from db.database import get_supabase_admin_client

router = APIRouter(tags=["payment-qr"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

BUCKET_NAME = "product-images"
QR_PATH = "payment-qr/gcash-qr"
MAX_SIZE = 5 * 1024 * 1024
ALLOWED_TYPES = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/gif": (b"GIF87a", b"GIF89a"),
    "image/webp": b"RIFF",
}


def _has_valid_image_signature(content_type: str | None, content: bytes) -> bool:
    """Return whether the uploaded bytes match an allowed raster image type."""
    signature = ALLOWED_TYPES.get(content_type or "")
    if signature is None:
        return False
    if isinstance(signature, tuple):
        return any(content.startswith(item) for item in signature)
    if content_type == "image/webp":
        return content.startswith(signature) and content[8:12] == b"WEBP"
    return content.startswith(signature)


def _public_qr_url(storage) -> str | None:
    """Return a cache-busted public URL when the QR object exists."""
    objects = storage.from_(BUCKET_NAME).list("payment-qr")
    if not any(item.get("name") == "gcash-qr" for item in objects or []):
        return None
    public_url = storage.from_(BUCKET_NAME).get_public_url(QR_PATH)
    return f"{public_url}?v={int(time.time())}"


@router.get("/payment-qr", response_model=dict)
@limiter.limit("30/minute")
async def get_payment_qr(request: Request) -> dict[str, str | None]:
    """Return the current public GCash QR image URL, or null when none exists."""
    try:
        url = _public_qr_url(get_supabase_admin_client().storage)
        return {"image_url": url}
    except Exception as exc:
        logger.exception("Failed to read the GCash payment QR code")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The payment QR code is temporarily unavailable.",
        ) from exc


@router.post("/admin/payment-qr", response_model=dict)
@limiter.limit("10/minute")
async def upload_payment_qr(
    request: Request,
    file: UploadFile = File(...),
    admin_user_id: str = Depends(require_admin_user),
) -> dict[str, str]:
    """Validate and replace the admin-managed GCash QR image."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, or GIF image files are allowed for the payment QR code.",
        )

    content = await file.read(MAX_SIZE + 1)
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The payment QR code must be 5MB or smaller.",
        )
    if not _has_valid_image_signature(file.content_type, content):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is not a valid supported image.",
        )

    try:
        storage = get_supabase_admin_client().storage
        storage.from_(BUCKET_NAME).upload(
            path=QR_PATH,
            file=content,
            file_options={
                "content-type": file.content_type,
                "cache-control": "0",
                "upsert": "true",
            },
        )
        url = _public_qr_url(storage)
        if not url:
            raise RuntimeError("Storage upload completed without a readable public object.")
        return {"image_url": url}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to replace the GCash payment QR code")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment QR storage is unavailable. Check that the 'product-images' bucket exists and is public.",
        ) from exc


@router.delete("/admin/payment-qr", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_payment_qr(
    request: Request,
    admin_user_id: str = Depends(require_admin_user),
) -> None:
    """Delete the current GCash QR image so checkout shows the fallback state."""
    try:
        get_supabase_admin_client().storage.from_(BUCKET_NAME).remove([QR_PATH])
    except Exception as exc:
        logger.exception("Failed to delete the GCash payment QR code")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The payment QR code could not be deleted. Please try again.",
        ) from exc
