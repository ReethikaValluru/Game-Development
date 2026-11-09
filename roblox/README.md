# Sapiens — Roblox first-chapter starter

A separate Roblox port of the browser game's Cognitive chapter, not an HTML wrapper. **This is an engine-untested starter, not a Roblox-published release.** The web preview and its three chapters remain unchanged.

## Open and play (no plugins required)

1. Download this repository's `codex/gameplay-foundation` branch as ZIP and extract it, or download `roblox/SapiensForest.rbxlx` directly.
2. Install Roblox Studio from https://create.roblox.com/ and sign in.
3. In Studio, open `SapiensForest.rbxlx` using **File → Open from File**. Allow the local file's scripts to run if Studio asks. The world is built by the scripts when Play starts; a blank editing viewport before Play is expected.
4. Press **Play (F5)**, then **Enter the forest**. Use Play, not Run, so a player and HUD spawn.
5. A/D or Left/Right = lanes. Space/W = jump. S/Down = slide. Touch buttons and gamepad D-pad, A and B are included. Jump logs, slide under arches, dodge standing stones.
6. Gather eight supplies, answer the story choice, and reach the 900m arch. The second distinct obstacle hit kills the character and automatically restarts at 0m after about two seconds. Repeated contact with the same object counts once. Supplies and the insight survive death; each supply can be collected once per chapter attempt.
7. Stop Play before editing scripts or adding audio IDs. Changes made inside a running Play session are normally discarded.

## Add the included original audio

The starter intentionally has `0` asset IDs. It runs silently until you upload and configure audio. No invented or borrowed Roblox IDs are included.

1. Publish/save this place to your own Roblox account first so it has an experience identity (it does not need to be public).
2. Import the four `.ogg` files in `assets/` through Studio's Asset Manager or Creator Dashboard. These are original synthesized audio, not Temple Run recordings. Generated WAV equivalents are also in the downloadable starter ZIP.
3. Wait for asset processing/moderation and grant your experience permission to use the audio.
4. In Explorer, open **ReplicatedStorage → Sapiens → Config** and replace the numeric zeros:

| Config.Audio key | File |
| --- | --- |
| Music | forest-mystery.ogg |
| Pickup | pickup.ogg |
| Hit | impact.ogg |
| Discovery | discovery.ogg |

Paste the numeric asset ID only, without `rbxassetid://`. Music pauses with the run; Sound on/Muted controls music and effects. If audio does not play, check its permissions, moderation status and Studio Output.

## Saves

In a published game, server-side DataStore saves retain best distance, insight and completed-run count. In-progress supplies and exact position are session-only. Saves happen on insight, completion, every 60 seconds, exit and shutdown. Failed initial reads disable writes for that session to protect existing data. Save status appears in the HUD.

Studio saves are off by default, so local play requires no cloud setup. For persistence testing, use a separate **test experience**, enable Studio API access in its security settings, and set `Config.EnableStudioSaves = true`. Do not connect experimental Studio sessions to your production store. The starter merges monotonic values rather than implementing session locking or competitive global leaderboards.

## Required Studio acceptance checks before public release

- Play: start, lane change, jump, slide, pause/resume, story choice and 900m finish.
- One obstacle causes one hit; touching it repeatedly does not add another; a second obstacle causes death. Verify new avatar appears at 0m with progress retained.
- Wrong story choice gives explanation; correct choice grants 12 knowledge once, including after a death or rejoin.
- Run a local server with two players. Their movement, pickups, hit counters, UI and pause state must be independent.
- Test phone/tablet emulation and actual touch device; test a gamepad if supported at launch.
- Check audio after permissions and IDs are set. Verify mute, pause and respawn do not duplicate loops.
- In a test experience, exit/rejoin and verify saved insight/best distance/wins. Check Output for API errors.
- Review lighting, avatar pose, smoothness, camera framing, UI readability and performance on a low-end device. These have NOT been verified in Roblox here.

## Implementation and limits

- `src/Shared/Rules.lua`: pure gameplay rules; server-owned distance, lanes, collision checks, two-hit rule and quest rewards.
- `src/Server/World.lua`: deterministic green/black/blue forest, crystal trail, obstacles, supplies and story arches using native Parts.
- `src/Server/Main.server.lua`: validated input verbs, input throttling, server movement and per-player progress. Clients cannot submit scores, distances, damage or arbitrary quest rewards.
- `src/Client/Main.client.lua`: camera, local avatar pose, input, HUD and audio. Player avatars use their Roblox appearance; the custom web explorer mesh is not ported.
- A finite 900m first chapter, not an endless generator. Server-driven anchored movement is a simple prototype and needs network/playability review before scale. The other two chapters, custom character rig, leaderboards, monetization and optional web AI tools are not included.
- One original book-inspired teaching scenario; the explanation is an interpretation and not a direct quotation or an official adaptation. No Temple Run/Avatar assets or recordings are used.

## Develop and rebuild

Python 3.10+:

```sh
python -m pip install -r roblox/requirements-dev.txt
python roblox/tools/make_audio.py
python roblox/tools/build_place.py
python roblox/tests/test_rules.py
```

`build_place.py` uses the standard library and embeds all five scripts in `SapiensForest.rbxlx`. Run it after source edits; opening an older generated place will not include changes. `make_audio.py` uses NumPy and optionally FFmpeg to also create OGG files. The test suite runs Lua-compatible logic via Lupa, checks script syntax, XML structure and WAV headers; it is **not** a Roblox engine test. `default.project.json` is provided for developers who already use Rojo, but Rojo is optional.

## Publish after Studio tests

Use **File → Publish** in Studio, fill in the title/description/icon and follow Creator Hub's current eligibility, maturity and audience flow. Start with private/early testing. Account verification, audio upload permissions, audience selection and public release must be completed in your Roblox account. No Roblox release has been performed by this repository change.

Official references (checked 9 November 2026):
- https://create.roblox.com/docs/production/publishing/publish-games-and-places
- https://create.roblox.com/docs/audio/assets
- https://create.roblox.com/docs/cloud-services/data-stores
- https://create.roblox.com/docs/reference/engine/classes/ContextActionService
