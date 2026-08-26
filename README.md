# Alira Frontend

Mobile-first frontend foundation for Alira, a personal finance tracker. Product requirements live in [`docs/PRD.md`](docs/PRD.md). Business features are not implemented in this setup.

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

## Install and develop

```sh
nvm use
npm install
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
