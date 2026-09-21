# Elega

Elega is a boutique clothing-store application with a Next.js storefront and a FastAPI backend backed by Supabase.

## Features

- Browse active products by category: men, women, and kids
- Customer registration, login, cart management, checkout, and order history
- Cash and GCash payment options
- Address coordinates captured during checkout
- Staff product management and image uploads
- Admin dashboard, account/role management, activity history, and GCash QR management
- Supabase Auth, Postgres, and Storage integration
- Rate-limited API endpoints and role-based access control

## Project structure

```text
backend/
  api/
    main.py                 FastAPI application entrypoint
    routers/                Auth, products, cart, orders, users, and admin routes
    models/                 Pydantic request/response schemas
    core/                   Configuration, security, and audit helpers
    db/                     Supabase client helpers
    requirements.txt
  supabase/migrations/      Database schema and incremental migrations

frontend/app/
  app/                      Next.js App Router pages
  components/               Shared storefront, staff, and admin components
  context/                  Store and authentication state
  lib/api.js                Frontend API client
  public/                   Static assets
  package.json
```

## Prerequisites

- Node.js 18.17 or newer
- Python 3.11 or newer
- A Supabase project

## Supabase setup

1. Create a Supabase project.
2. Apply the SQL files in `backend/supabase/migrations/` in filename order using the Supabase SQL editor or Supabase CLI.
3. Create a public Storage bucket named `product-images`. Product images and the admin-managed GCash QR code are stored in this bucket.
4. Keep the Supabase service-role key server-side only. Never expose it through the frontend or commit it to source control.

## Backend setup

From `backend/api`, create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENVIRONMENT=development
FRONTEND_ORIGINS=["http://localhost:3000"]
ADMIN_EMAILS=["admin@example.com"]
# Optional: required when bootstrapping the first admin account.
ADMIN_REGISTRATION_SECRET=change-this-value
```

Install dependencies and start the API:

```powershell
cd backend/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://localhost:8000` by default. Useful endpoints are:

- Health check: `GET /health`
- Interactive API documentation: `http://localhost:8000/docs`
- OpenAPI schema: `http://localhost:8000/openapi.json`

The first admin can be created through the frontend account setup flow, or through `POST /auth/bootstrap-admin` when no admin account exists.

## Frontend setup

From `frontend/app`, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Install dependencies and start the development server:

```powershell
cd frontend/app
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

For a production build:

```powershell
npm run build
npm run start
```

When deployed, `NEXT_PUBLIC_API_URL` must use HTTPS unless it points to localhost.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Storefront home page |
| `/shop` | Full product catalog |
| `/men`, `/women`, `/kids` | Category catalogs |
| `/account` | Registration, login, and account setup |
| `/cart` | Shopping cart and checkout |
| `/orders` | Customer order history |
| `/staff/men`, `/staff/women`, `/staff/kids` | Staff product management |
| `/admin` | Admin dashboard and payment QR management |
| `/admin/users` | Admin user and role management |
| `/admin/history` | Staff and customer activity history |

## Backend API groups

- `/auth` — registration, login, session refresh, and first-admin bootstrap
- `/products` — catalog reads, staff product CRUD, and product image uploads
- `/cart` — authenticated cart operations
- `/orders` — authenticated checkout and order history
- `/users` — admin account and role management
- `/admin` — dashboard statistics and audit history
- `/payment-qr` and `/admin/payment-qr` — public QR retrieval and admin QR management

## Development commands

Frontend commands must be run from `frontend/app`:

```powershell
npm run dev
npm run build
npm run start
npm run lint
```

Backend commands must be run from `backend/api`:

```powershell
uvicorn main:app --reload
pytest
```

There is currently no test suite checked into the repository, so validate critical flows manually: browse products, register/login, add an item to the cart, complete checkout, view orders, and verify staff/admin permissions.

## Security notes

- Do not commit `.env`, `.env.local`, Supabase keys, or service credentials.
- Use the anon key for normal Supabase client operations and reserve the service-role key for backend-only privileged operations.
- Configure `FRONTEND_ORIGINS` explicitly in production. The API refuses to start in production without it.
- Keep production frontend and API traffic on HTTPS.
