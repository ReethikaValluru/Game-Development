# Implementation and verification

## 1. Reliable sessions — implemented
The world is owned by an explicit play session. React updates do not recreate it.
Pause, dialogs, backgrounding and end screens freeze simulation and clear held
inputs. Restart resets the world. Disposal releases segment geometry/materials;
completed items are pruned rather than retained indefinitely.

## 2. Persistence and tutorial — implemented
Version 1 saves use validated, allowlisted identifiers and bounded numeric values.
Checkpoint writes occur every five seconds and on pause/backgrounding. Resume
preserves progress but starts a fresh segment. The tutorial teaches lane change,
jump, slide and gathering, with collision protection and an explicit skip button.

## 3. Chapter progression — implemented
Three era-specific chapters each require 300 active seconds, 12 supplies, two
unique decisions and one technology. Food consumption is automatic every minute;
combo rewards are capped, purchases recheck affordability, and decision IDs prevent
repeated rewards. Victory offers next-era progression or replay. All three chapters
have deterministic completion tests. Exact real-player difficulty still needs
longer playtesting; simulated completion is not a usability study.

## 4. Presentation and mobile — implemented; device tuning remains
New responsive title screen, HUD, settings and accessible focus-trapped dialogs.
3D and AI code load on demand. Low detail disables shadows and dense vegetation;
reduced motion removes camera roll/FOV effects. On-screen movement, swipes,
pointer cancellation and keyboard input are supported. The HUD uses authoritative
world power-up timers, sprint energy and bump/recovery state. Initial JS is about
279 kB (87 kB gzip), versus about 893 kB before splitting. The deferred Three.js
chunk is still about 569 kB; do not treat the build warning as a runtime failure.
Target: 30 FPS on midrange mobile, 60 FPS on desktop, but no real-device claim is
made. Settings display measured update rate and draw calls for profiling.

## 5. Game media — existing assets integrated
A skippable illustrated introduction, existing biome artwork and procedural audio
are integrated. External promotional/media work was set aside at the user's
request. See MEDIA.md for provenance and the generation blockers observed earlier.

## 6. Backend and release — implemented; deployment not performed
Provider adapters use documented SDK interfaces, configurable model IDs and
bounded requests. The offline guide works without a key. API tests use injected
providers; live generations remain unverified. npm lockfile, setup instructions,
production smoke script, Dockerfile and GitHub Actions are included. A Node host
and operator-owned credentials are needed for deployment with AI enabled.

## Verification evidence
- Unit/API suite: rules, saves, duplicate rewards, three chapter completion paths,
  malformed requests, origin checks, rate limits and provider error sanitation.
- Browser tests: desktop tutorial/pause/restart/continue; mobile portrait and
  landscape; corrupt saves/offline guide; chapter victory/next era.
- TypeScript checking, production build and production HTTP smoke test.
- Browser screenshots inspected locally; serverless Chromium requires one test
  per invocation due to its context-reuse limitation. CI uses standard Chromium.

See the PR body for the exact final counts/results and any remaining limitations.
