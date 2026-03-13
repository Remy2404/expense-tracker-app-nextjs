# Expense Tracker Web App (Next.js)

Web dashboard for the Expense Tracker platform, built with Next.js (App Router), React, Firebase Auth, and Supabase.

## Overview

This application provides:
- Authentication (email/password + provider sign-in)
- Expense, budget, goals, and analytics views
- AI assistant integrations
- Realtime updates support (Socket relay)
- Responsive UI with modern component patterns

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Firebase (client auth)
- Supabase (data layer)
- SWR + Zustand
- Tailwind CSS + Radix UI
- Jest + Testing Library

## Project Structure

```text
app/                # App Router pages and API routes
components/         # Reusable UI and feature components
hooks/              # Custom React hooks
lib/                # Client libs, API helpers, utilities
store/              # Zustand stores
types/              # Shared TypeScript types
scripts/            # Dev tooling (relay/dev orchestration)
__tests__/          # Unit/integration tests
```

## Prerequisites

- Node.js 20+
- npm or pnpm

## Environment Setup

1. Copy `.env.example` to `.env.local`.
2. Fill all required variables.
3. Never commit `.env.local`.

## Run Locally

- Development (Next.js + relay helper): `npm run dev`
- Next.js only: `npm run dev:next`
- Relay only: `npm run dev:relay`

Default app URL: `http://localhost:3000`

## Scripts

- `npm run dev` - Start development stack
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite

## Testing

- Framework: Jest + Testing Library
- Test files are under `__tests__/`
- Run with: `npm run test`

## Security

- This app sets global security headers in `next.config.ts`.
- Firebase web API key (`NEXT_PUBLIC_FIREBASE_API_KEY`) is public by design.
- Protect data using strict Firebase/Supabase rules and least-privilege policies.
- Keep all server-side secrets out of `NEXT_PUBLIC_*` variables.

## Deployment

Recommended deployment targets:
- Vercel (web app)
- Any Node.js-compatible platform

Before deploy:
1. Set all environment variables.
2. Run lint and tests.
3. Verify auth, API, and realtime flows.
