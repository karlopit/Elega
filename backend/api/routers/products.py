import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.audit import record_staff_activity
from core.security import require_staff_or_admin_user
from db.database import get_supabase_admin_client, get_supabase_client
from models.schemas import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)


def _storage_error_category(error: Exception) -> str:
    """Classify common Supabase Storage failures for server logs."""
    detail = str(error).lower()
    if "bucket not found" in detail or ("bucket" in detail and "404" in detail):
        return "bucket_missing"
    if "not public" in detail or "public bucket" in detail or "access denied" in detail:
        return "bucket_private_or_inaccessible"
    if "unauthorized" in detail or "invalid jwt" in detail or "apikey" in detail:
        return "invalid_storage_credentials"
    return "storage_error"


@router.get("", response_model=list[ProductResponse])
@limiter.limit("30/minute")
async def list_products(request: Request, include_inactive: bool = False) -> list[ProductResponse]:
    """Return products available in the catalog (optionally including inactive ones)."""
    supabase = get_supabase_client()
    query = supabase.table("products").select("*")

    if not include_inactive:
        query = query.eq("is_active", True)

    response = query.order("created_at", desc=True).execute()
    return response.data


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_product(
    request: Request,
    payload: ProductCreate,
    staff_user_id: str = Depends(require_staff_or_admin_user),
) -> ProductResponse:
    """Create a product from validated product fields and return it."""
    supabase = get_supabase_admin_client()
    response = (
        supabase.table("products")
        .insert(payload.model_dump(mode="json"))
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create product.",
        )

    record_staff_activity(staff_user_id, f"Added product: {response.data[0]['name']}")
    return response.data[0]


@router.patch("/{product_id}", response_model=ProductResponse)
@limiter.limit("10/minute")
async def update_product(
    request: Request,
    product_id: UUID,
    payload: ProductUpdate,
    staff_user_id: str = Depends(require_staff_or_admin_user),
) -> ProductResponse:
    """Update a product by its identifier and return the updated product."""
    updates = payload.model_dump(mode="json", exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No product fields were provided.",
        )

    supabase = get_supabase_admin_client()
    response = (
        supabase.table("products")
        .update(updates)
        .eq("id", str(product_id))
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    action = "Disabled" if updates.get("is_active") is False else "Updated"
    record_staff_activity(staff_user_id, f"{action} product: {response.data[0]['name']}")
    return response.data[0]


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def delete_product(
    request: Request,
    product_id: UUID,
    staff_user_id: str = Depends(require_staff_or_admin_user),
) -> None:
    """Disable a product by its identifier without deleting its history."""
    supabase = get_supabase_admin_client()
    response = (
        supabase.table("products")
        .update({"is_active": False})
        .eq("id", str(product_id))
        .execute()
    )

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or could not be deleted.",
        )

    record_staff_activity(staff_user_id, f"Disabled product: {response.data[0]['name']}")


@router.post("/upload-image", response_model=dict)
@limiter.limit("5/minute")
async def upload_product_image(
    request: Request,
    file: UploadFile = File(...),
    staff_user_id: str = Depends(require_staff_or_admin_user),
) -> dict:
    """Upload an image to Supabase Storage and return its public URL."""
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP, or GIF image files are allowed.",
        )

    max_size = 5 * 1024 * 1024
    content = await file.read(max_size + 1)
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 5MB limit.",
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid4()}.{ext}"

    supabase = get_supabase_admin_client()
    try:
        supabase.storage.from_("product-images").upload(
            path=filename,
            file=content,
            file_options={"content-type": file.content_type},
        )
        public_url = supabase.storage.from_("product-images").get_public_url(filename)
        return {"image_url": public_url}
    except Exception as exc:
        logger.exception(
            "Failed to upload product image to Supabase Storage: category=%s detail=%s",
            _storage_error_category(exc),
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Product image storage is unavailable. Check that the 'product-images' bucket exists and is public.",
        ) from exc


@router.get("/{product_id}", response_model=ProductResponse)
@limiter.limit("30/minute")
async def get_product(request: Request, product_id: UUID, include_inactive: bool = False) -> ProductResponse:
    """Return one product by its identifier (optionally including inactive ones)."""
    supabase = get_supabase_client()
    query = supabase.table("products").select("*").eq("id", str(product_id))

    if not include_inactive:
        query = query.eq("is_active", True)

    response = query.limit(1).execute()

    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return response.data[0]
