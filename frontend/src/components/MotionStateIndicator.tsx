'use client';

import type { ElevatorDirection } from '@/lib/types';

interface MotionStateIndicatorProps {
  direction: ElevatorDirection | null;
}

const directionConfig: Record<ElevatorDirection, { icon: string; label: string; className: string }> = {
  Up: { icon: '↑', label: 'Moving Up', className: 'text-blue-700' },
  Down: { icon: '↓', label: 'Moving Down', className: 'text-blue-700' },
  Stationary: { icon: '⏸', label: 'Stationary', className: 'text-neutral-600' },
};

export function MotionStateIndicator({ direction }: MotionStateIndicatorProps) {
  if (direction === null || !(direction in directionConfig)) {
    return (
      <div className="text-center">
        <span className="text-lg text-red-700">⚠ Unknown direction</span>
      </div>
    );
  }

  const config = directionConfig[direction];

  return (
    <div className="text-center">
      <span className={`text-2xl font-semibold ${config.className}`} aria-label={config.label}>
        {config.icon} {config.label}
      </span>
    </div>
  );
}
