import { useCallback, useEffect, useRef, useState } from "react";
import { ambient, getSoundPref, setSoundPref } from "../lib/ambient";
import { audioLive, unlockAudio } from "../lib/audioBus";
import { playSfx } from "../lib/sfx";

/**
 * Sound On / Off.
 *
 * Switching it on now does three things instead of one: it unlocks the audio
 * context, fades the ambient bed in, and plays a confirmation note — so the
 * control answers immediately rather than leaving the visitor wondering
 * whether anything happened. From then on every button, link and page change
 * carries one of the interface sounds in `src/lib/sfx.ts`.
 */
export default function SoundToggle({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const resumed = useRef(false);

  // Restore the preference. Audio still only starts from a real gesture, so a
  // returning visitor's bed begins on their first tap.
  useEffect(() => {
    if (!getSoundPref()) return;
    setOn(true);
    const resume = () => {
      if (resumed.current) return;
      resumed.current = true;
      void ambient.start().catch(() => setOn(false));
    };
    window.addEventListener("pointerdown", resume, { once: true });
    return () => window.removeEventListener("pointerdown", resume);
  }, []);

  const toggle = useCallback(() => {
    const next = !on;
    setOn(next);
    setSoundPref(next);
    setBlocked(false);

    if (next) {
      void unlockAudio().then((ok) => {
        if (!ok) {
          // The browser refused audio — say so rather than pretending.
          setBlocked(true);
          setOn(false);
          setSoundPref(false);
          return;
        }
        void ambient.start()
          .then(() => playSfx("select"))
          .catch(() => setOn(false));
      });
    } else {
      ambient.stop();
      setOn(false);
    }
  }, [on]);

  return (
    <>
      <style>{`@keyframes pulse-bar{0%,100%{transform:scaleY(0.55)}50%{transform:scaleY(1)}}`}</style>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        title={
          blocked
            ? "This browser blocked audio playback"
            : on
              ? "Sound is on — the bed, plus a note on every control"
              : "Turn on the ambient bed and the interface sounds"
        }
        aria-label={on ? "Mute sound" : "Unmute sound"}
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
        <span className="hidden sm:inline">
          {blocked ? "Sound blocked" : on ? "Sound On" : "Sound Off"}
        </span>
      </button>
    </>
  );
}

/** True when the audio graph is actually running (used by the dashboard). */
export const soundIsLive = (): boolean => getSoundPref() && audioLive();
