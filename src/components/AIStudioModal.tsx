import React, { useState, useRef } from 'react';
import { HistoricalEra } from '../types/game';

interface AIStudioModalProps {
  era: HistoricalEra;
  onClose: () => void;
}

export const AIStudioModal: React.FC<AIStudioModalProps> = ({
  era,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'chronicler'>('image');

  // --- Image Generation State (gemini-3-pro-image-preview) ---
  const [imagePrompt, setImagePrompt] = useState(
    'The 40,000-year-old Lion-Man of Hohlenstein-Stadel mammoth ivory totem in a torchlit Paleolithic cave with charcoal handprints'
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageAspect, setImageAspect] = useState<'16:9' | '1:1' | '4:3' | '9:16'>('16:9');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // --- Video Animation State (gemini-omni-1.2-flash) ---
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoAspect, setVideoAspect] = useState<'16:9' | '9:16'>('16:9');
  const [videoPrompt, setVideoPrompt] = useState(
    'Animate this historical scene with living atmospheric winds, flickering torches, and gentle cinematic camera drift.'
  );
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Chronicler Chat State (gemini-3.8-flash) ---
  const [chroniclerQuestion, setChroniclerQuestion] = useState('');
  const [chroniclerHistory, setChroniclerHistory] = useState<
    Array<{ q: string; a: string }>
  >([
    {
      q: 'Why did Sapiens conquer the Neanderthals if Neanderthals were physically stronger?',
      a: 'Physical prowess matters in a one-on-one duel, but human history is decided by collective coordination. Neanderthals could cooperate in bands of only 20-30 intimate relatives. Sapiens, having acquired the Cognitive Revolution, could invent shared myths—guardian spirits, tribal ancestors, and sacred totems. This enabled 500 Sapiens strangers to march together in unison, overwhelming any smaller band of hominids.',
    },
  ]);
  const [isAskingChronicler, setIsAskingChronicler] = useState(false);

  // Historical Presets for quick generation
  const presets = [
    {
      title: 'Lion-Man of Stadel',
      prompt: 'A Paleolithic master carver sculpting the half-human half-lion ivory totem in a torchlit cave, authentic prehistoric artifacts, Sapiens chapter 2.',
    },
    {
      title: 'Cave of Hands (Chauvet)',
      prompt: 'Ancient rock shelter wall covered in red ochre negative hand stencils and painted galloping steppe mammoths, dramatic firelight.',
    },
    {
      title: 'Göbekli Tepe Sanctuary',
      prompt: 'Pre-agricultural hunter-gatherers erecting massive 5-meter T-shaped limestone megaliths carved with foxes and scorpions in southeastern Anatolia.',
    },
    {
      title: 'The Wheat Trap',
      prompt: 'Early Neolithic farmers hunched over emmer wheat fields along the Fertile Crescent, mud-brick granaries, dawn mist, history\'s biggest fraud.',
    },
    {
      title: 'Code of Hammurabi',
      prompt: 'Ancient Babylonian scribes inscribing cuneiform laws into a towering diorite stele under the desert sun, imagined legal order.',
    },
    {
      title: 'Discovery of Ignorance',
      prompt: 'Early modern navigators and astronomers unrolling blank world maps and gazing through brass telescopes at uncharted constellations, Ignoramus.',
    },
  ];

  // Handler: Generate High-Quality Image (gemini-3-pro-image-preview)
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          imageSize: imageSize,
          aspectRatio: imageAspect,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate image.');
      }

      setGeneratedImage(data.imageUrl);
      // Automatically make available for video animation
      if (!videoSourceImage) {
        setVideoSourceImage(data.imageUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating image';
      setImageError(msg);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handler: Animate Image to Video (gemini-omni-1.2-flash)
  const handleAnimateVideo = async () => {
    if (!videoSourceImage) {
      setVideoError('Please upload an image or generate one first.');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(null);

    try {
      const res = await fetch('/api/animate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: videoSourceImage,
          prompt: videoPrompt,
          aspectRatio: videoAspect,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to animate video.');
      }

      setGeneratedVideo(data.videoUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error generating video';
      setVideoError(msg);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Handler: Upload Photo for Video
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setVideoSourceImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler: Ask Chronicler
  const handleAskChronicler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chroniclerQuestion.trim()) return;

    const q = chroniclerQuestion;
    setChroniclerQuestion('');
    setIsAskingChronicler(true);

    try {
      const res = await fetch('/api/chronicler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuestion: q,
          era,
        }),
      });

      const data = await res.json();
      const a = data.reply || 'The scrolls of prehistory remain silent.';
      setChroniclerHistory(prev => [...prev, { q, a }]);
    } catch {
      setChroniclerHistory(prev => [
        ...prev,
        {
          q,
          a: 'The chronicler was momentarily separated by the sands of time. Please try again.',
        },
      ]);
    } finally {
      setIsAskingChronicler(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85">
      <div className="bg-stone-900 border border-stone-700 text-stone-100 max-w-4xl w-full rounded-xl shadow-2xl p-4 sm:p-6 relative overflow-hidden flex flex-col h-[90vh]">
        {/* Header with Navigation Tabs */}
        <div className="flex flex-wrap justify-between items-center border-b border-stone-800 pb-3 gap-2 shrink-0">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-amber-500 font-bold">
              AI Archaeological Studio
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100">
              Visualizing Humankind's History
            </h2>
          </div>

          {/* Navigation Pills */}
          <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('image')}
              className={`px-3 py-1.5 rounded transition cursor-pointer ${
                activeTab === 'image'
                  ? 'bg-amber-600 text-stone-950 font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Image Studio (1K/2K/4K)
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded transition cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Animate Video (Omni Flash)
            </button>
            <button
              onClick={() => setActiveTab('chronicler')}
              className={`px-3 py-1.5 rounded transition cursor-pointer ${
                activeTab === 'chronicler'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Harari Chronicler
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab 1: Image Generation (gemini-3-pro-image-preview) */}
        {activeTab === 'image' && (
          <div className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Controls Column */}
              <div className="space-y-3.5 bg-stone-950/70 p-4 rounded-lg border border-stone-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold">Model: gemini-3-pro-image-preview</span>
                  <span className="text-stone-400">High-Fidelity Historical Art</span>
                </div>

                {/* Image Size Selection Affordance (1K, 2K, 4K) */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1.5 font-semibold">
                    Resolution / Size Affordance:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1K', '2K', '4K'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setImageSize(size)}
                        className={`py-2 px-3 text-xs font-mono font-bold rounded border transition cursor-pointer ${
                          imageSize === size
                            ? 'bg-amber-600 border-amber-500 text-stone-950'
                            : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600'
                        }`}
                      >
                        {size} Resolution
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selection */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1.5 font-semibold">
                    Aspect Ratio:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['16:9', '1:1', '4:3', '9:16'] as const).map((aspect) => (
                      <button
                        key={aspect}
                        type="button"
                        onClick={() => setImageAspect(aspect)}
                        className={`py-1.5 text-xs font-mono rounded border transition cursor-pointer ${
                          imageAspect === aspect
                            ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                            : 'bg-stone-900 border-stone-800 text-stone-400'
                        }`}
                      >
                        {aspect}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Harari Presets */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1 font-semibold">
                    Historical Chapters from Sapiens:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImagePrompt(p.prompt)}
                        className="text-[10px] font-mono px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500 rounded text-stone-300 transition cursor-pointer"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Textarea */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1 font-semibold">
                    Custom Prompt:
                  </label>
                  <textarea
                    rows={3}
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded p-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 font-sans"
                    placeholder="Describe the prehistoric or historical scene..."
                  />
                </div>

                {/* Generate Button */}
                <button
                  disabled={isGeneratingImage || !imagePrompt.trim()}
                  onClick={handleGenerateImage}
                  className={`w-full py-2.5 px-4 text-xs font-bold uppercase rounded transition cursor-pointer flex items-center justify-center gap-2 ${
                    isGeneratingImage
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-stone-950 active:scale-95 shadow-lg'
                  }`}
                >
                  {isGeneratingImage ? (
                    <span>Synthesizing {imageSize} Historical Image...</span>
                  ) : (
                    <span>Generate {imageSize} Archaeological Artifact</span>
                  )}
                </button>

                {imageError && (
                  <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2 rounded border border-rose-900">
                    {imageError}
                  </p>
                )}
              </div>

              {/* Preview Column */}
              <div className="bg-stone-950/70 p-4 rounded-lg border border-stone-800 flex flex-col justify-between">
                <div className="text-[11px] font-mono text-stone-400 mb-2 flex justify-between">
                  <span>Output Preview</span>
                  {generatedImage && <span className="text-emerald-400">{imageSize} · {imageAspect}</span>}
                </div>

                <div className="flex-1 min-h-[260px] bg-stone-900 rounded-lg flex items-center justify-center overflow-hidden border border-stone-800">
                  {isGeneratingImage ? (
                    <div className="text-center p-6 space-y-2">
                      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-mono text-amber-300">
                        Synthesizing with gemini-3-pro-image-preview...
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Resolving {imageSize} archaeological details
                      </p>
                    </div>
                  ) : generatedImage ? (
                    <img
                      src={generatedImage}
                      alt="Generated Sapiens Artifact"
                      className="max-h-full max-w-full object-contain rounded"
                    />
                  ) : (
                    <div className="text-center p-6 text-stone-500 text-xs font-mono">
                      No image generated yet. Choose a preset or prompt and click Generate.
                    </div>
                  )}
                </div>

                {generatedImage && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setVideoSourceImage(generatedImage);
                        setActiveTab('video');
                      }}
                      className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Animate into Video with Omni Flash</span>
                      <span>→</span>
                    </button>
                    <a
                      href={generatedImage}
                      download={`sapiens-artifact-${imageSize}.png`}
                      className="py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded transition flex items-center justify-center cursor-pointer"
                    >
                      Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Animate Video (gemini-omni-1.2-flash via Interactions API) */}
        {activeTab === 'video' && (
          <div className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Controls Column */}
              <div className="space-y-3.5 bg-stone-950/70 p-4 rounded-lg border border-stone-800">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-purple-400 font-bold">Model: gemini-omni-1.2-flash</span>
                  <span className="text-stone-400">Interactions API</span>
                </div>

                {/* Aspect Ratio Selection (Mandatory 16:9 or 9:16) */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1.5 font-semibold">
                    Target Video Aspect Ratio:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVideoAspect('16:9')}
                      className={`py-2 px-3 text-xs font-mono font-bold rounded border transition cursor-pointer flex items-center justify-center gap-2 ${
                        videoAspect === '16:9'
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600'
                      }`}
                    >
                      <span>16:9 Landscape</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoAspect('9:16')}
                      className={`py-2 px-3 text-xs font-mono font-bold rounded border transition cursor-pointer flex items-center justify-center gap-2 ${
                        videoAspect === '9:16'
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600'
                      }`}
                    >
                      <span>9:16 Portrait</span>
                    </button>
                  </div>
                </div>

                {/* Photo Upload or Generated Selection */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1.5 font-semibold">
                    Source Photo / Frame:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-mono text-stone-200 rounded transition cursor-pointer"
                    >
                      Upload Photo
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {videoSourceImage && (
                      <span className="text-xs text-emerald-400 font-mono">
                        Frame loaded
                      </span>
                    )}
                  </div>
                </div>

                {/* Motion Prompt */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-stone-400 mb-1 font-semibold">
                    Motion Description:
                  </label>
                  <textarea
                    rows={3}
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 rounded p-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-purple-500 font-sans"
                    placeholder="Describe how the prehistoric elements should move..."
                  />
                </div>

                {/* Animate Action Button */}
                <button
                  disabled={isGeneratingVideo || !videoSourceImage}
                  onClick={handleAnimateVideo}
                  className={`w-full py-2.5 px-4 text-xs font-bold uppercase rounded transition cursor-pointer flex items-center justify-center gap-2 ${
                    isGeneratingVideo || !videoSourceImage
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 shadow-lg'
                  }`}
                >
                  {isGeneratingVideo ? (
                    <span>Generating Video with Omni Flash ({videoAspect})...</span>
                  ) : (
                    <span>Animate Video ({videoAspect})</span>
                  )}
                </button>

                {videoError && (
                  <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2 rounded border border-rose-900">
                    {videoError}
                  </p>
                )}
              </div>

              {/* Video Preview Column */}
              <div className="bg-stone-950/70 p-4 rounded-lg border border-stone-800 flex flex-col justify-between">
                <div className="text-[11px] font-mono text-stone-400 mb-2 flex justify-between">
                  <span>Animated Video Output</span>
                  <span className="text-purple-400">{videoAspect}</span>
                </div>

                <div className="flex-1 min-h-[260px] bg-stone-900 rounded-lg flex items-center justify-center overflow-hidden border border-stone-800">
                  {isGeneratingVideo ? (
                    <div className="text-center p-6 space-y-2">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-mono text-purple-300">
                        Generating video via gemini-omni-1.2-flash...
                      </p>
                      <p className="text-[10px] text-stone-400">
                        Applying physical motion and atmospheric lighting in {videoAspect}
                      </p>
                    </div>
                  ) : generatedVideo ? (
                    <video
                      src={generatedVideo}
                      controls
                      autoPlay
                      loop
                      className="max-h-full max-w-full rounded shadow"
                    />
                  ) : videoSourceImage ? (
                    <div className="relative max-h-full flex flex-col items-center justify-center p-3">
                      <img
                        src={videoSourceImage}
                        alt="Source Frame"
                        className="max-h-48 object-contain rounded opacity-80 mb-2"
                      />
                      <span className="text-[11px] font-mono text-stone-400">
                        Frame ready. Click "Animate Video ({videoAspect})" to begin.
                      </span>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-stone-500 text-xs font-mono">
                      Upload an image or generate an artifact in the Image Studio first.
                    </div>
                  )}
                </div>

                {generatedVideo && (
                  <div className="mt-3">
                    <a
                      href={generatedVideo}
                      download={`sapiens-scene-${videoAspect.replace(':', '-')}.mp4`}
                      className="w-full py-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded transition flex items-center justify-center cursor-pointer"
                    >
                      Download Video ({videoAspect})
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Harari Chronicler Chat (gemini-3.8-flash) */}
        {activeTab === 'chronicler' && (
          <div className="mt-4 flex-1 min-h-0 flex flex-col space-y-3">
            <div className="bg-stone-950/70 p-3 rounded-lg border border-stone-800 text-xs font-mono text-stone-300">
              <span className="text-sky-400 font-bold">Harari Chronicler:</span> Ask any question about human evolution, the Cognitive Revolution, Dunbar's number, fiction as a superpower, or the Agricultural Trap.
            </div>

            {/* Conversation Flow */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-stone-950/50 rounded-lg border border-stone-800">
              {chroniclerHistory.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono">
                    <span>◈ Player:</span>
                    <span>{item.q}</span>
                  </div>
                  <div className="bg-stone-900/80 border-l-2 border-sky-500 p-2.5 rounded-r text-stone-200 leading-relaxed font-serif">
                    {item.a}
                  </div>
                </div>
              ))}
              {isAskingChronicler && (
                <div className="text-xs font-mono text-sky-400 animate-pulse">
                  The chronicler is consulting the deep archives of humankind...
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleAskChronicler} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={chroniclerQuestion}
                onChange={(e) => setChroniclerQuestion(e.target.value)}
                placeholder="Ask Harari: 'Why does money work?' or 'What made sapiens unique?'"
                className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-sky-500 font-sans"
              />
              <button
                type="submit"
                disabled={isAskingChronicler || !chroniclerQuestion.trim()}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase rounded transition cursor-pointer"
              >
                Inquire
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
