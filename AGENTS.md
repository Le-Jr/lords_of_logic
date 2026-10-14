<!-- BEGIN:nextjs-agent-rules -->
# Lords of Logic — agent instructions

Dev trivia game focused on the web stack, platforms (Salesforce /
VTEX / Shopify), and software development best practices.

## Stack and conventions

- Next.js (App Router) + TypeScript.
- Server components by default. `"use client"` only when there's real
  state or interactivity (a controlled form, JS-driven animation).
  Most screens in this project don't need it.
- Plain CSS Modules, following `STYLE_GUIDE.md` as the design
  specification — read that file before writing any style or visual
  component. Create all of them using tailwind css
- Strict TypeScript. No `any` without a justifying comment.
- File and folder names in English; so is all UI copy, for now.

## Language

English is the default and first-built language for every feature.
Keep UI strings in a single, centralized place (not scattered inline
across components) — a Portuguese (pt-BR) toggle is a planned future
feature, and centralized strings are what make that swap
straightforward later. Don't build the actual language switcher yet;
just don't paint yourself into a corner by hardcoding text everywhere.

## Commands

- `npm run dev` — start the dev server.
- `npm run build` — production build (includes the TypeScript typecheck).
- `npm run lint` — ESLint.
- `npm test` — Vitest unit tests (`src/**/*.test.ts`), no services needed.
- `npm run test:db` — integration tests (`tests/db/`) against the local
  Supabase stack (`npx supabase start`, keys in `.env.local`). They create
  and delete their own users and `zz-test-` question fixtures.
- `npm run test:all` — both.

## Scope discipline

- One feature per agent session. Don't mix "build a new screen" with
  "change the architecture" with "wire up a database" in the same
  task — these are separate sessions, each with a reviewable result
  before moving to the next.
- Authentication, a database, or any backend integration only comes in
  when explicitly requested — don't get ahead of that infrastructure
  during the front-end phase.
- If a requested task clearly touches more than one area at once
  (styling, routing, data, auth), stop and confirm before proceeding
  instead of trying to deliver everything in one pass.

## Planned routes

- `/` — landing
- `/login` — OAuth 2.0 authentication, Google and Discord only (no
  traditional email/password login)
- `/play` — lobby / category selection
- `/play/[matchId]` — a specific match (single-player for now; the
  structure is already meant to accommodate future async multiplayer
  without needing to remodel routes later)
- `/ranking` — ranking

Don't create routes outside this set without confirming — the
structure was decided deliberately.

## Design

All visual work follows `STYLE_GUIDE.md`. Don't invent a palette,
typography, or component pattern outside what's specified there; if
the guide doesn't cover a case, propose an extension and document it
there once approved, rather than deciding it in isolation inside a
component.
<!-- END:nextjs-agent-rules -->
