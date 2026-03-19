# Quickstart: Operator Elevator Status Dashboard

**Date**: 2026-03-13

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| .NET SDK | 8.x | Backend API + SignalR hub |
| Node.js | 20 LTS | Next.js frontend |
| npm | 10+ | Frontend package manager |

---

## 1. Backend — Add SignalR Hub

### 1a. Add SignalR (already in .NET 8, no extra package)

SignalR is included in `Microsoft.AspNetCore.App`. No NuGet package needed.

### 1b. Create `FloorEvent.cs`

```csharp
// EventElevator/EventElevator/Events/FloorEvent.cs
namespace EventElevator.Events;

public record FloorEvent(int FloorNumber, ElevatorDirection Direction, DateTimeOffset Timestamp);

public enum ElevatorDirection { Up, Down, Stationary }
```

### 1c. Create `ElevatorHub.cs`

```csharp
// EventElevator/EventElevator/Hubs/ElevatorHub.cs
using Microsoft.AspNetCore.SignalR;

namespace EventElevator.Hubs;

public class ElevatorHub : Hub
{
    private readonly IBuildingConfigurationService _config;

    public ElevatorHub(IBuildingConfigurationService config) => _config = config;

    public Task<BuildingConfigurationDto> GetBuildingConfiguration()
        => Task.FromResult(_config.Get());
}

public record BuildingConfigurationDto(int TotalFloors);
```

### 1d. Wire up in `Program.cs`

```csharp
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();
app.UseCors("Frontend");
app.MapHub<ElevatorHub>("/hubs/elevator");
app.Run();
```

### 1e. Run the backend

```bash
cd EventElevator/EventElevator
dotnet run
# Hub available at: http://localhost:5000/hubs/elevator
```

---

## 2. Frontend — Next.js Setup

### 2a. Create the Next.js app

```bash
# From repo root
npx create-next-app@latest frontend \
  --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend
```

### 2b. Install SignalR client

```bash
npm install @microsoft/signalr
```

### 2c. Environment variables

```bash
# frontend/.env.local
NEXT_PUBLIC_HUB_URL=http://localhost:5000/hubs/elevator
```

### 2d. Run the frontend

```bash
cd frontend
npm run dev
# Dashboard at: http://localhost:3000
```

---

## 3. Running Both Together

```bash
# Terminal 1 — backend
cd EventElevator/EventElevator && dotnet run

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open `http://localhost:3000`. The dashboard shows "Awaiting data" until the backend emits a
`FloorEvent`.

---

## 4. Running Tests

### Backend (xUnit)

```bash
cd EventElevator
dotnet test
```

### Frontend unit tests (Jest + RTL)

```bash
cd frontend
npm test
```

### Frontend E2E (Playwright)

```bash
cd frontend
npx playwright install  # first time only
npx playwright test
```

---

## 5. Key Files Reference

| File | Purpose |
|------|---------|
| `EventElevator/Hubs/ElevatorHub.cs` | SignalR hub (server) |
| `EventElevator/Events/FloorEvent.cs` | Shared event record |
| `frontend/src/hooks/useElevatorHub.ts` | SignalR connection + state management |
| `frontend/src/components/ElevatorShaft.tsx` | SVG shaft + animated car |
| `frontend/src/components/ConnectionBanner.tsx` | Stale / reconnecting / restored banners |
| `specs/001-operator-dashboard/contracts/signalr-hub.md` | Hub contract (versioned) |
