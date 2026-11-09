import { CHAPTERS, ERAS, LANDSCAPES } from "../game/campaign";
import type { HistoricalEra, SapiensLandscape } from "../types/game";
export const LANDSCAPE_ART = {
  river_meadow: "/assets/aistudio/image_9c8be576.png",
  wetland_oasis: "/assets/aistudio/image_883a9828.png",
  mountain_pass: "/assets/aistudio/image_6a1d8418.png",
};
export const LANDSCAPE_NAMES = {
  river_meadow: "River meadow",
  wetland_oasis: "Wetland oasis",
  mountain_pass: "Mountain pass",
};
export function TitleScreen({
  era,
  landscape,
  onEra,
  onLandscape,
  onStart,
  onContinue,
  saveLabel,
  onSettings,
}: {
  era: HistoricalEra;
  landscape: SapiensLandscape;
  onEra: (v: HistoricalEra) => void;
  onLandscape: (v: SapiensLandscape) => void;
  onStart: () => void;
  onContinue?: () => void;
  saveLabel?: string;
  onSettings: () => void;
}) {
  return (
    <section
      className="title-screen"
      style={{
        backgroundImage: `linear-gradient(90deg,rgba(12,20,17,.97),rgba(12,20,17,.5)),url(${LANDSCAPE_ART[landscape]})`,
      }}
    >
      <div className="title-copy">
        <p className="eyebrow">A journey through human history</p>
        <h1>
          SAPIENS<span>Dawn of Humankind</span>
        </h1>
        <p className="lead">
          Run the wilderness.
          <br />
          Gather a future.
          <br />
          Choose your story.
        </p>
        <p>
          Guide your band through a five-minute chapter of discovery, survival
          and shared decisions.
        </p>
        <div className="title-actions">
          {onContinue && (
            <button className="primary" onClick={onContinue}>
              Continue checkpoint
            </button>
          )}
          <button className={onContinue ? "" : "primary"} onClick={onStart}>
            Begin new chapter
          </button>
          <button onClick={onSettings}>Settings</button>
        </div>
        {saveLabel && <small>{saveLabel} · resumes on a fresh trail</small>}
        <p className="fineprint">
          Independent historical fiction. Game mechanics simplify debated ideas;
          they are not scientific measurements or an official book adaptation.
        </p>
      </div>
      <div className="title-select">
        <p className="eyebrow">Choose your chapter</p>
        <div className="chapter-options">
          {ERAS.map((e, i) => (
            <button key={e} aria-pressed={era === e} onClick={() => onEra(e)}>
              <span>0{i + 1}</span>
              <strong>{CHAPTERS[e].title}</strong>
              <small>{e}</small>
            </button>
          ))}
        </div>
        <p className="eyebrow">Choose your landscape</p>
        <div className="landscape-options">
          {LANDSCAPES.map((l) => (
            <button
              key={l}
              aria-pressed={landscape === l}
              onClick={() => onLandscape(l)}
            >
              <img src={LANDSCAPE_ART[l]} alt="" />
              <strong>{LANDSCAPE_NAMES[l]}</strong>
            </button>
          ))}
        </div>
        <p className="fineprint">
          Keyboard or touch · No account required · Optional AI tools
        </p>
      </div>
    </section>
  );
}
