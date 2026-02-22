/**
 * Haptic feedback for mobile devices.
 * Uses the Vibration API where available; falls back to a visual pulse class.
 */

type HapticStyle = "light" | "medium" | "heavy";

const PATTERNS: Record<HapticStyle, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30, 10, 30],
};

export function triggerHaptic(style: HapticStyle = "medium"): void {
  if (typeof window === "undefined") return;

  if ("vibrate" in navigator) {
    navigator.vibrate(PATTERNS[style]);
  }
}

export function triggerHapticOnElement(
  el: HTMLElement | null,
  style: HapticStyle = "medium"
): void {
  triggerHaptic(style);

  if (!el) return;
  el.classList.remove("haptic-pulse");
  void el.offsetWidth;
  el.classList.add("haptic-pulse");
}
