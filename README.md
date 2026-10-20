<div align="center">

<img src="client/public/theon.svg" alt="Theon POS" width="72" />

# Theon POS

**A multi-tenant, real-time point-of-sale system for restaurants and cafés.**

QR table menus, waiter tablets, kitchen display and cashier terminal, all kept in sync over WebSockets.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](#tech-stack)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#tech-stack)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](#tech-stack)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)](#tech-stack)
[![License](https://img.shields.io/badge/license-All%20rights%20reserved-lightgrey)](LICENSE)

Built by **[Eray Pişkin](https://eraypiskin.com)**

</div>

---

## Overview

Theon POS runs an entire venue from one system: a customer scans the QR code on the table, orders from their phone, the waiter approves it, the kitchen sees it the same second, and the cashier closes the bill. Every business (tenant) is fully isolated, can run multiple branches, and gives each staff member a screen built for their role.

## Features

| Area | What it does |
| --- | --- |
| **QR menu** | Per-table mobile menu (`/menu/:tenant/:branch/:table`) with product variants, ordering and a "call waiter" button. No app install. |
| **Waiter panel** | Approve or reject QR orders, take orders at the table, get notified when food is ready. |
| **Kitchen display** | Live order queue with `PENDING → PREPARING → READY` flow and preparation timing. |
| **POS terminal** | Table map, open checks, payments and bill closing for the cashier. |
| **Notifications** | Real-time notification center with an audible bell, shared by POS, waiter and kitchen. |
| **Inventory & menu** | Categories, products, variants with fixed prices, image uploads, ordering by rank. |
| **Multi-branch** | Branches, tables and staff scoped per branch, under a single business account. |
| **Roles** | `admin`, `branch_manager`, `cashier`, `waiter`, `kitchen`, each with its own entry point. |
| **Reports** | Revenue charts, occupancy gauge and sales analytics for the owner ("God Mode" dashboard). |
| **Platform admin** | Super admin console to onboard businesses and see platform-wide stats. |

## Architecture

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   QR Menu    │   │ Waiter Panel │   │ Kitchen View │   │ POS / Admin  │
│  (customer)  │   │   (tablet)   │   │   (screen)   │   │  (desktop)   │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │      React 19 + Vite + Tailwind (client/)               │
       └──────────────┬──────────────────────┬───────────────────┘
                REST (axios)            Socket.IO rooms
                      │                (one room per tenant)
              ┌───────▼──────────────────────▼───────┐
              │   Express API  (app.js, routes/,     │
              │   controllers/, JWT middleware)      │
              └──────────────────┬───────────────────┘
                                 │ pg
                       ┌─────────▼─────────┐
                       │   PostgreSQL 15   │
                       └───────────────────┘
```

- **Multi-tenancy:** every row carries a `tenant_id`; the JWT carries the tenant and branch, and controllers scope every query by them.
- **Real-time:** clients join a Socket.IO room named after their tenant; order and notification events are broadcast to that room only.
- **Sessions:** a `password_version` claim in the JWT means changing a password logs that user out everywhere immediately.
- **Passwords:** stored as bcrypt hashes. Legacy plain-text records are upgraded transparently on the next successful login.

## Tech stack

**Backend:** Node.js, Express 4, Socket.IO 4, PostgreSQL (`pg`), JSON Web Tokens, bcrypt, Multer
**Frontend:** React 19, React Router 7, Vite, Tailwind CSS, Recharts, Lucide icons
**Infrastructure:** Docker, Docker Compose, Nginx

## Getting started

### Requirements

- Node.js 18+
- PostgreSQL 15+ (or Docker)

### 1. Configure

```bash
cp .env.example .env
# Set DB_*, and generate a JWT secret:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

To enable the platform super admin, set `SUPERADMIN_USERNAME` and a bcrypt hash:

```bash
npm install
npm run hash-password -- "your-strong-password"   # paste into SUPERADMIN_PASSWORD_HASH
```

### 2. Database

```bash
psql "$DATABASE_URL" -f schema.sql
psql "$DATABASE_URL" -f schema_orders.sql
psql "$DATABASE_URL" -f schema_inventory.sql
psql "$DATABASE_URL" -f schema_payments.sql
psql "$DATABASE_URL" -f migrations/COMPLETE_MIGRATION.sql
```

Upgrading an existing database that still has plain-text passwords:

```bash
npm run migrate:hash-passwords
```

### 3. Run

```bash
# API (http://localhost:5000 when PORT=5000)
npm install
npm run dev

# Client (http://localhost:5173)
cd client
npm install
echo "VITE_API_URL=http://localhost:5000" > .env
npm run dev
```

### Docker

```bash
docker compose up --build
```

The stack starts PostgreSQL, the API on `:5000` and the Nginx-served client on `:80`.

## Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `JWT_SECRET` | ✅ | Secret for signing tokens. The API refuses to start without it. |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ✅ | PostgreSQL connection. |
| `PORT` | | API port (default `3000`). |
| `ALLOWED_ORIGINS` | | Comma-separated CORS origins (default: local dev ports). |
| `SUPERADMIN_USERNAME` / `SUPERADMIN_PASSWORD_HASH` | | Platform super admin. Disabled when unset. |
| `VITE_API_URL` | | Client build-time API base URL (empty = same origin). |

## Project structure

```
├── app.js               # Express + Socket.IO bootstrap
├── config/              # Database pool
├── controllers/         # Request handlers (orders, products, users, admin, …)
├── middlewares/         # JWT authentication
├── routes/              # REST endpoints under /api/*
├── utils/               # Password hashing
├── scripts/             # One-off maintenance scripts
├── migrations/          # SQL migrations
├── schema*.sql          # Base schema
├── client/              # React front-end
│   └── src/pages/       # Dashboard, Pos, WaiterPanel, KitchenPanel, public/MobileMenu, …
└── docs/                # User manual (Turkish)
```

## Documentation

- [User manual (Turkish)](docs/KULLANIM_KILAVUZU.md): setup, staff roles and day-to-day operation scenarios for business owners.

## License

Copyright © 2026 [Eray Pişkin](https://eraypiskin.com). **All rights reserved.**

The source is published for viewing and evaluation only. Using, copying, modifying, hosting or distributing it requires written permission. See [LICENSE](LICENSE). For licensing or commercial inquiries, reach out via [eraypiskin.com](https://eraypiskin.com).
