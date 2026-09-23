import { useSyncExternalStore } from "react";
import type { GroupKey } from "./solutionsData";

// State of the hero → expertise transition.
//
// The transition is NOT scrubbed by scroll: a scroll intent triggers it and it
// then plays through on its own clock, so nobody can park the page on an
// in-between frame. `p` runs 0 (hero) → 1 (expertise); components subscribe
// and write styles directly, so the per-frame updates never re-render React.

// "leaving" is the brief fade-out of the list before the reverse flight.
export type HeroMode = "hero" | "toExpertise" | "expertise" | "leaving" | "toHero";

export const isTransitioning = () =>
  state.mode === "toExpertise" || state.mode === "leaving" || state.mode === "toHero";

const FORWARD_MS = 2200;
const REVERSE_MS = 1700;
const LEAVE_MS = 220;

type Listener = () => void;

const state = {
  p: 0,
  mode: "hero" as HeroMode,
  active: "green" as GroupKey,
};

const progressListeners = new Set<(p: number) => void>();
const modeListeners = new Set<Listener>();
const activeListeners = new Set<Listener>();

export const heroTransition = state;

export function onHeroProgress(listener: (p: number) => void) {
  progressListeners.add(listener);
  listener(state.p);
  return () => {
    progressListeners.delete(listener);
  };
}

function setProgress(p: number) {
  state.p = p;
  progressListeners.forEach((l) => l(p));
}

function setMode(mode: HeroMode) {
  state.mode = mode;
  modeListeners.forEach((l) => l());
}

export function useHeroMode() {
  return useSyncExternalStore(
    (l) => {
      modeListeners.add(l);
      return () => modeListeners.delete(l);
    },
    () => state.mode
  );
}

export function setActiveGroup(key: GroupKey) {
  if (state.active === key) return;
  state.active = key;
  activeListeners.forEach((l) => l());
}

export function useActiveGroup() {
  return useSyncExternalStore(
    (l) => {
      activeListeners.add(l);
      return () => activeListeners.delete(l);
    },
    () => state.active
  );
}

const reducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

function tween(from: number, to: number, ms: number) {
  return new Promise<void>((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setProgress(from + (to - from) * t);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

// Hero → expertise.
export async function playForward() {
  if (state.mode !== "hero") return;
  setMode("toExpertise");
  await tween(0, 1, reducedMotion() ? 1 : FORWARD_MS);
  setMode("expertise");
}

// Expertise → hero. The list collapses first; the stage then regains its
// full height before the tiles fly home.
export async function playReverse() {
  if (state.mode !== "expertise") return;
  window.scrollTo(0, 0);
  setMode("leaving");
  await new Promise((r) => setTimeout(r, reducedMotion() ? 0 : LEAVE_MS));
  setMode("toHero");
  await nextFrame();
  await nextFrame();
  await tween(1, 0, reducedMotion() ? 1 : REVERSE_MS);
  setMode("hero");
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
