# EventElevator Backend — Architecture

## Class Diagram

```mermaid
classDiagram
    direction TB

    %% ── Entry Points ──────────────────────────────────────────────

    class Program {
        <<entry point>>
        +MapPost("/api/simulate/floor") : IResult
        +MapHub~ElevatorHub~("/hubs/elevator")
    }

    class ElevatorController {
        +PushFloorButton(targetFloor: int) void
    }

    %% ── Event Store ───────────────────────────────────────────────

    class EventAggregator {
        <<singleton>>
        -_events : List~ButtonPressedEvent~
        -_floorEvents : List~FloorEvent~
        -_aggregator : EventAggregator?  $
        +FloorEventRaised : Action~FloorEvent~?
        +Add(theEvent: ButtonPressedEvent) void
        +Add(floorEvent: FloorEvent) void
        +GetEventAggregator() EventAggregator$
        +LastEvent() ButtonPressedEvent?
        +LastFloorEvent() FloorEvent?
    }

    %% ── Events ────────────────────────────────────────────────────

    class ButtonPressedEvent {
        +TargetFloor : int
    }

    class FloorEvent {
        <<record>>
        +FloorNumber : int
        +Direction : ElevatorDirection
        +Timestamp : DateTimeOffset
    }

    class ElevatorDirection {
        <<enum>>
        Up
        Down
        Stationary
    }

    %% ── SignalR Layer ─────────────────────────────────────────────

    class ElevatorHub {
        <<SignalR Hub>>
        -_config : IConfiguration
        +GetBuildingConfiguration() Task~BuildingConfigurationDto~
        +GetCurrentElevatorState() Task~ElevatorStateDto?~
    }

    class ElevatorBroadcastService {
        <<IHostedService>>
        -_hubContext : IHubContext~ElevatorHub~
        +StartAsync(ct: CancellationToken) Task
        +StopAsync(ct: CancellationToken) Task
        -OnFloorEvent(floorEvent: FloorEvent) void
    }

    %% ── DTOs ──────────────────────────────────────────────────────

    class BuildingConfigurationDto {
        <<record>>
        +TotalFloors : int
    }

    class ElevatorStateDto {
        <<record>>
        +FloorNumber : int
        +Direction : ElevatorDirection
        +Timestamp : DateTimeOffset
    }

    %% ── Relationships ─────────────────────────────────────────────

    ElevatorController ..> EventAggregator : calls GetEventAggregator()
    ElevatorController ..> ButtonPressedEvent : creates

    Program ..> EventAggregator : calls GetEventAggregator()
    Program ..> FloorEvent : creates

    EventAggregator o-- ButtonPressedEvent : stores
    EventAggregator o-- FloorEvent : stores & raises

    FloorEvent --> ElevatorDirection : uses

    ElevatorHub ..> EventAggregator : queries LastFloorEvent()
    ElevatorHub ..> BuildingConfigurationDto : returns
    ElevatorHub ..> ElevatorStateDto : returns
    ElevatorStateDto --> ElevatorDirection : uses

    ElevatorBroadcastService ..> EventAggregator : subscribes to FloorEventRaised
    ElevatorBroadcastService --> ElevatorHub : broadcasts via IHubContext
    ElevatorBroadcastService ..> FloorEvent : handles
```

## Event Flow

```mermaid
sequenceDiagram
    participant Client as Frontend / HTTP Client
    participant API as Program (ASP.NET Core)
    participant EA as EventAggregator
    participant BS as ElevatorBroadcastService
    participant Hub as ElevatorHub (SignalR)

    Note over Client,Hub: Path A — Simulate floor via REST
    Client->>API: POST /api/simulate/floor?floor=3&direction=Up
    API->>EA: Add(FloorEvent)
    EA-->>BS: FloorEventRaised (event)
    BS->>Hub: Clients.All.SendAsync("ReceiveFloorEvent", ...)
    Hub-->>Client: push: ReceiveFloorEvent

    Note over Client,Hub: Path B — Query current state via SignalR
    Client->>Hub: invoke GetCurrentElevatorState()
    Hub->>EA: LastFloorEvent()
    EA-->>Hub: FloorEvent?
    Hub-->>Client: ElevatorStateDto

    Note over Client,Hub: Path C — Button press via ElevatorController
    Client->>API: (internal call)
    API->>+ElevatorController: PushFloorButton(floor)
    ElevatorController->>EA: Add(ButtonPressedEvent)
    ElevatorController-->>-API: (void)
```

## Design Patterns

| Pattern | Where used |
|---|---|
| **Singleton** | `EventAggregator.GetEventAggregator()` — single global event store |
| **Observer** | `EventAggregator.FloorEventRaised` → `ElevatorBroadcastService.OnFloorEvent` |
| **Hub/Push** | `ElevatorBroadcastService` broadcasts via `IHubContext<ElevatorHub>` to all SignalR clients |
| **DTO** | `BuildingConfigurationDto`, `ElevatorStateDto` decouple internal events from the wire contract |
| **Hosted Service** | `ElevatorBroadcastService : IHostedService` wires the observer on startup and cleans up on stop |
