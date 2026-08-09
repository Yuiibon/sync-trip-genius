import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";

const DEFAULT_STEPS = [
  "Analyzing group preferences...",
  "Finding schedule overlaps...",
  "Comparing budgets...",
  "Matching interests...",
  "Optimizing trip plans...",
];

export function AnalysisLoader({
  steps = DEFAULT_STEPS,
  intervalMs = 700,
  onDone,
}: {
  steps?: string[];
  intervalMs?: number;
  onDone?: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= steps.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), intervalMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, steps.length, intervalMs]);

  return (
    <div className="card-surface p-8">
      <div className="flex items-center gap-3">
        <span className="bg-brand grid size-10 place-items-center rounded-xl">
          <Sparkles className="size-5 animate-pulse text-primary-foreground" />
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold">AI Trip Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Crunching every anonymous response into compatible plans.
          </p>
        </div>
      </div>
      <ul className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-sm">
            {i < step ? (
              <Check className="size-4 shrink-0 text-success" />
            ) : i === step ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-secondary" />
            ) : (
              <span className="size-4 shrink-0 rounded-full border border-border" />
            )}
            <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
