export type ElevatorDirection = 'Up' | 'Down' | 'Stationary';

export interface FloorEvent {
  floorNumber: number;
  direction: ElevatorDirection;
  timestamp: string;
}

export interface BuildingConfiguration {
  totalFloors: number;
}

export interface ElevatorState {
  currentFloor: number;
  direction: ElevatorDirection;
  lastEventAt: Date;
  backendTimestamp: string;
}

export type ConnectionState =
  | 'AwaitingData'
  | 'Connected'
  | 'Reconnecting'
  | 'Disconnected';
