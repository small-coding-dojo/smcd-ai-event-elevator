'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HubConnection } from '@microsoft/signalr';
import { createHubConnection } from '@/lib/signalr';
import type {
  ElevatorDirection,
  FloorEvent,
  BuildingConfiguration,
  ConnectionState,
} from '@/lib/types';

interface UseElevatorHubResult {
  floor: number | null;
  direction: ElevatorDirection | null;
  connectionState: ConnectionState;
  buildingConfig: BuildingConfiguration | null;
  lastEventAt: Date | null;
  wasReconnecting: boolean;
}

export function useElevatorHub(): UseElevatorHubResult {
  const [floor, setFloor] = useState<number | null>(null);
  const [direction, setDirection] = useState<ElevatorDirection | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('AwaitingData');
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfiguration | null>(null);
  const [lastEventAt, setLastEventAt] = useState<Date | null>(null);
  const [wasReconnecting, setWasReconnecting] = useState(false);

  const connectionRef = useRef<HubConnection | null>(null);
  const bufferedEventRef = useRef<FloorEvent | null>(null);
  const initResolvedRef = useRef(false);

  const applyFloorEvent = useCallback((event: FloorEvent) => {
    setFloor(event.floorNumber);
    setDirection(event.direction);
    setLastEventAt(new Date());
    setConnectionState('Connected');
  }, []);

  useEffect(() => {
    const connection = createHubConnection();
    connectionRef.current = connection;

    connection.on('ReceiveFloorEvent', (floorNumber: number, dir: string, timestamp: string) => {
      const event: FloorEvent = {
        floorNumber,
        direction: dir as ElevatorDirection,
        timestamp,
      };

      if (!initResolvedRef.current) {
        bufferedEventRef.current = event;
        return;
      }

      applyFloorEvent(event);
    });

    connection.onreconnecting(() => {
      setConnectionState('Reconnecting');
      setWasReconnecting(true);
    });

    connection.onreconnected(async () => {
      setConnectionState('Connected');
      try {
        const snapshot = await connection.invoke<{
          floorNumber: number;
          direction: string;
          timestamp: string;
        } | null>('GetCurrentElevatorState');
        if (snapshot) {
          setFloor(snapshot.floorNumber);
          setDirection(snapshot.direction as ElevatorDirection);
          setLastEventAt(new Date());
        }
      } catch {
        // Snapshot failed; resume with live events
      }

      // Auto-dismiss "Connection restored" banner after 3s
      setTimeout(() => setWasReconnecting(false), 3000);
    });

    connection.onclose(() => {
      setConnectionState('Disconnected');
    });

    const startConnection = async () => {
      try {
        await connection.start();

        const [config, snapshot] = await Promise.all([
          connection.invoke<BuildingConfiguration>('GetBuildingConfiguration'),
          connection.invoke<{
            floorNumber: number;
            direction: string;
            timestamp: string;
          } | null>('GetCurrentElevatorState'),
        ]);

        setBuildingConfig(config);
        initResolvedRef.current = true;

        // Apply snapshot or buffered event, whichever is newer
        const buffered = bufferedEventRef.current;
        bufferedEventRef.current = null;

        if (snapshot && buffered) {
          const snapshotTime = new Date(snapshot.timestamp).getTime();
          const bufferedTime = new Date(buffered.timestamp).getTime();
          if (bufferedTime >= snapshotTime) {
            applyFloorEvent(buffered);
          } else {
            setFloor(snapshot.floorNumber);
            setDirection(snapshot.direction as ElevatorDirection);
            setLastEventAt(new Date());
            setConnectionState('Connected');
          }
        } else if (snapshot) {
          setFloor(snapshot.floorNumber);
          setDirection(snapshot.direction as ElevatorDirection);
          setLastEventAt(new Date());
          setConnectionState('Connected');
        } else if (buffered) {
          applyFloorEvent(buffered);
        }
        // If neither snapshot nor buffered, stay in AwaitingData until first live event
      } catch {
        setConnectionState('Disconnected');
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, [applyFloorEvent]);

  return { floor, direction, connectionState, buildingConfig, lastEventAt, wasReconnecting };
}
