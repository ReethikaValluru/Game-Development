import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type { World3D, World3DControls } from "./game/scene/world3d";
import { StoryQuest } from "./components/StoryQuest";
import { soundEngine } from "./game/audio";
import { createControls } from "./game/session";
import {
  campaignReducer,
  CHAPTERS,
  LANDSCAPES,
  newCampaign,
  objectives,
  type Campaign,
} from "./game/campaign";
import { loadCheckpoint, saveCheckpoint, type Checkpoint } from "./game/save";
import {
  DISCOVERY_TECHS,
  HISTORICAL_DILEMMAS,
  INITIAL_ACHIEVEMENTS,
  canUnlockTech,
} from "./game/rules";
import { Dialog } from "./components/Dialog";
import {
  TitleScreen,
  LANDSCAPE_ART,
  LANDSCAPE_NAMES,
} from "./components/TitleScreen";
import { PlayHUD } from "./components/PlayHUD";
const AIStudio = lazy(() =>
  import("./components/AIStudioModal").then((m) => ({
    default: m.AIStudioModal,
  })),
);
type Settings = {
  quality: "low" | "high";
  reducedMotion: boolean;
  muted: boolean;
};
function getSettings(): Settings {
  const defaults: Settings = {
    quality: "low",
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    muted: false,
  };
  try {
    const saved = JSON.parse(
      localStorage.getItem("sapiens.settings") ?? "null",
    );
    return saved
      ? {
          quality: saved.quality === "high" ? "high" : "low",
          reducedMotion:
            typeof saved.reducedMotion === "boolean"
              ? saved.reducedMotion
              : defaults.reducedMotion,
          muted: saved.muted === true,
        }
      : defaults;
  } catch {
    return defaults;
  }
}
export default function App() {
  const [s, dispatch] = useReducer(campaignReducer, undefined, () =>
    newCampaign(),
  );
  const current = useRef(s);
  useLayoutEffect(() => {
    current.current = s;
  }, [s]);
  const [screen, setScreen] = useState<"title" | "playing">("title");
  const [menu, setMenu] = useState<string | null>(null);
  const [dead, setDead] = useState(false);
  const [intro, setIntro] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState(getSettings);
  const [worldReady, setWorldReady] = useState(false);
  const [worldError, setWorldError] = useState("");
  const [sprint, setSprint] = useState(false);
  const [perf, setPerf] = useState({ fps: 0, drawCalls: 0 });
  const mount = useRef<HTMLDivElement>(null),
    world = useRef<World3D | null>(null);
  const controls = useRef<World3DControls>(createControls());
  const distanceOffset = useRef(0);
  const paused =
    screen !== "playing" || dead || !!menu || intro || s.status !== "playing";
  const pausedRef = useRef(paused);
  useLayoutEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  const closeMenu = useCallback(() => setMenu(null), []);
  const persist = useCallback(() => {
    try {
      const error = saveCheckpoint(localStorage, current.current);
      setNotice(error ?? "Checkpoint saved");
      if (!error)
        setCheckpoint({
          version: 1,
          savedAt: new Date().toISOString(),
          campaign: current.current,
        });
    } catch {
      setNotice(
        "Browser storage is unavailable. Your run continues without saves.",
      );
    }
  }, []);
  useEffect(() => {
    try {
      const loaded = loadCheckpoint(localStorage);
      setCheckpoint(loaded.checkpoint);
      if (loaded.error) setNotice(loaded.error);
    } catch {
      setNotice("Browser storage unavailable.");
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("sapiens.settings", JSON.stringify(settings));
    } catch {}
    if (soundEngine.getMuted() !== settings.muted) soundEngine.toggleMute();
    document.documentElement.dataset.motion = settings.reducedMotion
      ? "reduced"
      : "full";
  }, [settings]);
  useEffect(() => {
    if (screen !== "playing") return;
    const timer = setInterval(persist, 5000);
    const hide = () => {
      if (document.hidden) {
        setMenu("pause");
        persist();
      }
    };
    const blur = () => {
      controls.current = createControls();
      setSprint(false);
      setMenu("pause");
      persist();
    };
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", persist);
    return () => {
      clearInterval(timer);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", persist);
    };
  }, [screen, persist]);
  useEffect(() => {
    if (screen === "playing" && (menu || s.status !== "playing")) persist();
  }, [menu, s.status, screen, persist]);
  useEffect(() => {
    document.body.dataset.state =
      screen === "title" ? "title" : paused ? "paused" : "playing";
  }, [screen, paused]);
  useEffect(() => {
    if (screen !== "playing" || !mount.current) return;
    let cancelled = false,
      frame = 0,
      instance: World3D | undefined;
    setWorldReady(false);
    setWorldError("");
    import("./game/scene/world3d")
      .then(({ World3D }) => {
        if (cancelled || !mount.current) return;
        instance = new World3D(mount.current, {
          onPickup: (kind) => {
            dispatch({ type: "pickup", kind });
            soundEngine.playGather();
          },
          onJump: () => {
            dispatch({ type: "jump" });
            soundEngine.playJumpSound();
          },
          onSlide: () => {
            dispatch({ type: "slide" });
            soundEngine.playSlideSound();
          },
          onLaneChange: () => {dispatch({ type: "lane" }); soundEngine.playLaneShift();},
          onPowerUp: () => soundEngine.playPowerup(),
          onRespawn: () => {pausedRef.current=true; setMenu(null); setDead(true);soundEngine.playBeastRoar();},
          onObstacleHit: (shielded) => {
            dispatch({ type: "hit", shielded });
            soundEngine.playStumble();
          },
          onDilemmaGate: () => {
            const state = current.current;
            if (
              state.tutorialStep === 4 &&
              HISTORICAL_DILEMMAS.some(
                (d) => d.era === state.era && !state.decisionIds.includes(d.id),
              )
            )
              setMenu("council");
          },
        }, undefined, undefined, {era:current.current.era,landscape:current.current.landscape});
        world.current = instance;
        instance.setTitleMode(false);
        instance.setLandscape(current.current.landscape);
        instance.setQuality(settings.quality);
        instance.setReducedMotion(settings.reducedMotion);
        setWorldReady(true);
        let last = performance.now(),
          pending = 0,
          report = 0,
          frames = 0;
        const tick = (now: number) => {
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (instance) {
            instance.setPaused(pausedRef.current);
            instance.setTutorialMode(current.current.tutorialStep < 4);
            if (!pausedRef.current) {
              instance.update(dt, controls.current);
              pending += dt;
              frames++;
              report += dt;
              if (pending >= 0.1) {
                dispatch({
                  type: "tick",
                  dt: pending,
                  distance:
                    distanceOffset.current + instance.getDistanceTraveled(),
                  snapshot: instance.getRunnerSnapshot(),
                });
                pending = 0;
              }
              if (report >= 1) {
                setPerf({
                  fps: Math.round(frames / report),
                  drawCalls: instance.renderer.info.render.calls,
                });
                report = 0;
                frames = 0;
              }
            }
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (!cancelled)
          setWorldError(
            "The 3D renderer could not start. Enable hardware acceleration or try a WebGL-capable browser. Your checkpoint is safe.",
          );
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      instance?.dispose();
      world.current = null;
    };
  }, [epoch, screen]);
  useEffect(() => {
    soundEngine.setMusic(!paused && !settings.muted, s.era);
    return () => soundEngine.stopMusic();
  }, [paused, settings.muted, s.era]);
  useEffect(() => {
    if(!dead)return;
    const timer=setTimeout(()=>{
      distanceOffset.current=0;controls.current=createControls();
      dispatch({type:"respawn"});setEpoch(v=>v+1);setDead(false);soundEngine.playRespawn();
    },1800);
    return ()=>clearTimeout(timer);
  },[dead]);
  useLayoutEffect(() => {
    world.current?.setPaused(paused);
    if (paused) {
      controls.current = createControls();
      setSprint(false);
    }
  }, [paused]);
  useEffect(() => {
    world.current?.setQuality(settings.quality);
    world.current?.setReducedMotion(settings.reducedMotion);
  }, [settings, worldReady]);
  useEffect(() => {
    world.current?.setLandscape(s.landscape);
  }, [s.landscape, worldReady]);
  const act = useCallback((action: string) => {
    if (pausedRef.current) return;
    if (action === "left") world.current?.shiftLane(-1);
    if (action === "right") world.current?.shiftLane(1);
    if (action === "jump") world.current?.triggerJump();
    if (action === "slide") world.current?.triggerSlide();
    if (action === "sprint") {
      controls.current.sprint = !controls.current.sprint;
      setSprint(!!controls.current.sprint);
    }
  }, []);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest(
          'input,textarea,select,[contenteditable="true"]',
        )
      )
        return;
      const key = e.key.toLowerCase();
      if (
        (key === "enter" || key === " ") &&
        (e.target as HTMLElement)?.closest("button,a")
      )
        return;
      if (
        [" ", "arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key)
      )
        e.preventDefault();
      if (e.repeat) return;
      if (screen === "title") {
        if (key === "enter") start(newCampaign(s.era, s.landscape), true);
        return;
      }
      if (key === "escape" || key === "p") {
        if (!intro) setMenu((m) => (m ? null : "pause"));
        return;
      }
      if (pausedRef.current) return;
      const action = (
        {
          a: "left",
          arrowleft: "left",
          d: "right",
          arrowright: "right",
          w: "jump",
          arrowup: "jump",
          " ": "jump",
          s: "slide",
          c: "slide",
          arrowdown: "slide",
        } as Record<string, string>
      )[key];
      if (action) act(action);
      if (key === "shift") {
        controls.current.sprint = true;
        setSprint(true);
      }
      if (key === "m") setSettings((v) => ({ ...v, muted: !v.muted }));
      const panel = (
        { t: "research", x: "journal", v: "ai" } as Record<string, string>
      )[key];
      if (panel) setMenu(panel);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        controls.current.sprint = false;
        setSprint(false);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen, s.era, s.landscape, intro, act]);
  function start(value: Campaign, showIntro = false) {
    dispatch({ type: "restore", value });
    distanceOffset.current = value.stats.distanceTraveled;
    setMenu(null);
    setIntro(showIntro);
    setEpoch((v) => v + 1);
    setScreen("playing");
    setNotice("");
    soundEngine.playDrum();
  }
  function newRun() {
    if (checkpoint && checkpoint.campaign.status === "playing")
      setMenu("new-confirm");
    else start(newCampaign(s.era, s.landscape), true);
  }
  const decision = HISTORICAL_DILEMMAS.find(
    (d) => d.era === s.era && !s.decisionIds.includes(d.id),
  );
  return (
    <main className="game-app">
      {screen === "playing" && <div ref={mount} className="world-mount" />}
      {screen === "title" && (
        <TitleScreen
          era={s.era}
          landscape={s.landscape}
          onEra={(era) =>
            dispatch({ type: "restore", value: newCampaign(era, s.landscape) })
          }
          onLandscape={(landscape) =>
            dispatch({ type: "landscape", value: landscape })
          }
          onStart={newRun}
          onContinue={checkpoint ? () => start(checkpoint.campaign) : undefined}
          saveLabel={
            checkpoint
              ? new Date(checkpoint.savedAt).toLocaleString()
              : undefined
          }
          onSettings={() => setMenu("settings")}
        />
      )}
      {screen === "playing" && (
        <PlayHUD
          s={s}
          onMenu={setMenu}
          onAction={act}
          onSkip={() => dispatch({ type: "skipTutorial" })}
          sprint={sprint}
        />
      )}
      {notice && (
        <div className="save-notice" role="status">
          {notice}
        </div>
      )}
      {screen === "playing" && !worldReady && !worldError && (
        <div className="loading-world" role="status">
          Preparing the trail…
        </div>
      )}
      {worldError && (
        <Dialog title="Unable to start 3D">
          <p>{worldError}</p>
          <button
            onClick={() => {
              setWorldError("");
              setScreen("title");
            }}
          >
            Return to title
          </button>
        </Dialog>
      )}
      {intro && worldReady && (
        <Dialog title={CHAPTERS[s.era].title}>
          <div
            className="intro-art"
            style={{ backgroundImage: `url(${LANDSCAPE_ART[s.landscape]})` }}
          />
          <p className="lead">Every journey begins with a choice.</p>
          <p>
            Gather supplies, make two council decisions and research your
            chapter’s discovery. Keep the band fed for five active minutes.
            Seasons pass every minute; reading and pausing stop the clock.
          </p>
          <p>
            Keyboard: A/D move, Space jump, S slide. Touch: swipe or use the
            buttons.
          </p>
          <button className="primary" onClick={() => setIntro(false)}>
            Enter the trail / Skip intro
          </button>
        </Dialog>
      )}
      {menu === "new-confirm" && (
        <Dialog title="Start a new chapter?" onClose={closeMenu}>
          <p>This replaces the saved checkpoint when the new chapter saves.</p>
          <button
            className="primary"
            onClick={() => start(newCampaign(s.era, s.landscape), true)}
          >
            Start new chapter
          </button>
        </Dialog>
      )}
      {menu === "pause" && (
        <Dialog title="Game paused" onClose={closeMenu}>
          <p>Take a breath. The trail can wait.</p>
          <div className="button-stack">
            <button className="primary" onClick={closeMenu}>
              Resume
            </button>
            <button onClick={persist}>Save checkpoint</button>
            <button onClick={() => setMenu("settings")}>Settings</button>
            <button onClick={() => setMenu("restart-confirm")}>
              Restart chapter
            </button>
            <button
              onClick={() => {
                persist();
                setMenu(null);
                setScreen("title");
              }}
            >
              Save and return to title
            </button>
          </div>
        </Dialog>
      )}
      {menu === "restart-confirm" && (
        <Dialog title="Restart this chapter?" onClose={() => setMenu("pause")}>
          <p>Your current chapter progress will be replaced.</p>
          <button onClick={() => start(newCampaign(s.era, s.landscape), true)}>
            Restart chapter
          </button>
        </Dialog>
      )}
      {menu === "settings" && (
        <Dialog title="Settings" onClose={closeMenu}>
          <div className="settings-form">
            <label>
              Graphics quality
              <select
                value={settings.quality}
                onChange={(e) =>
                  setSettings((v) => ({
                    ...v,
                    quality: e.target.value as Settings["quality"],
                  }))
                }
              >
                <option value="low">Low — fewer details, no shadows</option>
                <option value="high">High — full scenery and shadows</option>
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) =>
                  setSettings((v) => ({
                    ...v,
                    reducedMotion: e.target.checked,
                  }))
                }
              />{" "}
              Reduced motion
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.muted}
                onChange={(e) =>
                  setSettings((v) => ({ ...v, muted: e.target.checked }))
                }
              />{" "}
              Mute audio
            </label>
            {screen === "playing" && (
              <>
                <label>
                  Landscape
                  <select
                    value={s.landscape}
                    onChange={(e) =>
                      dispatch({
                        type: "landscape",
                        value: e.target.value as Campaign["landscape"],
                      })
                    }
                  >
                    {LANDSCAPES.map((l) => (
                      <option key={l} value={l}>
                        {LANDSCAPE_NAMES[l]}
                      </option>
                    ))}
                  </select>
                </label>
                <p>
                  Measured update rate: {perf.fps} FPS · {perf.drawCalls} draw
                  calls. New scenery adopts the selected landscape as you
                  travel.
                </p>
              </>
            )}
          </div>
        </Dialog>
      )}
      {menu === "council" && (
        <Dialog title="The council" onClose={closeMenu}>
          {decision ? (
            <>
              <h3>{decision.title}</h3>
              <p>{decision.historicalContext}</p>
              <small>
                Historical fiction: these choices simplify complex and debated
                developments.
              </small>
              <div className="decision-grid">
                {decision.choices.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      dispatch({
                        type: "decision",
                        id: decision.id,
                        choice: c.id,
                      });
                      setMenu(null);
                      soundEngine.playDrum();
                    }}
                  >
                    <strong>{c.label}</strong>
                    <p>{c.description}</p>
                    <small>
                      {Object.entries(c.effects)
                        .map(([k, v]) => `${k}: ${v! > 0 ? "+" : ""}${v}`)
                        .join(" · ")}
                    </small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p>
              All decisions for this chapter are resolved. Their effects apply
              only once.
            </p>
          )}
        </Dialog>
      )}
      {menu === "research" && (
        <Dialog title="Discoveries" onClose={closeMenu}>
          <p>
            Knowledge {s.resources.knowledge} · Belief {s.resources.mythPower} ·
            Flint {s.resources.flintAndStone}
          </p>
          <div className="research-grid">
            {DISCOVERY_TECHS.filter((t) => t.era === s.era).map((t) => (
              <article key={t.id}>
                <h3>{t.name}</h3>
                <p>{t.description}</p>
                <small>
                  Cost: {t.cost.knowledge} knowledge · {t.cost.mythPower ?? 0}{" "}
                  belief · {t.cost.flintAndStone ?? 0} flint
                </small>
                <button
                  disabled={
                    s.techIds.includes(t.id) || !canUnlockTech(t, s.resources)
                  }
                  onClick={() => {
                    dispatch({ type: "research", id: t.id });
                    soundEngine.playDiscovery();
                  }}
                >
                  {s.techIds.includes(t.id) ? "Discovered" : "Research"}
                </button>
              </article>
            ))}
          </div>
        </Dialog>
      )}
      {dead && <div className="death-overlay" role="alert"><span className="eyebrow">Two impacts</span><h2>Your journey falters</h2><p>Returning to the starting point…</p><small>Your discoveries and chapter progress stay with you.</small></div>}
      {menu === "journal" && (
        <Dialog title="Journey journal" onClose={closeMenu}>
          <StoryQuest key={s.era} s={s} onDiscover={()=>{dispatch({type:"insight",id:s.era});soundEngine.playDiscovery();}} onGo={setMenu}/>
          <h3>Chapter progress</h3>
          {objectives(s).map((o) => (
            <p key={o.label}>
              {o.done ? "✓" : "○"} {o.label}: {o.progress}
            </p>
          ))}
          <h3>Achievements</h3>
          {INITIAL_ACHIEVEMENTS.filter((a) =>
            s.achievementIds.includes(a.id),
          ).map((a) => (
            <p key={a.id}>
              ✓ {a.title} — {a.description}
            </p>
          ))}
          {!s.achievementIds.length && (
            <p>Your discoveries will appear here.</p>
          )}
          <h3>History and interpretation</h3>
          <p>
            Human cooperation, farming and science emerged through varied
            developments across places and periods. The game’s era labels,
            resource values and fixed social thresholds are abstractions, not
            established universal laws. It draws inspiration from ideas
            popularized in Sapiens; it does not reproduce the book or imply
            endorsement.
          </p>
          <a
            href="https://humanorigins.si.edu/"
            target="_blank"
            rel="noreferrer"
          >
            Explore the Smithsonian Human Origins resources
          </a>
        </Dialog>
      )}
      {menu === "ai" && (
        <Suspense
          fallback={
            <Dialog title="Loading AI studio" onClose={closeMenu}>
              <p>Loading optional tools…</p>
            </Dialog>
          }
        >
          <AIStudio era={s.era} onClose={closeMenu} />
        </Suspense>
      )}
      {screen === "playing" && s.status !== "playing" && !menu && !intro && (
        <Dialog
          title={
            s.status === "victory"
              ? "Chapter complete"
              : "The band needs a new beginning"
          }
        >
          <p>
            {s.status === "victory"
              ? `You completed ${CHAPTERS[s.era].title}. Your band gathered, learned and made its choices.`
              : "Food ran out and the band could not sustain itself. Gather berries and amber, then watch food consumption each season."}
          </p>
          <p>
            {Math.floor(s.elapsed / 60)} minutes · {s.stats.pickupsCollected}{" "}
            supplies · {s.stats.score.toLocaleString()} points
          </p>
          {s.status === "victory" && CHAPTERS[s.era].next && (
            <button
              className="primary"
              onClick={() => {
                const next = newCampaign(CHAPTERS[s.era].next!, s.landscape);
                next.achievementIds = s.achievementIds;
                start(next, true);
              }}
            >
              Continue to next era
            </button>
          )}
          <button onClick={() => start(newCampaign(s.era, s.landscape), true)}>
            Replay chapter
          </button>
          <button
            onClick={() => {
              persist();
              setScreen("title");
            }}
          >
            Return to title
          </button>
        </Dialog>
      )}
    </main>
  );
}
