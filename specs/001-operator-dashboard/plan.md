# Implementation Plan: Operator Elevator Status Dashboard

**Branch**: `001-operator-dashboard` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-operator-dashboard/spec.md`

## Summary

Build a read-only Next.js operator dashboard that subscribes to a .NET 8 SignalR hub and visualises
elevator floor position, motion state, and direction in real time. The elevator shaft is rendered as
an SVG with a CSS-transitioned car icon; all displayed state is sourced exclusively from backend
`FloorEvent` payloads. Connection resilience (stale-data warning, auto-reconnect banner) satisfies
FR-003. WCAG 2.1 AA compliance is achieved through semantic SVG ARIA labels and icon+label state
indicators.

## Technical Context

**Language/Version**: C# / .NET 8 (backend) — TypeScript / Next.js 15 (frontend)
**Primary Dependencies**: ASP.NET Core SignalR (backend hub), `@microsoft/signalr` (frontend client), React 19
**Storage**: N/A — stateless display; no persistence layer
**Testing**: xUnit (backend, existing); Jest + React Testing Library (frontend unit); Playwright (E2E acceptance)
**Target Platform**: Modern browser (Chromium / Firefox / Safari) on an operator workstation
**Project Type**: Web application — .NET API + Next.js SPA
**Performance Goals**: Event-to-display ≤ 500 ms (FR-001, SC-001); car-icon animation ≤ 200 ms (FR-005)
**Constraints**: WCAG 2.1 AA (FR-008); no polling (Constitution IV); no client-side state inference (FR-006); read-only (FR-007)
**Scale/Scope**: Single elevator; 2–20 floors (FR-010); single operator session type; no auth

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Status |
|-----------|------------|--------|
| **I — UI Quality** | WCAG 2.1 AA required. Stale-data indicator ≤ 5 s. Icon + label for every state. Immediate visual feedback. All in scope. | ✅ PASS |
| **II — Real-Time Viz** | ≤ 500 ms event-to-display. Data exclusively from backend `FloorEvent` payloads. Stale overlay required on disconnection. No client-side reconstruction. | ✅ PASS |
| **III — Event-Driven Backend** | Frontend consumes a SignalR hub (published interface). Does not call `EventAggregator` directly. `FloorEvent` follows `*Event` naming. | ✅ PASS |
| **IV — Frontend/Backend Separation** | Versioned event contracts in `/contracts/`. Frontend is rendering + subscription only. No control logic, no secondary state stores. | ✅ PASS |
| **V — Simplicity & Testability** | SVG + CSS transitions (no animation library). useState + useContext (no global state library). Components independently testable with RTL. | ✅ PASS |

**Gate result**: All five principles pass. No Complexity Tracking entries required.

**Post-Phase 1 re-check**: See bottom of this document.

## Project Structure

### Documentation (this feature)

```text
specs/001-operator-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── signalr-hub.md
│   └── floor-event.schema.json
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
EventElevator/                        # Existing .NET solution
├── EventElevator/                    # Existing backend project
│   ├── ElevatorController.cs
│   ├── EventAggregator.cs
│   ├── ButtonPressedEvent.cs
│   ├── Hubs/
│   │   └── ElevatorHub.cs            # NEW — SignalR hub
│   ├── Events/
│   │   └── FloorEvent.cs             # NEW — event type emitted to frontend
│   └── Services/
│       └── ElevatorBroadcastService.cs  # NEW — subscribes to EventAggregator; pushes to hub
└── EventElevator.Tests/              # Existing xUnit project (extend, do not bypass)

frontend/                             # NEW — Next.js 15 app (repo root)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Dashboard root (server component shell)
│   ├── components/
│   │   ├── ElevatorShaft.tsx         # SVG shaft + animated car
│   │   ├── FloorIndicator.tsx        # Text floor number display
│   │   ├── MotionStateIndicator.tsx  # Moving Up / Moving Down / Stationary
│   │   ├── ConnectionBanner.tsx      # Stale-data / reconnecting / restored banners
│   │   └── AwaitingData.tsx          # Cold-start placeholder
│   ├── hooks/
│   │   └── useElevatorHub.ts         # SignalR connection lifecycle + state
│   └── lib/
│       └── signalr.ts                # Hub connection factory
├── tests/
│   ├── unit/                         # Jest + RTL component tests
│   └── e2e/                          # Playwright acceptance tests
├── next.config.ts
├── tsconfig.json
└── package.json
```

**Structure Decision**: Web application layout (Option 2 from template). Backend stays in existing
`EventElevator/` solution. Frontend is a new `frontend/` directory at repo root — keeps .NET and
Node.js toolchains fully separated with independent CI pipelines.

## Complexity Tracking

> No Constitution Check violations — table not required.

---

## Post-Phase 1 Constitution Re-Check

After data-model and contract design:

| Principle | Reassessment |
|-----------|--------------|
| **I** | `ConnectionState` enum drives banner + stale overlay; no silent fallback to stale data. WCAG met by SVG ARIA + icon/label pattern. ✅ |
| **II** | `FloorEvent` is the sole data source; `BuildingConfiguration` is fetched once on connect. No derived floor from client math. ✅ |
| **III** | `ElevatorHub` publishes `ReceiveFloorEvent` only after the backend `EventAggregator` raises the event internally. ✅ |
| **IV** | All contracts versioned in `/contracts/`. Hub method signatures are the sole shared boundary. ✅ |
| **V** | No animation library (Framer Motion, GSAP, etc.). No global state manager (Zustand, Redux). SVG + CSS `transition` handles all animation needs within spec. ✅ |
