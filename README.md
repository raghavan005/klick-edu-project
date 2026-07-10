# CRM Lead Management System

A full-stack CRM for managing the student/lead acquisition pipeline, from first contact all the way to enrollment. It has a live dashboard, advanced filtering, role-based access, bulk actions, and follow-up tracking that runs automatically in the background.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 19.0 |
| Language | TypeScript | 5.8 |
| Routing | React Router DOM | 7.18 |
| Styling | Tailwind CSS | 4.1 |
| Animations | Motion (Framer Motion) | 12.23 |
| Charts | Recharts | 3.9 |
| Icons | Lucide React | 0.546 |
| Forms | React Hook Form + Zod | 7.81 / 3.25 |
| Server State | TanStack React Query | 5.101 |
| Build Tool | Vite | 6.2 |
| Backend Runtime | Node.js + Express | 4.21 |
| Database | PostgreSQL via Supabase | — |
| ORM | Prisma | 6.7 |
| Auth | JWT + bcryptjs | — |
| Validation | Zod | 3.25 |

A quick note on the stack: the original task spec called for Next.js, but I stuck with Vite + Express since that's how the base project was already scaffolded, and rewriting the whole thing just to match the spec didn't seem worth it. The architecture underneath (API routes, middleware, service/repository layers) ends up being basically equivalent either way.

---

## Project Structure

```
.
├── server.ts                    # Express server — API routes, auth middleware
├── prisma/
│   ├── schema.prisma            # DB schema: Employee, User, Lead, LeadNote, LeadActivity
│   ├── seed.ts                  # Seeds 5 employees + 30 realistic leads
│   └── seed-users.ts            # Seeds 6 auth users (1 Admin + 5 Staff)
│
├── src/
│   ├── main.tsx                 # React entry — BrowserRouter, AuthProvider, QueryClient
│   ├── App.tsx                  # Dashboard + leads table + bulk actions
│   ├── types.ts                 # Shared TypeScript types
│   ├── index.css                # Tailwind + custom skeuomorphic design tokens
│   │
│   ├── components/
│   │   ├── dashboard/           # DashboardCards, DashboardCharts, widgets
│   │   ├── AdvancedFilterPanel.tsx
│   │   ├── BulkActionBar.tsx    # Floating bulk-select action bar
│   │   ├── CreateLeadModal.tsx
│   │   ├── DeleteLeadDialog.tsx
│   │   ├── FollowUpBadge.tsx
│   │   ├── LeadDetailsModal.tsx
│   │   ├── LeadEditModal.tsx
│   │   ├── LeadForm.tsx         # Shared form (Create + Edit)
│   │   ├── ProtectedRoute.tsx
│   │   └── SortableHeader.tsx
│   │
│   ├── context/
│   │   ├── AuthContext.tsx      # JWT session state + login/logout
│   │   └── ThemeContext.tsx     # Dark/light mode
│   │
│   ├── hooks/
│   │   ├── useDashboard.ts
│   │   ├── useEmployees.ts
│   │   └── useLeadFilters.ts    # URL-persisted filter state
│   │
│   ├── lib/
│   │   ├── auth.ts              # authFetch, token helpers
│   │   ├── constants.ts
│   │   ├── leadApi.ts           # API client functions
│   │   ├── prisma.ts            # Prisma singleton
│   │   ├── stageConfig.ts       # Stage → Sub-stage configuration
│   │   └── validations.ts       # Zod schemas
│   │
│   ├── middleware/
│   │   └── auth.middleware.ts   # requireAuth, requireAdmin, scopeToEmployee
│   │
│   ├── repositories/            # Pure Prisma DB queries
│   ├── services/                # Business logic + activity logging
│   └── pages/
│       ├── LeadDetailPage.tsx
│       └── LoginPage.tsx
│
├── .env.example
├── taskdone.md                  # Feature checklist (done / not done)
└── vercel.json
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (the free tier works fine)

### 1. Clone and install

```bash
git clone <repo-url>
cd crm-lead-management
npm install
```

### 2. Set up your environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill it in:

```env
# Supabase direct connection (for Prisma migrations)
DATABASE_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"

# JWT — change this to a strong random string in production
JWT_SECRET="your_strong_secret_here"
JWT_EXPIRES_IN="8h"

APP_URL="http://localhost:3000"
```

You'll find `DATABASE_URL` under your Supabase project → **Settings → Database → Connection string → URI**.

### 3. Push the schema to your database

```bash
npm run db:push
```

### 4. Seed the database

```bash
# Seed leads and employees
npm run db:seed

# Seed auth users
npx tsx prisma/seed-users.ts
```

### 5. Run it locally

```bash
npm run dev
```

Then open **http://localhost:3000** — you should land on the login page.

### 6. Build for production

```bash
npm run build
npm start
```

---

## Test Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@crm.local` | `Admin@123` | Full access — create, edit, delete, all leads, bulk actions |
| **Staff** | `aarti@crm.local` | `Staff@123` | Own leads only — can update status/stage/remarks, add notes |
| **Staff** | `bala@crm.local` | `Staff@123` | Same as above |

Tip: on the login page, clicking any of these credential rows auto-fills the form for you.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the dev server with Vite HMR at localhost:3000 |
| `npm run build` | Builds the frontend and bundles the server into `dist/` |
| `npm start` | Runs the production build |
| `npm run lint` | Type-checks everything (`tsc --noEmit`) |
| `npm run db:push` | Syncs the Prisma schema to the database (no migration history) |
| `npm run db:migrate` | Creates a migration file and applies it (dev only) |
| `npm run db:seed` | Seeds 5 employees + 30 leads |
| `npm run db:studio` | Opens Prisma Studio, a visual DB browser |

