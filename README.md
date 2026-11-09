# Sapiens: Dawn of Humankind

An independent historical browser game built with React, Three.js and Express.
Run through a prehistoric landscape, gather supplies, make council decisions and
research discoveries. Each of three chapters targets five active minutes; menus
and pause stop the clock. Historical scenarios and numeric mechanics are fiction
and simplification, not an official adaptation or universal scientific claims.

## Play locally

Node.js 24 is recommended. npm is the canonical package manager.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:3000. No credentials are needed for gameplay or the offline
history guide. Pick a chapter and landscape, then follow the optional tutorial.

- A/D or arrows: lanes; Space/W: jump; S/C: slide; Shift: sprint.
- P/Escape: pause; M: mute; T: research; X: journal; V: AI studio.
- Touch: swipe or use the movement buttons. The Sprint button toggles sprint.
- Settings include low/high detail, reduced motion, mute and landscape switching.
- Food is consumed automatically every 60 active seconds. Gather supplies to
  sustain the band. Collisions cost food; two bumps briefly grant recovery protection.
- Finish a chapter by travelling for 300 active seconds, collecting 12 supplies,
  resolving two council decisions and researching the chapter discovery.
- Decisions and discoveries grant their effects only once. Complete a chapter to
  advance to the next era; each era begins a new resource budget. Achievements carry
  forward when advancing within the same playthrough.

## Saves

Progress saves every five seconds and on pause, backgrounding or returning to the
menu. Continue restores progression at a **fresh trail segment**; active power-ups,
lane and collision recovery reset. Distance and chapter time are preserved. Storage
is local to this browser and origin, not a cloud account. New game/restart explicitly
confirms replacement of a live checkpoint. Invalid saves show an explanation and do
not prevent a fresh game; disabled/full browser storage shows an error.

## Validation

```sh
npm run lint
npm test
npm run build
npm run test:production
npx playwright install chromium
npm run test:e2e
```

`lint` checks TypeScript. Unit tests cover rules, all three chapter completion
paths, save validation and API behavior. Browser tests cover tutorial, pause,
checkpoint continuation, restart, mobile layouts, offline guide and era progression.
The GitHub Actions workflow runs the checks on pull requests.

For constrained environments an existing Chromium binary can be selected with
`CHROMIUM_PATH=/path/to/chromium`; this uses single-process launch flags. Some
serverless Chromium builds cannot reopen contexts: run each `--grep` case in a
separate invocation in that environment. Normal CI uses standard Playwright Chromium.

## Production

```sh
npm run build
NODE_ENV=production npm start
# or
# docker build -t sapiens .
# docker run --rm -p 3000:3000 --env-file .env sapiens
```

PowerShell: set `$env:NODE_ENV='production'` before `npm start`.
The host must run Node/Express (or the Docker container); a static-only host will
not serve `/api`. Set `PORT` for the hosting platform and `APP_URL` to its exact
HTTPS origin. `/api/health` is the health check. `npm run preview` is frontend-only.
No public deployment is created by this pull request.

## Optional AI studio

AI generation is **off by default**. To enable, set `ENABLE_AI=true` and a server-side
`GEMINI_API_KEY`, then verify the configured text/image/video models in your own
provider account. See `.env.example`. Never put the key into client code or a Vite
public environment variable.

The backend validates prompts, aspect ratios, MIME signatures and image sizes,
limits requests per client, bounds concurrent provider requests, uses provider
request timeouts, caches short guide answers and returns sanitized errors. Limits
and cache are in memory for a single instance. Configure shared limits/authentication
before a large public AI-enabled launch. The game itself stays usable without AI.

Live paid provider calls were not tested with credentials. SDK contracts and the
provider documentation were inspected; account entitlement and output quality
still require live verification.

## Project notes

- [Implementation and verification](docs/IMPLEMENTATION_PLAN.md)
- [Release checklist](docs/RELEASE.md)
- [Media inventory](docs/MEDIA.md)
