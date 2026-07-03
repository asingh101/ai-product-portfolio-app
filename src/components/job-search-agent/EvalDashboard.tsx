"use client";

import { useCallback, useEffect, useState } from "react";
import { GOLDEN_EVAL_SET } from "@/lib/job-search-agent/evals/goldenSet";
import {
  loadLastEvalRun,
  runEvals,
  saveLastEvalRun,
} from "@/lib/job-search-agent/evals/evalHarness";
import type { EvalLastRunSnapshot, EvalRunResult } from "@/lib/job-search-agent/evals/types";

export function EvalDashboard() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; caseId: string } | null>(null);
  const [run, setRun] = useState<EvalRunResult | null>(null);
  const [previousRun, setPreviousRun] = useState<EvalLastRunSnapshot | null>(null);
  const [regressed, setRegressed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreviousRun(loadLastEvalRun());
  }, []);

  const handleRun = useCallback(async () => {
    const before = loadLastEvalRun();
    setRunning(true);
    setError(null);
    setProgress(null);
    setRegressed(false);

    try {
      const result = await runEvals(GOLDEN_EVAL_SET, (done, total, caseId) => {
        setProgress({ done, total, caseId });
      });
      setRun(result);
      setRegressed(before != null && result.passCount < before.passCount);
      saveLastEvalRun(result);
      setPreviousRun(loadLastEvalRun());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eval run failed");
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }, []);

  const showRegression = regressed && previousRun && run;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
            Phase G · Eval harness
          </p>
          <h2 className="text-xl font-bold font-[family-name:var(--font-headline)]">
            analyze_fit golden set
          </h2>
          <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
            Five regression cases against production <code className="text-xs bg-surface-container px-1 rounded">analyze_fit</code>.
            Run after prompt or model changes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-lg">
            {running ? "hourglass_top" : "play_arrow"}
          </span>
          {running ? "Running evals…" : "Run evals"}
        </button>
      </div>

      {running && progress && (
        <p className="text-sm text-on-surface-variant">
          Case {progress.done}/{progress.total}
          {progress.caseId ? ` · ${progress.caseId}` : ""}
        </p>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      {showRegression && previousRun && run && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
          <span className="material-symbols-outlined text-amber-700 text-lg shrink-0">warning</span>
          <p className="text-sm text-amber-900">
            Pass rate dropped vs last run ({previousRun.passCount}/{previousRun.total} → {run.passCount}/
            {run.total}). Review failures before shipping prompt changes.
          </p>
        </div>
      )}

      {run && (
        <>
          <div
            className={`rounded-xl px-5 py-4 border ${
              run.passCount >= 4
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-lg font-bold font-[family-name:var(--font-headline)]">
              {run.passCount}/{run.total} passing
              <span className="text-sm font-normal text-on-surface-variant ml-2">
                ({Math.round(run.passRate * 100)}%)
              </span>
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Ran {new Date(run.ranAt).toLocaleString()}
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-outline-variant/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/15 bg-surface-container-low/80">
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant">Test case</th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant">Score</th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant">Expected</th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant">Tier</th>
                  <th className="text-left px-4 py-3 font-bold text-on-surface-variant">Result</th>
                </tr>
              </thead>
              <tbody>
                {run.results.map((row) => (
                  <tr key={row.id} className="border-b border-outline-variant/10 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-on-surface">{row.label}</p>
                      <p className="text-xs text-on-surface-variant">{row.category}</p>
                      {row.failures.length > 0 && (
                        <ul className="mt-2 text-xs text-rose-700 space-y-0.5">
                          {row.failures.map((f) => (
                            <li key={f}>• {f}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {row.errorCode && !row.score ? (
                        <span className="text-on-surface-variant">{row.errorCode}</span>
                      ) : (
                        row.score ?? "—"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant">
                      {row.expectedRange[0]}–{row.expectedRange[1]}
                    </td>
                    <td className="px-4 py-3">
                      {row.tier ?? "—"}
                      <span className="text-on-surface-variant text-xs ml-1">
                        (exp. {row.expectedTier})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          row.passed
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {row.passed ? "check_circle" : "cancel"}
                        </span>
                        {row.passed ? "PASS" : "FAIL"}
                      </span>
                      {row.latencyMs != null && (
                        <p className="text-[10px] text-on-surface-variant mt-1">{row.latencyMs}ms</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!run && !running && (
        <p className="text-sm text-on-surface-variant">
          {previousRun
            ? `Last run: ${previousRun.passCount}/${previousRun.total} passing on ${new Date(previousRun.ranAt).toLocaleString()}`
            : "No eval run yet. Click Run evals to baseline analyze_fit."}
        </p>
      )}
    </div>
  );
}
