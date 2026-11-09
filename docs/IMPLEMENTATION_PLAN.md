# Sapiens implementation plan

Goal: a polished 5–10 minute prehistoric chapter that combines running,
resource gathering and meaningful historical decisions, followed by expansion
across all three eras. Preserve the current React/Three.js/Express architecture.

## 1. Reliable play sessions — first implementation
- Complete typed run defaults; clear transient state on new game/restart/title.
- Keep the Three.js world alive through turns and technology unlocks.
- Freeze simulation and inputs during pause, modal dialogs and end screens.
- Apply each keyboard action once; clear held inputs when focus is lost.
- Release scene resources when a session ends.
- Add a repeatable test command and verify type checking and production build.
Acceptance: pause leaves distance unchanged; a turn preserves the canvas and
position; restart creates a fresh track and clears score, power-ups and dialogs.

## 2. Persistence and first-run guidance
- Introduce a versioned save schema and validation with recovery for corrupt saves.
- Save resources, era, technology, quests and achievements at safe checkpoints.
- Resume at the beginning of a run segment; document this instead of pretending
  to restore exact procedural geometry.
- Teach lane changes, jump, slide, gathering and the first decision in short steps.
Acceptance: reload restores progression; invalid/old saves fail gracefully;
a first-time player can finish the tutorial with keyboard or touch.

## 3. A complete first chapter
- Define a clear chapter objective and a 5–10 minute progression target.
- Balance food use, pickup rewards, obstacle density and research costs.
- Give decisions distinct consequences and prevent repeated reward exploits.
- Connect runner state, collision/respawn rules and HUD timers to one source of truth.
- Add deterministic simulation tests and a complete victory/defeat walkthrough.
Acceptance: the chapter is winnable without AI generation or purchases; restart
and replay work; displayed timers and scores agree with the simulation.

## 4. Visual, mobile and accessibility polish
- Improve camera feedback, animation, lighting and biome differentiation.
- Measure frame timing and draw calls before introducing heavier assets.
- Add quality presets, readable mobile HUD, touch targets and reduced motion.
- Test resize, backgrounding, pointer cancellation and WebGL failure states.
Acceptance: target devices and a frame-time budget are documented and measured;
all essential controls work on touch and keyboard.

## 5. Media production and integration
- Agree a consistent prehistoric art direction and asset manifest first.
- Higgsfield: environment art and short era-transition cinematics.
- Runway: cinematic clips, narrator voice, ambience and sound effects.
- Canva: editable cover, logo, instruction cards and promotional graphics.
- Optimize generated media, add skip/mute controls, captions and static fallbacks.
- Keep promotional cinematics clearly separate from actual gameplay footage.
Acceptance: generated assets are reviewed before integration; optional videos
never block gameplay and loading stays within the agreed asset budget.
No paid generation has been started as part of milestone 1.

## 6. AI services and release
- Verify configured providers, models and SDK contracts against current docs.
- Add request validation, rate limits, bounded payloads/timeouts and useful errors.
- Keep AI optional with cached/static fallback content; keep credentials server-side.
- Review historical claims and distinguish interpretation from sourced facts.
- Add CI checks, environment/setup instructions and production smoke tests.
- Package a deployment candidate, then publish through the chosen host.
Acceptance: fresh install, tests, type check and build pass; production serves
both the game and API routes; missing credentials do not break the core game.

## Validation sequence
1. Run `npm ci`, `npm test`, `npm run lint`, `npm run build`.
2. Start `npm run dev`; test title, start, lane change, jump, slide and sprint.
3. Pause and open each dialog: distance and collision state must freeze.
4. Advance a season and unlock a technology: the scene must not be recreated.
5. Restart after collecting items: track, score and resources start fresh.
6. Run the production server and verify the root page and static asset response.
7. Verify AI requests separately with configured credentials in milestone 6.
