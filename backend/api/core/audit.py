import logging
from uuid import UUID

from db.database import get_supabase_admin_client

logger = logging.getLogger(__name__)


def record_staff_activity(staff_id: str, transaction: str) -> None:
    """Record a staff/admin action for the admin history screen."""
    try:
        get_supabase_admin_client().table("staff_activity").insert(
            {"staff_id": staff_id, "transaction": transaction}
        ).execute()
    except Exception:
        logger.exception("Failed to record staff activity")


def record_user_transaction(
    user_id: UUID,
    product_id: UUID,
    product_name: str,
    quantity: int,
) -> None:
    """Record a buyer purchase item for the admin history screen."""
    try:
        get_supabase_admin_client().table("user_transactions").insert(
            {
                "user_id": str(user_id),
                "product_id": str(product_id),
                "product_name": product_name,
                "quantity": quantity,
            }
        ).execute()
    except Exception:
        logger.exception("Failed to record user transaction")
