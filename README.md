# Sapiens: Dawn of Humankind

A React + Three.js historical runner with resource management, discoveries,
quests and an optional AI studio. Express serves the game and AI endpoints.

## Run locally

Use Node.js 22.12+ (Node.js 24 recommended) and npm. The checked-in
`package-lock.json` is the canonical dependency lockfile.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:3000. Configure `GEMINI_API_KEY` in `.env` only if using
the AI endpoints. The core game does not require it. Provider/model compatibility
and live AI generation still need separate verification.

## Checks and production

```sh
npm test
npm run lint
npm run build
NODE_ENV=production npm start
```

`lint` runs TypeScript checking. The production server serves `dist` plus the
API routes; `npm run preview` only previews the frontend. PowerShell users can
set `$env:NODE_ENV='production'` before running `npm start`.

## Controls

- A/D or left/right arrows: change lane once per press.
- W, up arrow or Space: jump. S, down arrow or C: slide.
- Shift: sprint. P/Escape: pause/resume. M: mute.
- X: codex. T: technologies. V: AI studio. J: achievements.
- Touch: swipe or use the on-screen controls.

Pause, dialogs and end screens freeze gameplay. Losing window focus pauses the
run and releases held controls. Restart begins a fresh Cognitive-era run in the
selected landscape; achievements are currently scoped to the run. Save/load is
planned and progress does not yet survive a reload.

See [the implementation plan](docs/IMPLEMENTATION_PLAN.md) for the six milestones
and acceptance criteria.
