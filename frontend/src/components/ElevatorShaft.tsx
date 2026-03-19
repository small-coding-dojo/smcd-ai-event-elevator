'use client';

import type { ElevatorDirection } from '@/lib/types';

interface ElevatorShaftProps {
  currentFloor: number;
  totalFloors: number;
  direction: ElevatorDirection | null;
}

const SHAFT_HEIGHT = 400;
const SHAFT_WIDTH = 120;
const CAR_WIDTH = 80;
const CAR_HEIGHT_RATIO = 0.7;

export function ElevatorShaft({ currentFloor, totalFloors, direction }: ElevatorShaftProps) {
  const cellHeight = SHAFT_HEIGHT / totalFloors;
  const carHeight = cellHeight * CAR_HEIGHT_RATIO;
  const carY = (totalFloors - 1 - currentFloor) * cellHeight + (cellHeight - carHeight) / 2;

  const floors = Array.from({ length: totalFloors }, (_, i) => totalFloors - 1 - i);

  return (
    <svg
      width={SHAFT_WIDTH}
      height={SHAFT_HEIGHT}
      aria-label="Elevator shaft"
      role="img"
      className="mx-auto border border-neutral-300 rounded bg-neutral-100"
    >
      {floors.map((floor) => {
        const y = (totalFloors - 1 - floor) * cellHeight;
        return (
          <g key={floor}>
            <line
              x1={0}
              y1={y + cellHeight}
              x2={SHAFT_WIDTH}
              y2={y + cellHeight}
              stroke="#d4d4d4"
              strokeWidth={1}
            />
            <text
              x={8}
              y={y + cellHeight / 2 + 4}
              fontSize={12}
              fill="#737373"
              className="select-none"
            >
              {floor}
            </text>
          </g>
        );
      })}

      <g
        transform={`translate(${(SHAFT_WIDTH - CAR_WIDTH) / 2}, ${carY})`}
        style={{
          transition: 'transform 200ms ease-in-out',
        }}
        aria-label={`Elevator at floor ${currentFloor}`}
      >
        <rect
          width={CAR_WIDTH}
          height={carHeight}
          rx={4}
          fill={direction === 'Up' ? '#3b82f6' : direction === 'Down' ? '#3b82f6' : '#6b7280'}
          stroke="#1e3a5f"
          strokeWidth={2}
        />
        <text
          x={CAR_WIDTH / 2}
          y={carHeight / 2 + 5}
          textAnchor="middle"
          fontSize={14}
          fontWeight="bold"
          fill="white"
        >
          {currentFloor}
        </text>
      </g>
    </svg>
  );
}
