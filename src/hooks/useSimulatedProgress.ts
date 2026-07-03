"use client";

import { useEffect, useState } from "react";

export type SimulatedProgressStep = "extract" | "analyze" | "finalize";

/**
 * Smooth 0→~92% while `running`; snaps to 100% when `complete`.
 */
export function useSimulatedProgress(running: boolean, complete: boolean) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<SimulatedProgressStep>("extract");

  useEffect(() => {
    if (!running && !complete) {
      setProgress(0);
      setStep("extract");
      return;
    }

    if (complete) {
      setProgress(100);
      setStep("finalize");
      return;
    }

    setProgress(0);
    setStep("extract");
    const started = Date.now();

    const tick = () => {
      const elapsed = Date.now() - started;
      const next = Math.min(92, (1 - Math.exp(-elapsed / 5500)) * 92);
      setProgress(next);
      if (next < 28) setStep("extract");
      else if (next < 68) setStep("analyze");
      else setStep("finalize");
    };

    tick();
    const id = window.setInterval(tick, 80);
    return () => window.clearInterval(id);
  }, [running, complete]);

  return { progress, step };
}
