# Senay API

Client-agnostic backend for the customer website, admin CMS, and future Telegram bot.

## Stack

- **Hono** HTTP API
- **Prisma** + **Neon PostgreSQL**
- **Zod** validation

## Setup

```bash
cd server
npm install
npm run db:push
npm run db:seed
npm run dev
```

API: `http://localhost:4000`  
Health: `GET /health`

## Admin access

There is no default hardcoded admin email.

1. Set `ADMIN_SEED_EMAILS` in `server/.env` (comma-separated) and run `npm run db:seed`, **or**
2. Insert the first Super Admin via SQL / Prisma Studio, then use **System → Admins** for everyone else.

Sign-in is Google via Clerk. The account email must already exist in the `admins` table and be `ACTIVE`.

## Public API (website / Telegram)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/services` | Enabled services |
| GET | `/api/services/:slug/catalog` | Packages / products |
| POST | `/api/requests` | Submit a service request |
| GET | `/api/faqs` | Published FAQs |
| GET | `/api/blog` | Blog posts |
| GET | `/api/settings/:key` | Site settings (`restaurant`, `homepage`, `delivery`) |

## Admin API

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/admin/auth/login` | Login |
| GET | `/api/admin/overview` | KPIs |
| GET | `/api/admin/requests` | List / filter requests |
| PATCH | `/api/admin/requests/:id/status` | Update status |
| GET/PATCH | `/api/admin/services` | Manage services |
| GET/POST/PATCH/DELETE | `/api/admin/catalog` | Packages & products |
| CRUD | `/api/admin/faqs`, `/admins`, … | Content & admins |

Schema is designed from the existing frontend forms — request `payload` stores exact form fields without inventing extras.
