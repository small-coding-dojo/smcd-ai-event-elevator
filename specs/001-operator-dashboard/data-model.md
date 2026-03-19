# Data Model: Operator Elevator Status Dashboard

**Phase**: 1 | **Date**: 2026-03-13

---

## Entities

### 1. `FloorEvent` (Backend → Frontend contract)

The primary push payload emitted by the backend SignalR hub once per floor as the elevator arrives
at or passes through that floor. **All frontend display state derives from this event.**

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `floorNumber` | `int` | 0 ≤ n ≤ 19 | Floor the elevator is at/passing through (0 = ground) |
| `direction` | `ElevatorDirection` | enum | Travel direction at the moment of this event |
| `timestamp` | `DateTimeOffset` | UTC, from backend clock | When the event was processed by the backend |

```csharp
// Backend (C#)
public record FloorEvent(int FloorNumber, ElevatorDirection Direction, DateTimeOffset Timestamp);

public enum ElevatorDirection { Up, Down, Stationary }
```

```typescript
// Frontend (TypeScript)
export type ElevatorDirection = 'Up' | 'Down' | 'Stationary';

export interface FloorEvent {
  floorNumber: number;       // 0-based, ground floor = 0
  direction: ElevatorDirection;
  timestamp: string;         // ISO 8601 UTC string from JSON serialisation
}
```

**Validation rules**:
- `floorNumber` outside `[0, buildingConfig.totalFloors - 1]` → fault indicator (not silent)
- `direction` not a known enum value → fault indicator
- Missing or malformed payload → fault indicator, last-known state retained

---

### 2. `BuildingConfiguration` (Backend → Frontend, fetched once on connect)

Provides the floor count so the shaft diagram renders without hardcoding.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `totalFloors` | `int` | 2 ≤ n ≤ 20 | Number of floors in the building |

```csharp
// Backend (C#)
public record BuildingConfiguration(int TotalFloors);
```

```typescript
// Frontend (TypeScript)
export interface BuildingConfiguration {
  totalFloors: number;  // 2–20
}
```

**Floor labelling**: Floors are non-negative integers 0, 1, …, N-1. Floor 0 is ground floor (German
convention). The dashboard renders these as "Floor 0", "Floor 1", etc. (or "EG", "1.OG" etc. if
localisation is added — out of scope for this feature).

---

### 3. `ElevatorState` (Frontend-only, derived from last received `FloorEvent`)

The in-memory snapshot held in React state. Never persisted. Strictly a projection of the last
received `FloorEvent`.

| Field | Type | Description |
|-------|------|-------------|
| `currentFloor` | `number` | Floor number from the last `FloorEvent` |
| `direction` | `ElevatorDirection` | Direction from the last `FloorEvent` |
| `lastEventAt` | `Date` | Client-side timestamp of when the event was received; used for cold-start tie-breaking only (never displayed) |
| `backendTimestamp` | `string` | ISO 8601 timestamp from the `FloorEvent.timestamp` field |

**Note**: `lastEventAt` uses the client clock to record when an event was received locally. It is
used only for cold-start tie-breaking (comparing against `ElevatorStateDto.timestamp` to determine
which is newer) and is never displayed to the operator. All displayed timestamps come from
`backendTimestamp`. Stale-data detection is handled exclusively by SignalR lifecycle events
(`onreconnecting`, `onclose`) — there is no client-side idle timer.

---

### 4. `ConnectionState` (Frontend-only enum)

Drives banner visibility and stale overlay. Maps directly to SignalR connection lifecycle hooks.

| Value | SignalR Hook | UI Effect |
|-------|-------------|-----------|
| `AwaitingData` | Initial; connected but no `FloorEvent` yet | "Awaiting data" placeholder (FR-004) |
| `Connected` | `onreconnected` or first event received | Normal operation, no banner |
| `Reconnecting` | `onreconnecting` | "Reconnecting…" banner; last-known floor remains visible |
| `Disconnected` | `onclose` (retries exhausted) | "Stale data" warning banner; last-known floor remains visible |

> **Note**: An open connection with no recent `FloorEvent` (elevator stationary) is treated as `Connected` — no stale banner. The stale warning only appears after SignalR itself confirms the connection is lost. Detection lag is governed by SignalR's `ServerTimeout` (default 30 s); this is acceptable for this dashboard.

---

## State Transitions

```
Initial load
    └─► AwaitingData
            ├─► Connected (first FloorEvent received)
            │       └─► Reconnecting (SignalR onreconnecting)
            │               ├─► Connected (onreconnected + snapshot applied)
            │               └─► Disconnected (onclose, retries exhausted)
            └─► Disconnected (connection fails before first event)
```

---

## Floor Map Coordinate Model

The SVG shaft height is a fixed CSS value (e.g., 400 px). Floor cells divide it evenly:

```
cellHeight = shaftHeight / totalFloors
carY       = (totalFloors - 1 - currentFloor) * cellHeight
```

Floor 0 (ground) maps to the bottom of the shaft; floor N-1 maps to the top. The car `<g>` element
is translated to `carY` with a 200 ms CSS ease-in-out transition on `transform`.
