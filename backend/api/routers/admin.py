from collections import defaultdict
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from core.security import require_admin_user
from db.database import get_supabase_admin_client, get_supabase_client
from models.schemas import (
    DashboardStatsResponse,
    StaffHistoryResponse,
    UserHistoryResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])
limiter = Limiter(key_func=get_remote_address)


def _auth_name_map() -> dict[str, str | None]:
    """Return auth user ids mapped to their display names."""
    response = get_supabase_admin_client().auth.admin.list_users()
    users = response if isinstance(response, list) else getattr(response, "users", [])
    return {
        user.id: (user.user_metadata or {}).get("full_name") or user.email
        for user in users
    }


@router.get("/dashboard", response_model=DashboardStatsResponse)
@limiter.limit("20/minute")
async def get_dashboard_stats(
    request: Request,
    admin_user_id: str = Depends(require_admin_user),
) -> DashboardStatsResponse:
    """Return sold quantity, available products, and top sold product rankings."""
    supabase = get_supabase_admin_client()
    products_response = supabase.table("products").select("id,name,stock_quantity,is_active").execute()
    order_items_response = supabase.table("order_items").select("product_id,quantity").execute()

    products = products_response.data or []
    order_items = order_items_response.data or []
    product_names = {product["id"]: product["name"] for product in products}
    sold_by_product: dict[str, int] = defaultdict(int)

    for item in order_items:
        sold_by_product[item["product_id"]] += int(item["quantity"])

    top_sold_products = [
        {
            "product_id": product_id,
            "name": product_names.get(product_id, "Unknown product"),
            "quantity": quantity,
        }
        for product_id, quantity in sorted(
            sold_by_product.items(),
            key=lambda pair: pair[1],
            reverse=True,
        )[:10]
    ]

    return DashboardStatsResponse(
        sold_quantity=sum(sold_by_product.values()),
        available_products=sum(
            1
            for product in products
            if product["is_active"] and int(product["stock_quantity"]) > 0
        ),
        top_sold_products=top_sold_products,
    )


@router.get("/history/staff", response_model=list[StaffHistoryResponse])
@limiter.limit("20/minute")
async def list_staff_history(
    request: Request,
    admin_user_id: str = Depends(require_admin_user),
) -> list[StaffHistoryResponse]:
    """Return staff/admin activity history for account and product actions."""
    names = _auth_name_map()
    response = (
        get_supabase_admin_client()
        .table("staff_activity")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return [
        StaffHistoryResponse(
            id=UUID(row["id"]),
            staff_id=UUID(row["staff_id"]),
            name=names.get(row["staff_id"]),
            transaction=row["transaction"],
            created_at=row.get("created_at"),
        )
        for row in response.data or []
    ]


@router.get("/history/users", response_model=list[UserHistoryResponse])
@limiter.limit("20/minute")
async def list_user_history(
    request: Request,
    admin_user_id: str = Depends(require_admin_user),
) -> list[UserHistoryResponse]:
    """Return buyer purchase history for the admin history screen."""
    names = _auth_name_map()
    response = (
        get_supabase_admin_client()
        .table("user_transactions")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )

    return [
        UserHistoryResponse(
            id=UUID(row["id"]),
            user_id=UUID(row["user_id"]),
            name=names.get(row["user_id"]),
            product=row["product_name"],
            quantity=row["quantity"],
            created_at=row.get("created_at"),
        )
        for row in response.data or []
    ]
