import { useCallback, useEffect, useState } from "react";
import { ambient, getSoundPref, setSoundPref } from "../lib/ambient";

export default function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);

  // Restore preference. Audio still only starts on a real user gesture.
  useEffect(() => {
    if (!getSoundPref()) return;
    setOn(true);
    const resume = () => {
      ambient.start().catch(() => setOn(false));
    };
    window.addEventListener("pointerdown", resume, { once: true });
    return () => window.removeEventListener("pointerdown", resume);
  }, []);

  const toggle = useCallback(() => {
    const next = !on;
    setOn(next);
    setSoundPref(next);
    if (next) {
      ambient.start().catch(() => setOn(false));
    } else {
      ambient.stop();
    }
  }, [on]);

  return (
    <>
      <style>{`@keyframes pulse-bar{0%,100%{transform:scaleY(0.55)}50%{transform:scaleY(1)}}`}</style>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Mute ambient sound" : "Play ambient sound"}
        className={`group flex items-center gap-2.5 font-body text-[10px] font-medium uppercase tracking-wide2 text-bone-muted transition-colors duration-300 hover:text-bone ${className}`}
      >
      <span className="flex h-3.5 w-3.5 items-end gap-[2px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[2px] bg-current transition-all duration-500 ease-silk"
            style={{
              height: on ? `${[6, 14, 9][i]}px` : "3px",
              animation: on ? `pulse-bar 1.${4 + i}s ease-in-out infinite` : undefined,
            }}
          />
        ))}
      </span>
        <span className="hidden sm:inline">{on ? "Sound On" : "Sound Off"}</span>
      </button>
    </>
  );
}
