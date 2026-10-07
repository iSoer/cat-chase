/**
 * World scale: 1 on a desktop-sized window, smaller on phones, so sprites, speeds and
 * distances shrink together and the playground keeps the same feel on a small screen.
 * Game logic multiplies its base pixel values by `scale`; the CSS gets the same number as `--scale`.
 */

/** A window with this much area is drawn at full size. */
const FULL_AREA = 1100 * 720;
const MIN_SCALE = 0.5;

export let scale = 1;

/** Recompute from the current viewport; call on start and on every resize. */
export function updateScale(): number {
  const area = window.innerWidth * window.innerHeight;
  scale = Math.min(1, Math.max(MIN_SCALE, Math.sqrt(area / FULL_AREA)));
  document.documentElement.style.setProperty('--scale', scale.toFixed(3));
  return scale;
}
