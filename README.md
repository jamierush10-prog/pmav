# PMAV Material Planner

React + TypeScript + Firebase app for managing SPMIG master data, MRC recipes, projects, and generating project rollups.

## Setup

1. Copy `.env.example` to `.env` and fill in Firebase config (Firestore enabled).
2. Install deps: `npm install`.
3. Run dev server: `npm run dev`.
4. Run tests (pure function coverage): `npm test`.

## Notes

- Firestore collections used: `spmigs`, `mrcs`, `projects`, `projectOverrides`.
- Rollup logic lives in `src/utils/computeProjectRollup.ts` with tests in `src/utils/computeProjectRollup.test.ts`.
- UI routes: SPMIGs (`/`), MRCs (`/mrcs`), Projects (`/projects`), Project Rollup (`/rollup`).
- Auth: app auto-signs in anonymously on load (`src/auth/useAnonymousAuth.ts`) to satisfy rules requiring `request.auth != null`.
