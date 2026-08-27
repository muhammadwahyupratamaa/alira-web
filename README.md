# Alira Frontend

Production-ready, mobile-first frontend for Alira, a personal finance tracker. Product requirements live in [`docs/PRD.md`](docs/PRD.md).

## Stack

React, Vite, strict TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, Chart.js, native Fetch API, Vitest, React Testing Library, ESLint, and Prettier.

## Requirements

- Node.js 26 (see `.nvmrc`)
- npm 11 or newer

## Environment

Copy the example environment file and adjust the API base URL for your local backend:

```sh
cp .env.example .env.local
```

`VITE_API_BASE_URL` is required. Application startup and production builds fail fast when it is missing or invalid. Local environment files are ignored by Git.

Values prefixed with `VITE_` are compiled into the browser bundle and are public. Use `VITE_API_BASE_URL` only for the non-sensitive public API base URL; never place tokens, credentials, or secrets in a Vite variable. Changing this value in a production image requires rebuilding the image.

## Install and develop

```sh
nvm use
npm ci
npm run dev
```

## Quality commands

```sh
npm run format
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:watch
npm run test:coverage
npm run build
npm run preview
```

Supply `VITE_API_BASE_URL` through `.env.local` or the shell when building and previewing.

## Production container

Build and run the multi-stage production image:

```sh
docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 -t alira-web .
docker run --rm --name alira-web -p 8080:8080 alira-web
curl --fail http://localhost:8080/healthz
```

Or use Compose for a local production-like deployment:

```sh
VITE_API_BASE_URL=http://localhost:3000/api/v1 ALIRA_WEB_PORT=8080 docker compose up --build -d
docker compose ps
docker compose down
```

The final image contains only the static bundle, Nginx, and its configuration. Nginx runs unprivileged on container port `8080`, provides `/healthz`, caches hashed assets immutably, disables long-lived caching for the application shell, and falls back to `index.html` for client-side routes. Unknown files below `/assets/` return a real `404`.

The API is not reverse-proxied. For credentialed refresh cookies, configure the backend CORS allowlist with the exact frontend origin and retain its secure `httpOnly` cookie policy. TLS and HSTS belong at the deployment reverse proxy or platform edge.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main` with read-only repository permission. It uses Node.js 26 and `npm ci`, then checks formatting, linting, strict types, tests, coverage, and the production build without requiring a backend service.

## Troubleshooting

- A build error mentioning `VITE_API_BASE_URL` means the public API URL is missing or invalid.
- A direct route returning a server `404` indicates the request is not reaching the bundled Nginx configuration.
- Refresh-cookie failures usually mean the production frontend origin is absent from the backend CORS allowlist or the cookie policy does not match the HTTPS deployment.

## Structure

```text
src/
├── app/          Application composition and providers
├── components/   Reusable UI components
├── features/     Feature/domain modules
├── hooks/        Reusable hooks
├── lib/api/      Environment-aware native Fetch client
├── routes/       Route definitions and route-level placeholders
├── schemas/      Shared validation schemas
├── styles/       Global styles and design tokens
├── test/         Shared test setup and helpers
├── types/        Shared TypeScript types
└── utils/        Framework-independent utilities
```
