'use client';

import { useElevatorHub } from '@/hooks/useElevatorHub';
import { AwaitingData } from '@/components/AwaitingData';
import { FloorIndicator } from '@/components/FloorIndicator';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { MotionStateIndicator } from '@/components/MotionStateIndicator';
import { ElevatorShaft } from '@/components/ElevatorShaft';

export function DashboardClient() {
  const { floor, direction, connectionState, buildingConfig, wasReconnecting } = useElevatorHub();

  if (connectionState === 'AwaitingData') {
    return <AwaitingData />;
  }

  const totalFloors = buildingConfig?.totalFloors ?? 10;

  return (
    <div className="w-full max-w-md space-y-6">
      <ConnectionBanner connectionState={connectionState} wasReconnecting={wasReconnecting} />
      <FloorIndicator floor={floor} totalFloors={totalFloors} />
      <MotionStateIndicator direction={direction} />
      <ElevatorShaft
        currentFloor={floor ?? 0}
        totalFloors={totalFloors}
        direction={direction}
      />
    </div>
  );
}
