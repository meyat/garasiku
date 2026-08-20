import clsx from "clsx";
import type { HealthScoreResult } from "@/lib/calculations/vehicle-health";

export function HealthScoreCard({ result }: { result: HealthScoreResult }) {
  const color =
    result.score >= 80 ? "text-emerald-600" : result.score >= 50 ? "text-orange-500" : "text-rose-600";
  const ring =
    result.score >= 80 ? "stroke-emerald-500" : result.score >= 50 ? "stroke-orange-500" : "stroke-rose-500";

  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (result.score / 100) * circumference;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-5">
      <div className="flex items-center gap-4">
        <svg width="76" height="76" viewBox="0 0 80 80" className="-rotate-90 shrink-0">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="40" cy="40" r="34" fill="none" strokeWidth="8" strokeLinecap="round"
            className={ring} strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kesehatan Kendaraan</p>
          <p className={clsx("text-2xl font-bold", color)}>{result.score}%</p>
        </div>
      </div>

      {result.reasons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
          {result.reasons.slice(0, 4).map((r) => (
            <div key={r.componentName} className="flex justify-between text-xs">
              <span className="text-slate-600">{r.componentName}</span>
              <span className="text-slate-400 font-medium">-{r.impact} poin</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
