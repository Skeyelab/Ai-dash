# AI Key Dashboard

A single-user dashboard for managing and monitoring AI provider API keys (OpenAI, Anthropic, OpenRouter).

## Features

- **Authentication** – Username/password login via env vars (`BASIC_AUTH_USER`, `BASIC_AUTH_PASS`)
- **API Key Management** – Securely store, update, and delete provider API keys (AES-256-GCM encrypted at rest)
- **Key Testing** – Test each API key against the provider endpoint
- **Dashboard** – View balance/usage stats per provider with refresh support
- **Activity Log** – Recent provider snapshot history

## Tech Stack

- Next.js 15 (App Router), TypeScript
- Tailwind CSS + shadcn/ui components
- PostgreSQL + Prisma ORM
- Zod for validation
- Vitest for unit tests
- AES-256-GCM encryption for stored keys

## Quick Start (Docker Compose)

```bash
# 1. Generate a 32-byte encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 2. Copy and fill in your values
cp .env.example .env
# Edit docker-compose.yml to set ENCRYPTION_KEY

# 3. Start the stack
docker compose up --build
```

App will be available at http://localhost:3000.

Default credentials: `admin` / `changeme` (override with env vars).

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your DATABASE_URL and other values

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Set ENCRYPTION_KEY in .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

App will be available at http://localhost:3000.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | required |
| `BASIC_AUTH_USER` | Login username | `admin` |
| `BASIC_AUTH_PASS` | Login password | `changeme` |
| `ENCRYPTION_KEY` | 32-byte key (base64) for AES-256-GCM | required |

### Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run test       # Run unit tests
npm run lint       # Lint code
```

## Database Migrations

```bash
# Create and apply a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy
```

## Architecture

```
src/
  app/
    (protected)/
      dashboard/    # Provider cards with balance/usage
      settings/     # CRUD for API keys
    actions/        # Server actions (auth, credentials)
    api/auth/       # Login/logout API routes
    login/          # Login page
  components/
    ui/             # shadcn/ui components
    nav.tsx         # Navigation bar
  lib/
    auth.ts         # Session management
    credentials.ts  # Encrypted key storage
    encryption.ts   # AES-256-GCM encryption
    prisma.ts       # Prisma client singleton
    providers/      # Provider-specific API clients
    snapshots.ts    # Provider snapshot persistence
```
