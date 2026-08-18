import clsx from "clsx";
import type { HealthScoreResult } from "@/lib/calculations/vehicle-health";

export function HealthScoreCard({ result }: { result: HealthScoreResult }) {
  const color =
    result.score >= 80 ? "text-green-600" : result.score >= 50 ? "text-amber-600" : "text-red-600";
  const ring =
    result.score >= 80 ? "stroke-green-500" : result.score >= 50 ? "stroke-amber-500" : "stroke-red-500";

  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4">
      <div className="flex items-center gap-4">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90 shrink-0">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e5e5" strokeWidth="8" />
          <circle cx="40" cy="40" r="34" fill="none" strokeWidth="8" strokeLinecap="round"
            className={ring} strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div>
          <p className="text-xs text-neutral-500">Kesehatan Kendaraan</p>
          <p className={clsx("text-2xl font-bold", color)}>{result.score}%</p>
        </div>
      </div>

      {result.reasons.length > 0 && (
        <div className="mt-3 space-y-1">
          {result.reasons.slice(0, 4).map((r) => (
            <div key={r.componentName} className="flex justify-between text-xs">
              <span className="text-neutral-600">{r.componentName}</span>
              <span className="text-neutral-400">-{r.impact} poin</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
