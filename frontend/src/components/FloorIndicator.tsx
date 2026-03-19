'use client';

interface FloorIndicatorProps {
  floor: number | null;
  totalFloors: number;
}

export function FloorIndicator({ floor, totalFloors }: FloorIndicatorProps) {
  const isFault = floor === null || floor < 0 || floor >= totalFloors;

  if (isFault) {
    return (
      <div className="text-center">
        <p className="text-4xl font-bold text-red-700">⚠ Fault</p>
        <p className="text-sm text-red-600 mt-1">Invalid floor data</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-4xl font-bold text-neutral-900">Floor {floor}</p>
    </div>
  );
}
