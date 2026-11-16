import { useEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import type { HistoricalEra } from "../types/game";
export function AIStudioModal({
  era,
  onClose,
}: {
  era: HistoricalEra;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"text" | "image" | "video">("text");
  const [caps, setCaps] = useState({ text: false, image: false, video: false });
  const [prompt, setPrompt] = useState(""),
    [source, setSource] = useState(""),
    [result, setResult] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/capabilities", { signal: controller.signal })
      .then((r) => r.json())
      .then(setCaps)
      .catch(() => {});
    return () => {
      controller.abort();
      abort.current?.abort();
    };
  }, []);
  function changeTab(value: typeof tab) {
    abort.current?.abort();
    setBusy(false);
    setTab(value);
    setResult("");
    setError("");
  }
  async function generate() {
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError("");
    setResult("");
    const timer = setTimeout(() => controller.abort(), 95000);
    try {
      const route =
        tab === "text"
          ? "chronicler"
          : tab === "image"
            ? "generate-image"
            : "animate-video";
      const body =
        tab === "text"
          ? { userQuestion: prompt, era }
          : tab === "image"
            ? { prompt, imageSize: "1K", aspectRatio: "16:9" }
            : { prompt, imageBase64: source, aspectRatio: "16:9" };
      const res = await fetch(`/api/${route}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Request failed");
      if (abort.current !== controller) return;
      setResult(
        tab === "text"
          ? `${data.offline ? "Offline chapter guide: " : ""}${data.reply}`
          : tab === "image"
            ? data.imageUrl
            : data.videoUrl,
      );
    } catch (e) {
      if (abort.current === controller)
        setError(
          controller.signal.aborted
            ? "Request cancelled or timed out."
            : e instanceof Error
              ? e.message
              : "Request failed",
        );
    } finally {
      clearTimeout(timer);
      if (abort.current === controller) setBusy(false);
    }
  }
  return (
    <Dialog title="AI studio" onClose={onClose}>
      <p>
        Optional creative tools. Generated scenes are historical fiction, not
        archaeological evidence. The game works without AI access.
      </p>
      <div className="ai-tabs">
        {(["text", "image", "video"] as const).map((t) => (
          <button aria-pressed={tab === t} key={t} onClick={() => changeTab(t)}>
            {t === "text"
              ? "History guide"
              : t === "image"
                ? "Concept art"
                : "Animate image"}
          </button>
        ))}
      </div>
      <div className="ai-form">
        {tab !== "text" && !caps[tab] && (
          <p>
            Generation is not configured on this server. The history guide
            remains available offline.
          </p>
        )}
        <label>
          {tab === "text" ? "Your question" : "Scene description"}
          <textarea
            maxLength={tab === "text" ? 1000 : 2000}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              tab === "text"
                ? "What changed when people began farming?"
                : "A quiet prehistoric river settlement at dawn"
            }
          />
        </label>
        {tab === "video" && (
          <label>
            Reference image (PNG, JPEG or WebP, maximum 4 MB)
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setSource("");
                if (!file) return;
                if (
                  file.size > 4 * 1024 * 1024 ||
                  !["image/png", "image/jpeg", "image/webp"].includes(file.type)
                ) {
                  setError("Choose a PNG, JPEG or WebP under 4 MB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setSource(String(reader.result));
                reader.readAsDataURL(file);
              }}
            />
          </label>
        )}
        <button
          className="primary"
          disabled={
            busy ||
            !prompt.trim() ||
            (tab !== "text" && !caps[tab]) ||
            (tab === "video" && !source)
          }
          onClick={generate}
        >
          {busy ? "Working…" : tab === "text" ? "Ask guide" : "Generate"}
        </button>
        {busy && <button onClick={() => abort.current?.abort()}>Cancel</button>}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        {result &&
          (tab === "text" ? (
            <p role="status">{result}</p>
          ) : tab === "image" ? (
            <>
              <img src={result} alt="Generated historical concept art" />
              <p className="media-caption">
                AI concept art · not gameplay footage
              </p>
            </>
          ) : (
            <>
              <video src={result} controls playsInline />
              <p className="media-caption">
                AI concept animation · no spoken dialogue requested
              </p>
            </>
          ))}
      </div>
    </Dialog>
  );
}
