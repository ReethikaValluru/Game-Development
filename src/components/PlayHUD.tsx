import { CHAPTERS, objectives, type Campaign } from "../game/campaign";
const tutorials = [
  "Change lane: A / D, arrows, or tap Left / Right.",
  "Jump: Space / W, swipe up, or tap Jump.",
  "Slide: S / C, swipe down, or tap Slide.",
  "Gather a glowing supply by running through it.",
];
export function PlayHUD({
  s,
  onMenu,
  onAction,
  onSkip,
  sprint,
}: {
  s: Campaign;
  onMenu: (m: string) => void;
  onAction: (a: string) => void;
  onSkip: () => void;
  sprint: boolean;
}) {
  return (
    <div className="play-hud">
      <header className="play-top">
        <div>
          <span className="eyebrow">
            {s.era} · Season {s.season}
          </span>
          <h2>{CHAPTERS[s.era].title}</h2>
        </div>
        <div className="run-score">
          <strong data-testid="score">{s.stats.score.toLocaleString()}</strong>
          <span data-testid="distance">
            {Math.floor(s.stats.distanceTraveled)} m
          </span>
          <button aria-label="Pause game" onClick={() => onMenu("pause")}>
            Ⅱ Pause
          </button>
        </div>
      </header>
      <div className="impact-meter" role="status">{s.stats.bumpCount ? '◆ ◇  One impact — next hit returns you to the start' : '◆ ◆  Two impacts before respawn'}</div>
      <div className="resource-strip">
        {[
          ["Food", Math.floor(s.resources.calories)],
          ["People", s.resources.population],
          ["Knowledge", s.resources.knowledge],
          ["Belief", s.resources.mythPower],
          ["Flint", s.resources.flintAndStone],
        ].map(([k, v]) => (
          <div key={k}>
            <small>{k}</small>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <aside className="objective-card">
        <h3>Chapter objectives</h3>
        {objectives(s).map((o) => (
          <div key={o.label} className={o.done ? "done" : ""}>
            <span>
              {o.done ? "✓" : "○"} {o.label}
            </span>
            <small>{o.progress}</small>
          </div>
        ))}
        <small>
          Next season in {Math.ceil(60 - s.seasonTime)}s · food is consumed
          automatically
        </small>
        {s.stats.activePowerUp && (
          <p>
            {s.stats.activePowerUp} · {s.stats.powerUpTimeLeft.toFixed(1)}s
          </p>
        )}
        {s.stats.isRespawning && <p>Recovering · briefly protected</p>}
      </aside>
      {s.tutorialStep < 4 && (
        <div className="tutorial" role="status">
          <strong>Learn the trail · {s.tutorialStep + 1}/4</strong>
          <p>{tutorials[s.tutorialStep]}</p>
          <small>Protected from collisions while learning.</small>
          <button onClick={onSkip}>Skip tutorial</button>
        </div>
      )}
      <footer className="play-bottom">
        <nav aria-label="Game panels">
          {[
            ["council", "Council"],
            ["research", "Research"],
            ["journal", "Journal"],
            ["ai", "AI studio"],
          ].map(([id, name]) => (
            <button key={id} onClick={() => onMenu(id)}>
              {name}
            </button>
          ))}
        </nav>
        <div className="touch-controls" aria-label="Movement controls">
          {[
            ["left", "← Left"],
            ["jump", "↑ Jump"],
            ["slide", "↓ Slide"],
            ["right", "Right →"],
          ].map(([id, name]) => (
            <button key={id} onClick={() => onAction(id)}>
              {name}
            </button>
          ))}
          <button aria-pressed={sprint} onClick={() => onAction("sprint")}>
            Sprint
          </button>
        </div>
      </footer>
    </div>
  );
}