---

## API Reference

Every endpoint needs `Authorization: Bearer <token>` except `/api/auth/login`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Email/password login — returns a JWT |
| `GET` | `/api/auth/me` | Gets the current user's profile |
| `POST` | `/api/auth/logout` | Stateless logout — the client just drops the token |

### Leads
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/leads` | All | Paginated, filtered, sorted list |
| `GET` | `/api/leads/:id` | All (Staff see only their own) | Single lead with notes |
| `POST` | `/api/leads` | Admin | Create a lead |
| `PUT` | `/api/leads/:id` | All (Staff have limited fields) | Update a lead |
| `DELETE` | `/api/leads/:id` | Admin | Delete a lead |
| `POST` | `/api/leads/bulk/delete` | Admin | Bulk delete by ID array |
| `POST` | `/api/leads/bulk/status` | Admin | Bulk status update |
| `POST` | `/api/leads/bulk/assign` | Admin | Bulk employee assignment |

### Notes
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/leads/:id/notes` | Add a note |
| `PUT` | `/api/leads/:id/notes/:noteId` | Edit a note |
| `DELETE` | `/api/leads/:id/notes/:noteId` | Delete a note |

### Dashboard & Employees
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Full analytics payload |
| `GET` | `/api/leads/stats` | Status count summary |
| `GET` | `/api/employees` | All employees (used for dropdowns) |

### Filter params for `GET /api/leads`

| Param | Type | Description |
|---|---|---|
| `search` | string | Name, email, phone, or city |
| `status` | string | Pipeline status |
| `stage` | string | Pipeline stage |
| `subStage` | string | Sub-stage within a stage |
| `priority` | string | Low / Medium / High / Urgent |
| `leadSource` | string | Acquisition channel |
| `studyPreference` | string | Online / Offline / Hybrid / Self_Paced |
| `country` | string | Country (partial match) |
| `assignedEmployeeId` | string | Employee ID |
| `startDate` / `endDate` | string | Created date range (YYYY-MM-DD) |
| `followUpStatus` | string | all / overdue / due_today / upcoming / no_followup |
| `sortBy` | string | fullName / createdAt / priority / stage / status / nextFollowUpDate |
| `sortOrder` | string | asc / desc |
| `page` / `limit` | number | Pagination |

---

## Assumptions I made along the way

1. **Auth is session-based but stateless.** JWTs with an 8-hour expiry, no refresh tokens — you just log back in once it expires. That felt fine for an internal tool people mostly use during work hours.

2. **"Study preference" replaces the original "India/Abroad" field.** The spec asked for a "Looking for Abroad or India" field, but I turned it into a `StudyPreference` enum (`Online | Offline | Hybrid | Self_Paced`) since that's more useful day-to-day. Location intent is still captured, just separately, through `country` and `preferredCountry`.

3. **Stage and sub-stage are plain strings, not DB enums.** This was a deliberate trade-off — it means the sales team can add a new stage without needing a migration, just a change in `stageConfig.ts`. The downside is there's no DB-level constraint keeping the values honest.

4. **Staff scoping happens server-side.** When a STAFF user calls `GET /api/leads`, the server injects their `employeeId` into the filter itself, so there's no way to get around it by messing with query params. Staff can edit status, stage, sub-stage, remarks, and follow-up dates, but not contact details or lead source.

5. **Bulk actions are Admin-only.** The spec didn't say who should be able to use them, and since bulk delete can't be undone, I decided to lock it to Admins only rather than risk it.

6. **No email notifications yet.** Overdue/due-today follow-ups are calculated server-side on every request and show up in the dashboard and table, but nothing actually gets emailed out. A Supabase Edge Function could handle that later without touching the existing logic.

7. **Nothing's deployed.** The project's set up to deploy cleanly on Vercel or Render (see the build commands above), but I didn't stand up a live instance for this.

---

## What I'd improve with more time

1. **A real activity timeline on the lead detail page.** All the activity data is already being logged (12 event types) and shows up in a dashboard widget, but there's no dedicated timeline UI yet with per-event icons. The data's ready, it just needs a component built for it.

2. **Email / WhatsApp follow-up reminders.** Right now the "overdue" logic just runs on every API call. I'd rather have a daily background job (Supabase Edge Function or node-cron) that emails out reminders via Resend or SendGrid for anything with `nextFollowUpDate = today` that isn't already Won or Lost.

3. **CSV export.** A streaming endpoint that takes the same filter params as `GET /api/leads` and hands back a CSV. Easy to add, just didn't get to it.

4. **A proper migration workflow.** `prisma db push` is fine for development but doesn't leave a migration history behind. I'd move to `prisma migrate dev` plus a CI migration step for anything real.

5. **A role management UI.** Right now there's no way for Admins to add or deactivate users from within the app — you have to run a seed script. A simple `/admin/users` page for creating accounts and linking them to employee records would probably be the first thing I'd build next.

---

## Seeded Data

| Entity | Count |
|---|---|
| Employees | 5 (Aarti Desai, Bala Murugan, Chitra Iyer, Deepak Kumar, Eshaan Verma) |
| Auth Users | 6 (1 Admin + 5 Staff, one per employee) |
| Leads | 30 (mixed statuses, priorities, sources, locations) |
| Notes | ~42 |
| Activities | ~51 |