# Database Setup — Regression Whisperer

## Overview

Regression Whisperer uses **Neon Postgres** (serverless) with **Drizzle ORM** for persistence.

## Quick Start

### 1. Create a Neon Project

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project (e.g., `regression-whisperer`)
3. Copy the connection string from the dashboard

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Neon connection string
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Migrations

```bash
npm run db:generate   # Generate migration files
npm run db:migrate    # Apply migrations
```

Or push schema directly (dev):

```bash
npm run db:push
```

### 5. Seed the Database

```bash
npm run db:seed
```

## Neon Branch Strategy

We use Neon's **branching** feature to keep demo data separate from development.

### Branches

| Branch    | Purpose                          | DATABASE_URL              |
|-----------|----------------------------------|---------------------------|
| `main`    | Development & testing            | `DATABASE_URL` in `.env`  |
| `demo`    | Seeded data for live demos       | `NEON_DEMO_URL` in `.env` |

### Creating the Demo Branch

**Option A: Via Neon Console**

1. Go to your Neon project dashboard
2. Click "Branches" → "Create branch"
3. Name it `demo`
4. Copy the connection string and set as `NEON_DEMO_URL` in `.env`

**Option B: Via Neon CLI**

```bash
# Install Neon CLI
npm install -g neonctl

# Authenticate
neonctl auth

# Create demo branch from main
neonctl branches create --project-id <your-project-id> --name demo

# Get connection string
neonctl connection-string --project-id <your-project-id> --branch demo
```

**Option C: Via Neon API**

```bash
curl -X POST "https://console.neon.tech/api/v2/projects/<project-id>/branches" \
  -H "Authorization: Bearer $NEON_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"branch": {"name": "demo"}}'
```

### Seed the Demo Branch

```bash
# Set demo URL in .env first
NEON_DEMO_URL=postgresql://...

# Seed demo branch
npm run db:seed:demo
```

### Reset Demo Branch

To reset demo data (e.g., before a presentation):

```bash
# Option 1: Re-seed (preserves branch)
npm run db:seed:demo

# Option 2: Reset branch from main via Neon console
# This creates a fresh copy of main, then re-seed
```

## Schema Overview

### Tables

- **repos** — Tracked repositories
- **prs** — Pull requests analyzed for regressions
- **regressions** — Detected performance regressions
- **matches** — Links similar historical regressions (the "whisper" feature)
- **provider_configs** — BYOK API keys (encrypted at rest, scoped per session)

### Key Relationships

```
repos ──< prs ──< regressions ──< matches >── regressions
```

## Drizzle Studio

Open the Drizzle Studio GUI to browse data:

```bash
npm run db:studio
```

## Troubleshooting

**Connection refused**
- Ensure `DATABASE_URL` uses `sslmode=require`
- Check Neon project isn't paused (free tier pauses after inactivity)

**Migration conflicts**
- Delete `drizzle/` folder and regenerate: `npm run db:generate`

**Demo data missing**
- Verify `NEON_DEMO_URL` points to the `demo` branch
- Run `npm run db:seed:demo` again
