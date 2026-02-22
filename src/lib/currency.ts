/**
 * Rapid Credits (RC) formatting utilities.
 *
 * RC uses Electric Gold (#FFD700) styling and a custom diamond icon.
 * Formatting adapts based on magnitude:
 *   - Under 1 RC:      "0.50 RC"
 *   - Under 1,000:     "250.00 RC"
 *   - 1,000+:          "1.2K RC"
 *   - 1,000,000+:      "3.4M RC"
 */

export const RC_SYMBOL = "RC";
export const RC_ICON = "◆";

export function formatRC(value: number | string, opts?: { compact?: boolean }): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return `${RC_ICON} 0.00 ${RC_SYMBOL}`;

  const compact = opts?.compact ?? false;

  if (compact && num >= 1_000_000) {
    return `${RC_ICON} ${(num / 1_000_000).toFixed(1)}M ${RC_SYMBOL}`;
  }
  if (compact && num >= 10_000) {
    return `${RC_ICON} ${(num / 1_000).toFixed(1)}K ${RC_SYMBOL}`;
  }
  if (compact && num >= 1_000) {
    return `${RC_ICON} ${(num / 1_000).toFixed(2)}K ${RC_SYMBOL}`;
  }

  return `${RC_ICON} ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${RC_SYMBOL}`;
}

/**
 * Returns just the numeric display without the icon/symbol — useful
 * when the icon is rendered separately as a styled element.
 */
export function formatRCValue(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0.00";

  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  if (num >= 1_000) return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return num.toFixed(2);
}

/**
 * Parse any RC display string back to a raw number.
 */
export function parseRC(display: string): number {
  const cleaned = display.replace(/[◆RC,\s]/g, "");
  if (cleaned.endsWith("M")) return parseFloat(cleaned) * 1_000_000;
  if (cleaned.endsWith("K")) return parseFloat(cleaned) * 1_000;
  return parseFloat(cleaned) || 0;
}
