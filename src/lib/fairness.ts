import crypto from "crypto";

/**
 * Provably Fair — Commit-Reveal Scheme
 *
 * 1. COMMIT: Server generates a random seed, hashes it (SHA-256),
 *    and gives the hash to the player BEFORE the game starts.
 * 2. PLAY: The mine positions are derived deterministically from
 *    (serverSeed + clientSeed + nonce) so they're fixed before any click.
 * 3. REVEAL: After the game, the raw serverSeed is shown so the player
 *    can re-hash it and verify the commitment matches.
 */

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSeed(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

/**
 * Derives exactly `mineCount` unique mine positions on a 5×5 grid
 * using HMAC-SHA256(serverSeed, clientSeed:nonce) as the entropy source.
 */
export function deriveMinePositions(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  mineCount: number,
  gridSize = 25
): number[] {
  const hmac = crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");

  const mines: Set<number> = new Set();
  let cursor = 0;

  while (mines.size < mineCount && cursor < hmac.length - 4) {
    const chunk = hmac.slice(cursor, cursor + 8);
    const value = parseInt(chunk, 16) % gridSize;
    mines.add(value);
    cursor += 8;

    if (cursor >= hmac.length - 4 && mines.size < mineCount) {
      const extended = crypto
        .createHmac("sha256", serverSeed)
        .update(`${clientSeed}:${nonce}:${cursor}`)
        .digest("hex");
      cursor = 0;
      Object.defineProperty(hmac, "length", { value: extended.length });
      // Fallback: iterate with secondary entropy
      for (let i = 0; i < extended.length - 4 && mines.size < mineCount; i += 8) {
        const v = parseInt(extended.slice(i, i + 8), 16) % gridSize;
        mines.add(v);
      }
    }
  }

  return Array.from(mines).slice(0, mineCount);
}

/**
 * Compute the multiplier for revealing `revealedCount` safe tiles
 * with `mineCount` mines on a 5×5 grid.
 *
 * Uses the probability-inverse formula with a 1% house edge:
 * multiplier = 0.99 * (25! / (25 - revealed)!) / ((25 - mines)! / (25 - mines - revealed)!)
 */
export function computeMultiplier(
  mineCount: number,
  revealedCount: number,
  gridSize = 25
): number {
  if (revealedCount === 0) return 1;

  const houseEdge = 0.99;
  let multiplier = houseEdge;

  for (let i = 0; i < revealedCount; i++) {
    multiplier *= (gridSize - i) / (gridSize - mineCount - i);
  }

  return Math.floor(multiplier * 100) / 100;
}

/**
 * The "next tile" value: what the multiplier would be if the player
 * reveals one more safe tile.
 */
export function nextTileMultiplier(
  mineCount: number,
  revealedCount: number,
  gridSize = 25
): number {
  return computeMultiplier(mineCount, revealedCount + 1, gridSize);
}
