<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-29 | Updated: 2026-04-29 -->

# expense-tracker-app-nextjs

## Purpose
Next.js 14 web application for expense tracking with real-time capabilities, AI-powered features, and modern responsive UI. Serves as the web frontend complement to the React Native mobile app.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules + Tailwind CSS
- **State Management**: Zustand + SWR for data fetching
- **Real-time**: WebSocket via expense_websocket service
- **Charts**: Recharts
- **Authentication**: Custom auth with Supabase

## Key Files

| File | Description |
|------|-------------|
| `package.json` | Dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration |
| `proxy.ts` | API proxy for backend communication |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages and layouts |
| `components/` | Reusable React components |
| `lib/` | Utility functions and helpers |
| `public/` | Static assets |

## App Route Structure

| Route | Description |
|-------|-------------|
| `app/(marketing)/` | Public marketing pages |
| `app/(auth)/` | Authentication (login, signup, welcome) |
| `app/(app)/dashboard/` | Main dashboard |
| `app/(app)/expenses/` | Expense list and management |
| `app/(app)/analytics/` | Charts and analytics |
| `app/(app)/budgets/` | Budget management |
| `app/(app)/categories/` | Category management |
| `app/(app)/goals/` | Savings goals |
| `app/(app)/recurring/` | Recurring expenses |
| `app/(app)/bill-split/` | Bill splitting |
| `app/(app)/notifications/` | Notification center |
| `app/(app)/settings/` | App settings |
| `app/api/` | API routes |

## For AI Agents

### Working In This Directory
- Use `pnpm install` for dependencies
- Run dev server with `pnpm dev`
- Follow ESLint rules in `eslint.config.mjs`
- Use CSS modules or Tailwind for styling

### Testing Requirements
- Run lint: `pnpm run lint`
- Verify build: `pnpm run build`

### Common Patterns
- App Router with route groups `(folder)` syntax
- Server components by default, client with `'use client'`
- SWR for client-side data fetching
- Zustand for global client state

## Dependencies

### Internal
- `backend-api-expense-springboot/` - Backend API
- `expense_websocket/` - WebSocket server for real-time updates

### External
- Next.js 14 - Web framework
- React 18 - UI library
- Recharts - Charting library
- Supabase - Database and auth

<!-- MANUAL: -->