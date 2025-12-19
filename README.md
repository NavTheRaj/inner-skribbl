# inner-skribbl

A small monorepo skeleton for an Inner Skribbl-style game with shared TypeScript models consumed by both the client and server.

## Project structure

- `shared/` – shared TypeScript interfaces for events, payloads, and game state. Published to the workspaces as `@inner-skribbl/shared`.
- `server/` – Node-based server stub that consumes shared types to process client events and broadcast server events.
- `client/` – Client stub that consumes the shared models to handle server messages and emit typed client messages.
- `tsconfig.base.json` – baseline TypeScript settings shared by all packages.
- `eslint.config.js` / `.prettierrc` – linting and formatting configuration shared across packages.

## Getting started

1. Install dependencies from the repo root (this installs workspace dependencies too):

   ```bash
   npm install
   ```

2. Run both the client and server in watch mode:

   ```bash
   npm run dev
   ```

   The script uses `concurrently` to start `npm run dev` in both `client` and `server` workspaces using `tsx` for live TypeScript reloading.

3. Lint or format all packages from the root:

   ```bash
   npm run lint
   npm run format
   ```

   Each workspace also exposes the same commands locally (e.g., `npm run lint --workspace client`).

## Shared types

The `shared/src/types.ts` module defines:

- `ClientEvent`/`ServerEvent` string unions
- Payload maps (`ClientEventPayloads`, `ServerEventPayloads`) for each event type
- Core models such as `Player`, `GameState`, `RoundState`, `ChatMessage`, and reusable envelopes (`ClientMessage`, `ServerMessage`)

Both `client` and `server` import these definitions to ensure consistent payload shapes and state modeling.

## Development notes

- The TypeScript configs avoid emitting build output; `tsx` is used for live execution in development.
- ESLint runs with the new flat config plus `typescript-eslint` and Prettier compatibility to keep formatting conflicts out of linting.
- The repo is intended to evolve into a full client/server experience; the current stubs demonstrate how shared types keep both sides in sync.
