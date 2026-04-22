"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <h2 className="text-xl font-semibold text-rose-700">Something went wrong</h2>
      <p className="mt-2 text-slate-700">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white"
      >
        Try again
      </button>
    </main>
  );
}
