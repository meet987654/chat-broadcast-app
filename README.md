# Chat Broadcast App

This repository contains a simple WebSocket-based chat broadcast server and a Vite + React frontend.

Repository structure

- `chat-broadcast-app/` — TypeScript Node server (WebSocket server using `ws`).
  - `src/` — TypeScript source. Server listens on ws://localhost:8080 (fixed in code).
  - `tsconfig.json` — TypeScript config; `dist/` is used as the output directory.
- `chat-broadcast-app-fe/` — Frontend (Vite + React + TypeScript).

Prerequisites

- Node.js (16+ recommended; Node 18+ preferred). npm comes with Node.js.
- Git (optional, for cloning/commits).

Quick start (development)

Open two terminals (one for the server, one for the frontend).

1) Server

PowerShell commands (run from repo root):

```powershell
cd 'c:\Users\meetp\OneDrive\Desktop\COHORT 2\chat-app\chat-broadcast-app'
npm install
# Build & run (this project uses the `dev` script which compiles TS then runs the output)
npm run dev
```

This compiles TypeScript from `src/` to `dist/` and runs `dist/index.js`. The WebSocket server listens on ws://localhost:8080.

2) Frontend (Vite)

In a second terminal:

```powershell
cd 'c:\Users\meetp\OneDrive\Desktop\COHORT 2\chat-app\chat-broadcast-app-fe'
npm install
npm run dev
```

Vite's dev server will start (by default at `http://localhost:5173`). Open the URL in your browser. The frontend should connect to the WebSocket server at `ws://localhost:8080`.

Build & preview

- Frontend build:

```powershell
cd chat-broadcast-app-fe
npm run build
npm run preview  # serves the built app for preview
```

- Server: the server's `dev` script already compiles to `dist/`. To produce a production build you can run TypeScript build and then run Node:

```powershell
cd chat-broadcast-app
npx tsc
node dist/index.js
```

Notes and tips

- The WebSocket server's port is currently hard-coded to `8080` in `chat-broadcast-app/src/index.ts`.
- The server `dev` script runs a one-time compile then executes the compiled JS. If you want automatic restart/watch during development consider adding a dev dependency such as `nodemon` or `ts-node-dev` and a script like `dev:watch`:

  - Example (optional):
    - `npm i -D nodemon ts-node` and add script `dev:watch": "nodemon --watch 'src' --exec 'ts-node' src/index.ts"`

- Keep lockfiles (`package-lock.json` / `yarn.lock`) committed to ensure reproducible installs.

.gitignore

A `.gitignore` file has been added to the repository root to ignore `node_modules/`, build artifacts, env files, editor folders, and common OS files.

Troubleshooting

- If the frontend cannot connect to the WebSocket server, make sure the server is running and reachable at `ws://localhost:8080` and no firewall is blocking the port.
- If TypeScript compilation fails, check `tsconfig.json` and ensure `typescript` is installed.

If you'd like, I can:
- Add a `dev:watch` script for live reload on the server.
- Add a single npm workspace config so you can run `npm install` and `npm run dev --workspaces` from the repo root (or `pnpm`/`yarn` workspace setup).

Enjoy developing! If you want, I can commit this README into the repo for you.
