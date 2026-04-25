"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
        <AlertTriangle className="h-7 w-7 text-rose-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
