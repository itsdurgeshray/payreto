import type { GroupKey } from "./solutionsData";

// Shared, mutable hover-glow state.
// The mosaic writes the currently hovered group colour (+ intensity) into this
// object every frame; the god-ray layer reads it and smoothly interpolates
// toward it. Deliberately NOT React state so the animation loop never triggers
// a re-render.
export const heroGlow = {
  targetR: 96,
  targetG: 165,
  targetB: 250,
  targetIntensity: 0,
  // The group under the cursor (strongest reveal), or null at rest. The hero
  // headline reads this to swap its second line.
  group: null as GroupKey | null,
};