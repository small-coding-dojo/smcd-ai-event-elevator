'use client';

export function AwaitingData() {
  return (
    <div role="status" className="flex items-center justify-center min-h-[200px]">
      <p className="text-lg text-neutral-600">Awaiting data…</p>
    </div>
  );
}
