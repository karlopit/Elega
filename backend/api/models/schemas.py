from datetime import datetime
from decimal import Decimal
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class UserRole(str, Enum):
    """Supported account roles."""

    admin = "admin"
    staff = "staff"
    user = "user"


class UserRegisterRequest(BaseModel):
    """Request body for creating a customer account."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)


class UserLoginRequest(BaseModel):
    """Request body for logging a customer in."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class BootstrapStatusResponse(BaseModel):
    """Response showing whether the first admin setup is still available."""

    needs_admin: bool


class BootstrapAdminRequest(UserRegisterRequest):
    """Request body for creating the first admin account once."""

    setup_secret: str | None = Field(default=None, max_length=256)

    @field_validator("setup_secret", mode="before")
    @classmethod
    def normalize_setup_secret(cls, value: str | None) -> str | None:
        """Treat a blank setup secret as omitted."""
        if isinstance(value, str) and not value.strip():
            return None
        return value


class AuthResponse(BaseModel):
    """Authentication response returned after registration or login."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int | None = None
    refresh_token: str | None = None
    user_id: str
    email: EmailStr
    role: UserRole


class UserResponse(BaseModel):
    """Account data returned to admins for user management."""

    id: str
    email: EmailStr
    full_name: str | None = None
    role: UserRole
    is_disabled: bool = False
    created_at: datetime | None = None


class UserRoleUpdateRequest(BaseModel):
    """Request body for changing a user's role."""

    role: UserRole


class UserCreateRequest(BaseModel):
    """Request body for an admin creating a managed account directly."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    role: UserRole


class UserUpdateRequest(BaseModel):
    """Request body for editing a managed account."""

    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    role: UserRole | None = None
    is_disabled: bool | None = None


class ProductBase(BaseModel):
    """Shared product fields."""

    name: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    price: Decimal = Field(gt=0, decimal_places=2)
    currency: str = Field(default="PHP", min_length=3, max_length=3)
    image_url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=80)
    stock_quantity: int = Field(ge=0)
    is_active: bool = True

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        """Normalize currency codes to uppercase ISO-style values."""
        return value.upper()


class ProductCreate(ProductBase):
    """Request body for creating a product."""


class ProductUpdate(BaseModel):
    """Request body for updating product fields."""

    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    price: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    image_url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=80)
    stock_quantity: int | None = Field(default=None, ge=0)
    is_active: bool | None = None

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str | None) -> str | None:
        """Normalize currency codes to uppercase ISO-style values."""
        return value.upper() if value else value


class ProductResponse(ProductBase):
    """Product data returned by the API."""

    id: UUID
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CartItemRequest(BaseModel):
    """Request body for adding or updating an item in a cart."""

    product_id: UUID
    quantity: int = Field(ge=1, le=99)


class CartItemResponse(BaseModel):
    """Cart item data returned by the API."""

    id: UUID
    user_id: UUID
    product_id: UUID
    quantity: int
    created_at: datetime | None = None
    updated_at: datetime | None = None


class CartResponse(BaseModel):
    """Cart data returned by the API."""

    items: list[CartItemResponse]


class OrderStatus(str, Enum):
    """Supported order statuses."""

    pending = "pending"
    paid = "paid"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentOption(str, Enum):
    """Supported checkout payment options."""

    cash = "cash"
    gcash = "gcash"


class OrderItemRequest(BaseModel):
    """Request body for one product in an order."""

    product_id: UUID
    quantity: int = Field(ge=1, le=99)


class OrderCreateRequest(BaseModel):
    """Request body for creating an order."""

    user_id: UUID
    items: list[OrderItemRequest] = Field(min_length=1)
    shipping_address: str = Field(min_length=10, max_length=500)
    payment_option: PaymentOption

    @model_validator(mode="after")
    def validate_unique_products(self) -> "OrderCreateRequest":
        """Ensure each product appears only once in an order request."""
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Each product can only appear once per order.")
        return self


class OrderResponse(BaseModel):
    """Order data returned by the API."""

    id: UUID
    user_id: UUID
    status: OrderStatus
    total_amount: Decimal = Field(ge=0, decimal_places=2)
    currency: str = Field(min_length=3, max_length=3)
    shipping_address: str
    payment_option: PaymentOption | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class StaffHistoryResponse(BaseModel):
    """Staff action history returned to admins."""

    id: UUID
    staff_id: UUID
    name: str | None = None
    transaction: str
    created_at: datetime | None = None


class UserHistoryResponse(BaseModel):
    """Buyer transaction history returned to admins."""

    id: UUID
    user_id: UUID
    name: str | None = None
    product: str
    quantity: int
    created_at: datetime | None = None


class DashboardStatsResponse(BaseModel):
    """Summary figures and rankings shown on the admin dashboard."""

    sold_quantity: int
    available_products: int
    top_sold_products: list[dict]
