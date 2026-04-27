"use client";

import { CalendarPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  defaultDateKey: string;
};

export function GenerateDailyReportsControl({ defaultDateKey }: Props) {
  const router = useRouter();
  const [date, setDate] = useState(defaultDateKey);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  async function onGenerate() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/daily-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: { dateKey: string; generatedReports: number };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) {
        setFeedback({
          type: "err",
          text: json.error?.message ?? "Failed to generate reports.",
        });
        return;
      }
      const n = json.data?.generatedReports ?? 0;
      setFeedback({
        type: "ok",
        text: `Generated ${n} report(s) for ${json.data?.dateKey ?? date}.`,
      });
      router.refresh();
    } catch (e) {
      setFeedback({
        type: "err",
        text: e instanceof Error ? e.message : "Network error.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <CalendarPlus className="h-3.5 w-3.5" />
            Date (UTC day)
          </span>
          <input
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={loading}
          />
        </label>
        <button
          type="button"
          onClick={onGenerate}
          disabled={loading || !date}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : null}
          {loading ? "Generating…" : "Generate report"}
        </button>
      </div>
      {feedback ? (
        <p
          className={`text-sm sm:text-right ${feedback.type === "ok" ? "text-emerald-700" : "text-rose-600"}`}
        >
          {feedback.text}
        </p>
      ) : null}
    </div>
  );
}
