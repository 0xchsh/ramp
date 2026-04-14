# Repository Guidelines

## Project Structure & Module Organization
`app/` hosts routes, layouts, and server actions; keep UI that belongs to a specific page co-located there. Cross-cutting UI sits in `components/`, shared hooks in `hooks/`, Zustand stores in `store/`, helpers in `lib/`, reusable types in `types/`, and GLSL helpers in `shaders/`. Static copy lives in `docs/`, and public assets go in `public/`. Place tests beside the code under test (`component/__tests__/Button.test.tsx`) to keep imports local.

## Build, Test, and Development Commands
- `npm run dev`: Starts the local Next server; load env from `.env.local`.
- `npm run build`: Creates the production bundle and validates RSC boundaries plus shader imports.
- `npm run start`: Runs the compiled output exactly as deployed.
- `npm run lint`: Executes ESLint via `eslint.config.mjs`; every PR must pass.

## Coding Style & Naming Conventions
Stick to TypeScript, async/await, two-space indentation, and semicolons. Components are PascalCase files whose default export matches the filename; hooks use camelCase. Tailwind v4 utilities are the preferred styling surface, so graduate repeated values into `tailwind.config.mjs`. Keep shader uniforms descriptive (`uWaveFrequency`) and avoid side effects in shader helpers.

## Testing Guidelines
No default runner ships with this repo, so introduce Vitest or Jest plus React Testing Library when adding meaningful logic. Name files `*.test.ts(x)` and keep them beside the source, covering Zustand transitions, hook edge cases, and renderer output. Until the suite exists, describe manual QA steps in PRs and always finish a change with `npm run lint` and `npm run build`.

## Commit & Pull Request Guidelines
Follow the observed history: concise imperative subjects (“Add download button to save card as PNG”) capped near 72 characters. Squash noisy WIP commits before opening a PR. Each PR should explain the why, link issues, flag env or schema changes, and include screenshots or clips for UI/shader updates. Call out follow-up work so the next agent can plan ahead.

## Agent-Specific Instructions
Before touching framework code, read the bespoke guidance in `node_modules/next/dist/docs/`; this fork diverges from public Next.js releases. Store secrets solely in `.env.local`, never in `lib/` or client bundles, and document any new env requirements in `README.md` so deployment agents can react quickly.
