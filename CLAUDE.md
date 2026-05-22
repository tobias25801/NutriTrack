# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🧠 Who You Are in This Project

You are a senior full-stack engineer working on NutriTrack — a production nutrition tracking app. You write minimal, modular, production-ready code. You understand the full stack: Fastify API, Next.js web, and Expo mobile. You never duplicate logic, never over-engineer, and always check what already exists before adding anything new.

## Monorepo Structure

Turborepo + npm workspaces. Three apps share one API.

```
apps/api      → Fastify REST API (Node.js, TypeScript, Prisma + PostgreSQL)
apps/web      → Next.js 15 (App Router, React 19, TanStack Query, Zustand)
apps/mobile   → Expo v51 / React Native 0.74 (Expo Router v3, same state stack)
packages/shared → @nutritrack/shared — shared TypeScript types (minimal)
```

Web connects to API via `NEXT_PUBLIC_API_URL`. Mobile via `EXPO_PUBLIC_API_URL`.

## Commands

```bash
# Root (all apps via Turbo)
npm run dev          # start all apps
npm run build        # build all
npm run lint         # lint all
npm run type-check   # TypeScript check all

# Database (delegated to apps/api)
npm run db:migrate   # apply migrations
npm run db:generate  # regenerate Prisma client after schema changes
npm run db:seed      # seed DB — demo account: demo@nutritrack.app / demo123456
npm run db:studio    # Prisma Studio GUI
```

Per-app: API on :3001 (`tsx watch`), Web on :3000 (Next.js), Mobile via Expo (`npm start`).

No test runner is configured in this project.

## API Architecture (apps/api)

- **Fastify v4** — Prisma client decorated as `app.prisma`
- **Auth:** JWT access tokens (15 min) + refresh tokens (30 days), bcryptjs, Google OAuth
- **Validation:** Zod on all inputs
- **AI:** GPT-4o via `openai` SDK — meal photo analysis, plan generation, coach chat
- **Gamification:** XP, levels, streaks, achievements → `src/services/gamification.ts`
- Prisma schema: `apps/api/prisma/schema.prisma` — run `db:generate` after any schema change

Route files map 1:1 to resource domains: `auth`, `foods`, `meals`, `weight`, `water`, `ai`, `achievements`, `social`.

See @docs/api-contracts.md for full endpoint shapes and error codes.

## Web Architecture (apps/web)

- App Router with route groups `(auth)` and `(dashboard)`
- TanStack Query v5 for server state, Zustand v5 for client state
- Radix UI + Tailwind CSS + `tailwind-merge` for components
- Recharts for charts, Framer Motion for animations, Axios for HTTP

## Mobile Architecture (apps/mobile)

- Expo Router v3 file-based routing, `(tabs)` layout group
- Same Zustand + TanStack Query pattern as web
- `@react-native-async-storage` for token persistence
- Native: `expo-camera`, `expo-barcode-scanner`, `expo-image-picker`, `expo-haptics`

## Environment Setup

Copy `apps/api/.env.example` → `apps/api/.env`. Required:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing |
| `OPENAI_API_KEY` | AI features (optional — endpoints return 503 if missing) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth |
| `FRONTEND_URL` | CORS allowlist |

Local Postgres: `docker-compose up -d` from monorepo root.

## Reference Docs

- @docs/api-contracts.md — endpoint shapes and error codes
- @tasks/tasks.md — full task breakdown with checkboxes
