"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cinematic brand intro shown once per browser session when the storefront opens.
 *
 * Sequence:
 *   1. Ambient gold glow fades in on a deep black stage
 *   2. "RAKVIH" (white) wipes in with a soft blur-to-focus
 *   3. "ORIGINALS" (gold) follows
 *   4. A light sweep glides across the logo, gold hairline + tagline appear
 *   5. Once the page is ready and the bar reaches 100, the logo lifts and the curtains part
 *
 * On the homepage the bar tracks the opening hero frames downloading, so the first film
 * scrolls smoothly from the moment the curtains part.
 *
 * A tiny inline script in the root layout adds `rk-intro-seen` to <html> on repeat
 * visits in the same session, so the loader is hidden before first paint.
 */

const SESSION_KEY = "rakvih_intro_seen";
const MIN_DISPLAY_MS = 2800; // logo reveal, shine sweep and tagline all finish (~2.3s) with a short beat after
const MAX_DISPLAY_MS = 20000; // safety ceiling so a slow network never blocks the site
const HOLD_AT_100_MS = 400; // let "100" register before the curtains part
const EXIT_MS = 1250; // matches the curtain transition (0.25s delay + 0.95s) in globals.css

type Phase = "playing" | "exiting" | "done";
type HeroWindow = Window & { __rkHeroReady?: boolean; __rkHeroProgress?: number };

/** The page is ready to reveal once fonts are in and, on the homepage, the opening hero frames are downloaded. */
function isPageReady(): boolean {
  if (document.readyState === "loading") return false;
  if (document.fonts && document.fonts.status !== "loaded") return false;
  const hasHero = !!document.getElementById("hero-canvas");
  return !hasHero || (window as HeroWindow).__rkHeroReady === true;
}

/** Share of the opening hero frames already downloaded (1 on pages without the hero). */
function heroLoadRatio(): number {
  if (!document.getElementById("hero-canvas")) return 1;
  return (window as HeroWindow).__rkHeroProgress ?? 0;
}

export default function IntroLoader() {
  const [phase, setPhase] = useState<Phase>("playing");
  const barRef = useRef<HTMLSpanElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;

    // Already shown this session → skip entirely
    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    if (seen) {
      // Already hidden pre-paint by the `rk-intro-seen` class; just unmount.
      const t = setTimeout(() => {
        setPhase("done");
        window.dispatchEvent(new Event("rk:intro-done"));
      }, 0);
      return () => clearTimeout(t);
    }

    root.classList.add("rk-intro-active");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minTime = reduceMotion ? 600 : MIN_DISPLAY_MS;
    const start = performance.now();

    let progress = 0;
    let ready = false;
    let completedAt = 0;
    let exiting = false;
    let rafId = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const render = () => {
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress / 100})`;
      if (percentRef.current) percentRef.current.textContent = String(Math.round(progress)).padStart(2, "0");
    };

    const exit = () => {
      exiting = true;
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      // Unlock scroll as the curtains start parting
      root.classList.remove("rk-intro-active");
      setPhase("exiting");
      timers.push(
        setTimeout(() => {
          setPhase("done");
          window.dispatchEvent(new Event("rk:intro-done"));
        }, reduceMotion ? 200 : EXIT_MS)
      );
    };

    // Progress follows elapsed time and real download progress, held below 95% until the
    // page is actually ready, then glides to 100%, holds briefly, and only then reveals the site.
    const tick = () => {
      const now = performance.now();
      const elapsed = now - start;
      if (!ready && (isPageReady() || elapsed >= MAX_DISPLAY_MS)) ready = true;

      const timeRatio = Math.min(elapsed / minTime, 1);
      const target = ready ? timeRatio * 100 : Math.min(timeRatio, heroLoadRatio()) * 95;
      if (target > progress) progress = Math.min(100, progress + Math.max((target - progress) * 0.1, 0.15));
      if (progress > 99.5) progress = 100;
      render();

      if (progress === 100 && !completedAt) completedAt = now;
      if (completedAt && now - completedAt >= HOLD_AT_100_MS) {
        exit();
        return;
      }
      if (!exiting) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      timers.forEach(clearTimeout);
      root.classList.remove("rk-intro-active");
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={`rk-loader ${phase === "exiting" ? "is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading RAKVIH Originals"
    >
      {/* Curtains that part on exit */}
      <div className="rk-curtain rk-curtain--top" />
      <div className="rk-curtain rk-curtain--bottom" />

      {/* Ambient atmosphere */}
      <div className="rk-loader-glow" />
      <div className="rk-loader-grain" />
      <div className="rk-loader-frame" />

      <div className="rk-loader-stage">
        <div className="rk-loader-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rakvih-logo-mark.png"
            alt=""
            className="rk-logo-part rk-logo-mark"
            width={443}
            height={112}
            fetchPriority="high"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/rakvih-logo-originals.png"
            alt=""
            className="rk-logo-part rk-logo-originals"
            width={450}
            height={112}
            fetchPriority="high"
          />
          <span className="rk-logo-shine" aria-hidden="true" />
        </div>

        <div className="rk-loader-rule" />
        <p className="rk-loader-tagline">Maison of Timeless Luxury</p>

        <div className="rk-loader-progress" aria-hidden="true">
          <span ref={barRef} />
        </div>
        <span ref={percentRef} className="rk-loader-percent" aria-hidden="true">
          00
        </span>
      </div>
    </div>
  );
}
