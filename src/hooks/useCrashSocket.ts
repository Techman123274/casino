"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCrashStore } from "@/stores/crash-store";

/**
 * 60 Hz crash multiplier engine.
 *
 * Receives the server's authoritative `flyStartedAt` timestamp and computes
 * the multiplier locally via: `multiplier = e^(0.06 * elapsed)`.
 *
 * Because the formula is deterministic from a shared start-time,
 * network lag doesn't cause "jumping" — the client always shows the
 * correct value for the current wall-clock instant.
 *
 * The RAF loop stops itself when the multiplier reaches crashPoint.
 */

export interface CrashSocketControls {
  /** Begin the RAF loop. `serverStartTime` = Date.now() on the server when FLYING began. */
  start: (crashPoint: number, serverStartTime: number) => void;
  stop: () => void;
  getElapsed: () => number;
  getMultiplier: () => number;
}

export function useCrashSocket(): CrashSocketControls {
  const rafRef = useRef<number>(0);
  const serverStartRef = useRef(0);
  const runningRef = useRef(false);
  const crashPointRef = useRef(0);
  const currentMultRef = useRef(1.0);

  const setMultiplier = useCrashStore((s) => s.setMultiplier);

  const tick = useCallback(
    () => {
      if (!runningRef.current) return;

      const elapsed = (Date.now() - serverStartRef.current) / 1000;
      const mult = Math.exp(0.06 * elapsed);
      const rounded = Math.round(mult * 100) / 100;
      currentMultRef.current = rounded;

      setMultiplier(rounded);

      if (rounded >= crashPointRef.current) {
        runningRef.current = false;
        setMultiplier(crashPointRef.current);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [setMultiplier]
  );

  const start = useCallback(
    (crashPoint: number, serverStartTime: number) => {
      crashPointRef.current = crashPoint;
      serverStartRef.current = serverStartTime;
      currentMultRef.current = 1.0;
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    },
    [tick]
  );

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
  }, []);

  const getElapsed = useCallback(() => {
    if (!runningRef.current) return 0;
    return (Date.now() - serverStartRef.current) / 1000;
  }, []);

  const getMultiplier = useCallback(() => currentMultRef.current, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { start, stop, getElapsed, getMultiplier };
}
