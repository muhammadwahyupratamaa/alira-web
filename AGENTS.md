# Alira Frontend Agent Instructions

## Product Context

- Alira is a mobile-first personal finance tracker.
- `docs/PRD.md` is the product source of truth; read it completely before implementing features.
- This repository contains only the frontend application. Do not implement features outside the requested scope.

## Required Stack

- React, Vite, and TypeScript in strict mode
- Tailwind CSS and React Router
- TanStack Query for server state
- React Hook Form with Zod validation
- Chart.js
- Vitest and React Testing Library
- Native Fetch API; do not add Axios
- ESLint and Prettier

## Architecture

- Organize code by feature or domain.
- Separate reusable UI, layouts, hooks, API client code, schemas, types, and utilities.
- Use TanStack Query for server state; do not duplicate it in unnecessary global state.
- Keep components focused and split large page components.
- Read the API base URL from a Vite environment variable. Never hardcode backend URLs or financial data.

## Authentication

- Store the access token in memory only, never in `localStorage` or `sessionStorage`.
- The backend alone manages the refresh token through an `httpOnly` cookie.
- Use `credentials: "include"` for requests requiring refresh cookies.
- Make at most one controlled refresh-and-retry attempt after an access token expires; prevent refresh loops.
- Clear frontend authentication state after refresh failure or logout.
- Never log passwords or tokens.

## Financial Data

- Treat monetary API values as decimal strings.
- Do not use JavaScript floating-point arithmetic for financial calculations.
- Keep the backend as the source of truth for balances and dashboard totals.
- Format IDR only for display and respect the user timezone returned by the backend.

## UI and UX

- Build mobile-first, responsive interfaces with a minimal, premium direction inspired by Linear, Vercel, and Stripe.
- Keep Quick Add Transaction a primary, low-friction interaction.
- Provide loading, empty, success, and error states.
- Use accessible labels, keyboard navigation, visible focus, semantic HTML, and more than color alone to distinguish income from expense.

## Testing

- Add or update tests for every feature.
- Test behavior, validation, authentication state, API errors, and important user interactions; avoid tests that only assert implementation details.
- Run formatting, linting, strict typechecking, unit/component tests, and the production build.

## Git Workflow

- Never work directly on `main` after initial documentation and setup.
- Use one branch per coherent feature and Conventional Commits.
- Perform one meaningful review before merge.
- Do not commit, push, or merge unless the task explicitly authorizes it. Never force push.
- Never commit `.env` files, real credentials, build output, coverage, or dependency directories.

## Definition of Done

A feature is complete when:

- It satisfies the relevant PRD acceptance criteria.
- Responsive and accessibility states are handled.
- Relevant tests are included.
- Formatting, linting, strict typechecking, tests, and the production build pass.
- The diff contains no unrelated changes.
- No secret or token is exposed.
