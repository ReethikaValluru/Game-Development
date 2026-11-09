import React, { useEffect, useState, useRef } from 'react';
import { Achievement } from '../types/game';

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismissRef.current(), 400);
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [achievement]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-md w-[92vw] transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-6 opacity-0 scale-95'
      }`}
    >
      <div className="bg-stone-900 border-2 border-amber-500/90 rounded-xl shadow-2xl p-4 text-stone-100 flex gap-3.5 items-start relative overflow-hidden">
        {/* Subtle accent glow banner */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Big Achievement Icon */}
        <div className="w-11 h-11 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 shadow-inner mt-0.5">
          {achievement.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
              Achievement Unlocked!
            </span>
          </div>

          <h3 className="font-serif font-black text-base text-amber-100 mt-1 leading-snug">
            {achievement.title}
          </h3>
          <p className="text-xs text-stone-300 mt-0.5 leading-snug">
            {achievement.description}
          </p>

          {/* Harari Fun Fact Card */}
          <div className="mt-2.5 bg-stone-950/80 border-l-2 border-amber-400 p-2.5 rounded-r text-[11px] text-amber-200/90 font-serif leading-relaxed">
            <span className="font-sans font-bold text-amber-400 text-[10px] uppercase block tracking-wider mb-0.5">
              💡 Harari Fun Fact:
            </span>
            "{achievement.funFact}"
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="absolute top-2.5 right-2.5 text-stone-400 hover:text-stone-200 p-1 text-xs transition cursor-pointer"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
