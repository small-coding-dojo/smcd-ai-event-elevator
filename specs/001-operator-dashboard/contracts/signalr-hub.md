# Contract: ElevatorHub (SignalR)

**Version**: 1.0
**Date**: 2026-03-13
**Transport**: ASP.NET Core SignalR (WebSockets / SSE fallback)
**Hub URL**: `/hubs/elevator` (configurable via `NEXT_PUBLIC_HUB_URL`)

> **Constitution IV compliance**: This document is the versioned event contract. Any change to hub
> method signatures or payload shapes requires a version bump here before implementation begins.
> Frontend and backend changes touching this contract MUST be reviewed in the same pull request.

---

## Hub Methods (Server → Client)

These methods are pushed by the server to all connected clients.

### `ReceiveFloorEvent`

Emitted once per floor as the elevator arrives at or passes through that floor.

```typescript
// TypeScript client handler
connection.on('ReceiveFloorEvent', (event: FloorEvent) => { ... });
```

```csharp
// C# hub context invocation (from ElevatorBroadcastService)
await hubContext.Clients.All.SendAsync("ReceiveFloorEvent", floorEvent, cancellationToken);
```

**Payload**: [`FloorEvent`](../data-model.md#1-floorevent-backend--frontend-contract)

| Field | Type | Example |
|-------|------|---------|
| `floorNumber` | `int` | `3` |
| `direction` | `string` (enum) | `"Up"` / `"Down"` / `"Stationary"` |
| `timestamp` | `string` (ISO 8601 UTC) | `"2026-03-13T14:23:01.123Z"` |

**Frequency**: Once per discrete floor traversal event. Events are NOT coalesced; every floor-by-
floor position change produces exactly one `ReceiveFloorEvent`.

---

## Hub Methods (Client → Server)

These methods are invoked by the frontend client after connection is established.

### `GetBuildingConfiguration`

Called once on connect to retrieve the total floor count for shaft diagram rendering.

```typescript
// TypeScript invocation
const config = await connection.invoke<BuildingConfiguration>('GetBuildingConfiguration');
```

```csharp
// C# hub method
public Task<BuildingConfiguration> GetBuildingConfiguration()
    => Task.FromResult(_configService.GetBuildingConfiguration());
```

**Returns**: [`BuildingConfiguration`](../data-model.md#2-buildingconfiguration-backend--frontend-fetched-once-on-connect)

| Field | Type | Example |
|-------|------|---------|
| `totalFloors` | `int` | `10` |

---

## Connection Lifecycle

| Event | Client action |
|-------|--------------|
| Connected | Invoke `GetBuildingConfiguration`; set state to `AwaitingData` |
| `ReceiveFloorEvent` received | Update `ElevatorState`; set state to `Connected` |
| `onreconnecting` | Set state to `Reconnecting`; show banner |
| `onreconnected` | Re-invoke `GetBuildingConfiguration`; set state to `Connected` |
| `onclose` | Set state to `Disconnected`; retain last-known floor |
| 5 s timer fires with no event | Set state to `Stale`; show stale-data banner |

**Reconnect policy**: `withAutomaticReconnect([0, 2000, 5000, 10000])` — retries at 0, 2, 5, 10 s.
After exhausting retries, `onclose` fires.

---

## CORS Configuration

The .NET backend MUST allow the frontend origin in `Program.cs`:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins(builder.Configuration["AllowedOrigins"]!.Split(','))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()); // required for SignalR
});
```

`AllowCredentials()` is required by SignalR's transport negotiation.

---

### `GetCurrentElevatorState`

Called immediately after connection is established **and** after every successful reconnect.
Returns the latest known `ElevatorState` snapshot so the dashboard reflects current elevator
position without waiting for the next live `FloorEvent`. Returns `null` if the elevator has
not reported any position yet (dashboard remains in "Awaiting data" state).

```typescript
// TypeScript invocation
const state = await connection.invoke<ElevatorState | null>('GetCurrentElevatorState');
```

```csharp
// C# hub method
public Task<ElevatorStateDto?> GetCurrentElevatorState()
    => Task.FromResult(_elevatorStateService.GetCurrentState());

public record ElevatorStateDto(int FloorNumber, ElevatorDirection Direction, DateTimeOffset Timestamp);
```

**Returns**: `ElevatorState` (same shape as `FloorEvent` payload) or `null`.

**Call order on connect**: invoke `GetBuildingConfiguration` and `GetCurrentElevatorState`
concurrently; render only when both have resolved.

**Call order on reconnect**: invoke `GetCurrentElevatorState` immediately after `onreconnected`;
apply snapshot before resuming live `FloorEvent` processing.

---

## Versioning

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-13 | Initial definition |
| 1.1 | 2026-03-13 | Added GetCurrentElevatorState hub method (called on connect and reconnect) |
