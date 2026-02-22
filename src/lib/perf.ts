/**
 * Performance utilities for the Rapid Originals game suite.
 *
 * - lerp / damp: smooth interpolation for all moving assets
 * - TICK_INTERVAL_MS: global 20Hz (50ms) tick rate
 * - useGameLoop: requestAnimationFrame wrapper with auto-cleanup
 */

/** Global tick rate: 20 Hz → 50 ms */
export const TICK_INTERVAL_MS = 50;

/** Linear interpolation: moves `current` toward `target` by factor `t` (0–1). */
export function lerp(current: number, target: number, t: number): number {
  return current + (target - current) * t;
}

/**
 * Frame-rate-independent damping.
 * Smoothly moves `current` toward `target` over `smoothMs` milliseconds.
 * `dt` is the frame delta in ms.
 */
export function damp(
  current: number,
  target: number,
  smoothMs: number,
  dt: number
): number {
  const factor = 1 - Math.exp((-dt / smoothMs) * 6.9);
  return current + (target - current) * factor;
}

/**
 * Clamp a value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 2D lerp for canvas positions.
 */
export function lerp2d(
  cx: number,
  cy: number,
  tx: number,
  ty: number,
  t: number
): [number, number] {
  return [lerp(cx, tx, t), lerp(cy, ty, t)];
}
