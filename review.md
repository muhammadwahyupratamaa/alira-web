# Review command

```bash
npm run format:check && npm run lint && npm run typecheck && npm test -- --run && npm run build
```

# Frontend PRD review

## Implemented in this pass

- Dashboard now shows up to three active accounts using the existing `GET /accounts` API.
- Dashboard Quick Add opens in a dialog, focuses the amount field, refreshes related data after save, and remembers the last type/account/category during the browser session.
- Login now routes users without an active account to `/accounts/new` before the authenticated route redirects them.

## Verified

- Dashboard Quick Add dialog opens and focuses the amount field.
- Login onboarding routing is covered by the authentication flow test.
- No new backend endpoint or API contract was introduced.

## Deferred: backend API not available in this frontend repository

- Income-versus-expense bar/line chart needs a time-series dashboard endpoint; the current API only exposes one monthly summary and expense breakdown.
- Backend security, database, Swagger, Docker, CI/CD, and deployment items remain outside this frontend repository.
