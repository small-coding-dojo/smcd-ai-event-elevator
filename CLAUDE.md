# smcd-ai-event-elevator Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-13

## Active Technologies

- C# / .NET 8 (backend) — TypeScript / Next.js 15 (frontend) + ASP.NET Core SignalR (backend hub), `@microsoft/signalr` (frontend client), React 19 (001-operator-dashboard)

## Project Structure

```text
EventElevator/          # .NET 8 solution
  EventElevator/        # Backend project (C#)
  EventElevator.Tests/  # xUnit tests
frontend/               # Next.js 15 app (created during 001-operator-dashboard)
specs/                  # Feature specs, plans, contracts
```

## Commands

```bash
# Backend
cd EventElevator && dotnet test
cd EventElevator/EventElevator && dotnet run

# Frontend (once created)
cd frontend && npm test
cd frontend && npm run dev
```

## Code Style

- C#: Follow existing patterns in `EventElevator/EventElevator/`; events named `*Event`; all state via `EventAggregator`
- TypeScript/React: Functional components, `'use client'` on SignalR components

## Recent Changes

- 001-operator-dashboard: Added C# / .NET 8 (backend) — TypeScript / Next.js 15 (frontend) + ASP.NET Core SignalR (backend hub), `@microsoft/signalr` (frontend client), React 19

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
