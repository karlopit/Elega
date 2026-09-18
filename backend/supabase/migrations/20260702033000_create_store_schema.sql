create extension if not exists "pgcrypto";

create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    price numeric(12, 2) not null check (price > 0),
    currency char(3) not null default 'PHP',
    image_url text,
    category text,
    stock_quantity integer not null default 0 check (stock_quantity >= 0),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete cascade,
    quantity integer not null check (quantity between 1 and 99),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, product_id)
);

create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'pending',
    total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
    currency char(3) not null default 'PHP',
    shipping_address text not null,
    payment_option text not null default 'cash' check (payment_option in ('cash', 'gcash')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete restrict,
    quantity integer not null check (quantity between 1 and 99),
    unit_price numeric(12, 2) not null check (unit_price > 0),
    created_at timestamptz not null default now()
);

create table if not exists public.staff_activity (
    id uuid primary key default gen_random_uuid(),
    staff_id uuid not null references auth.users(id) on delete cascade,
    transaction text not null,
    created_at timestamptz not null default now()
);

create table if not exists public.user_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    product_name text not null,
    quantity integer not null check (quantity > 0),
    created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx on public.products (is_active);
create index if not exists cart_items_user_id_idx on public.cart_items (user_id);
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists staff_activity_staff_id_idx on public.staff_activity (staff_id);
create index if not exists user_transactions_user_id_idx on public.user_transactions (user_id);
