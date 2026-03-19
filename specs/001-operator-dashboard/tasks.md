# Tasks: Operator Elevator Status Dashboard

**Input**: Design documents from `/specs/001-operator-dashboard/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**:
- **Backend (xUnit)**: MANDATORY per Constitution V — unit tests MUST cover event creation, event aggregation, and any new service in the event pipeline. Write and confirm failure before implementing.
- **Frontend (Jest/RTL, Playwright)**: Not requested — omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bootstrap both the .NET backend additions and the new Next.js 15 frontend app.

- [ ] T001 Create Next.js 15 app at repo root: `npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"` — produces `frontend/package.json`, `frontend/next.config.ts`, `frontend/tsconfig.json`, `frontend/src/app/layout.tsx`
- [ ] T002 Install SignalR client in frontend: `npm install @microsoft/signalr` in `frontend/`
- [ ] T003 [P] Create `frontend/.env.local` with `NEXT_PUBLIC_HUB_URL=http://localhost:5000/hubs/elevator`
- [ ] T004 [P] Create `EventElevator/EventElevator/Events/FloorEvent.cs` — `FloorEvent` record and `ElevatorDirection` enum (Up / Down / Stationary) in namespace `EventElevator.Events`
- [ ] T005 [P] Create `frontend/src/lib/types.ts` — TypeScript types for `ElevatorDirection`, `FloorEvent`, `BuildingConfiguration`, `ElevatorState`, and `ConnectionState` enum (AwaitingData / Connected / Reconnecting / Disconnected)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend SignalR infrastructure and frontend connection hook that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Update `EventElevator/EventElevator/Program.cs` — add `builder.Services.AddSignalR()`, CORS policy `"Frontend"` allowing `AllowedOrigins` config value with `AllowCredentials()`, `app.UseCors("Frontend")`, and `app.MapHub<ElevatorHub>("/hubs/elevator")`
- [ ] T007 Extend `EventElevator/EventElevator/EventAggregator.cs` — add: (a) `Add(FloorEvent floorEvent)` overload that appends to an internal `List<FloorEvent>`; (b) `event Action<FloorEvent>? FloorEventRaised` fired inside `Add` after appending; (c) `FloorEvent? LastFloorEvent()` returning `_floorEvents.LastOrDefault()`. `EventAggregator` remains the single source of truth — no secondary cache needed elsewhere.
- [ ] T008 Create `EventElevator/EventElevator/Hubs/ElevatorHub.cs` — `ElevatorHub : Hub` with: (a) `GetBuildingConfiguration()` reading `TotalFloors` from injected `IConfiguration` (key `"Building:TotalFloors"`), returning `BuildingConfigurationDto(TotalFloors)`; (b) `GetCurrentElevatorState()` calling `EventAggregator.GetEventAggregator().LastFloorEvent()` and mapping to `ElevatorStateDto?(FloorNumber, Direction, Timestamp)` or `null` if none recorded yet. No `IElevatorStateService` or `IBuildingConfigurationService` — reads directly from `EventAggregator` and `IConfiguration`.
- [ ] T009 Create `EventElevator/EventElevator.Tests/ElevatorBroadcastServiceIntegrationTests.cs` — integration test using `WebApplicationFactory<Program>` and a real `HubConnection` (`Microsoft.AspNetCore.SignalR.Client`): (a) call `EventAggregator.GetEventAggregator().Add(new FloorEvent(...))` directly; assert the connected SignalR client receives `ReceiveFloorEvent` with matching `floorNumber`, `direction`, and `timestamp`; (b) assert no `ReceiveFloorEvent` is received when no `FloorEvent` is added. No mocks — real app, real client, real `EventAggregator`. Confirm test FAILS before T010 is implemented.
- [ ] T010 Create `EventElevator/EventElevator/Services/ElevatorBroadcastService.cs` — `IHostedService` that subscribes to `EventAggregator.GetEventAggregator().FloorEventRaised` and on each `FloorEvent` calls `IHubContext<ElevatorHub>.Clients.All.SendAsync("ReceiveFloorEvent", payload, ct)`; register in `Program.cs` with `AddHostedService<ElevatorBroadcastService>()`
- [ ] T011 [P] Create `frontend/src/lib/signalr.ts` — export `createHubConnection()` factory that builds a `HubConnectionBuilder` pointed at `process.env.NEXT_PUBLIC_HUB_URL` with `.withAutomaticReconnect([0, 2000, 5000, 10000])`
- [ ] T012 Create `frontend/src/hooks/useElevatorHub.ts` — `'use client'` hook that: (a) creates and starts the hub connection from `signalr.ts`; (b) immediately invokes `GetBuildingConfiguration` and `GetCurrentElevatorState` concurrently on connect, buffers any `ReceiveFloorEvent` that arrives before both resolve, and on resolution applies whichever is newer by comparing `FloorEvent.timestamp` against `ElevatorStateDto.timestamp`; (c) sets `lastEventAt = new Date()` on the client when applying any snapshot or live event; (d) manages `ConnectionState` transitions: `onreconnecting` → `Reconnecting`; `onreconnected` → `Connected`; `onclose` → `Disconnected`; open-but-idle connection stays `Connected` (no timer); (e) tracks `wasReconnecting` flag — set to `true` on `onreconnecting`, cleared after the "Connection restored" banner auto-dismisses; (f) re-invokes `GetCurrentElevatorState` on `onreconnected` before resuming live event processing; (g) returns `{ floor, direction, connectionState, buildingConfig, lastEventAt, wasReconnecting }`

**Checkpoint**: `EventAggregator` is the sole backend state source; hub reads from it directly; integration test passes; frontend hook connects and exposes reactive state — foundation ready for all user stories.

---

## Phase 3: User Story 1 — Real-Time Floor Position Display (Priority: P1) 🎯 MVP

**Goal**: Operator opens the dashboard and sees the current floor, auto-updating on each `FloorEvent`, with correct cold-start and disconnection behaviour.

**Independent Test**: Open the dashboard while the elevator is stationary on a known floor; confirm correct floor is shown. Trigger a floor change in the backend and confirm the display updates within 500 ms without a page reload. Simulate connection loss; confirm the stale-data banner appears and last-known floor is retained.

- [ ] T013 [US1] Create `frontend/src/components/AwaitingData.tsx` — renders an "Awaiting data" placeholder (text + accessible role) shown when `connectionState === 'AwaitingData'`; no floor content rendered
- [ ] T014 [P] [US1] Create `frontend/src/components/FloorIndicator.tsx` — displays `"Floor {n}"` from `floor` prop; renders a fault indicator (distinct styling + text) when `floor` is `null` or outside `[0, buildingConfig.totalFloors - 1]`; WCAG 2.1 AA contrast
- [ ] T015 [P] [US1] Create `frontend/src/components/ConnectionBanner.tsx` — renders three distinct banners driven by `connectionState` and `wasReconnecting` props: (a) **Stale-data warning** (Disconnected state), (b) **Reconnecting…** indicator (Reconnecting state, last-known floor remains visible beneath), (c) **Connection restored** banner (Connected state when `wasReconnecting` is true, auto-dismisses after 3 s); no banner shown in AwaitingData or normal Connected state
- [ ] T016 [US1] Create `frontend/src/app/page.tsx` — server-component shell that renders a `'use client'` `<DashboardClient>` boundary; `DashboardClient` calls `useElevatorHub`, renders `AwaitingData` when state is `AwaitingData`, otherwise renders `FloorIndicator` and `ConnectionBanner` with props wired to hook output
- [ ] T017 [US1] Update `frontend/src/app/layout.tsx` — set document title "Elevator Dashboard", include viewport meta, wire Tailwind globals; keep as minimal server component

**Checkpoint**: User Story 1 fully functional — floor displays and updates in real time; stale/reconnecting/restored banners work; cold-start shows awaiting state.

---

## Phase 4: User Story 2 — Motion State and Direction Display (Priority: P2)

**Goal**: Operator sees at a glance whether the elevator is stationary, moving up, or moving down, alongside the floor indicator.

**Independent Test**: With elevator stationary, confirm "Stationary" indicator is shown. Trigger an upward move; confirm "Moving Up" appears within 500 ms. Trigger a downward move; confirm "Moving Down" appears. Confirm that when the elevator stops, the indicator reverts to "Stationary" within 500 ms of the event.

- [ ] T018 [US2] Create `frontend/src/components/MotionStateIndicator.tsx` — renders icon + text label for each `ElevatorDirection` value (Up arrow + "Moving Up" / Down arrow + "Moving Down" / Pause icon + "Stationary"); never color-only (FR-009); WCAG 2.1 AA contrast; accepts `direction: ElevatorDirection | null` and renders a neutral state when null
- [ ] T019 [US2] Integrate `MotionStateIndicator` into `frontend/src/app/page.tsx` — add `<MotionStateIndicator direction={direction} />` inside `DashboardClient` alongside `FloorIndicator`; visible in Connected and Disconnected states (hidden in AwaitingData)

**Checkpoint**: User Story 2 fully functional — direction indicator updates on every `FloorEvent` and is shown/hidden correctly across all connection states.

---

## Phase 5: User Story 3 — Visual Shaft Floor Map (Priority: P3)

**Goal**: Operator sees a graphical elevator shaft with the car's position updating with a ≤200 ms CSS animation on each `FloorEvent`.

**Independent Test**: Load the dashboard with the elevator on the lowest floor (floor 0); car icon appears at the bottom of the shaft. Move the elevator to the top floor; car icon slides to the top. Verify that rapid successive `FloorEvent`s cancel in-progress animations and start fresh from the current visual position.

- [ ] T020 [US3] Create `frontend/src/components/ElevatorShaft.tsx` — inline SVG shaft with: (a) floor cell labels for floors 0 to `totalFloors - 1` (bottom = 0, top = N-1); (b) car `<g>` element positioned at `carY = (totalFloors - 1 - currentFloor) * cellHeight` with `style={{ transition: 'transform 200ms ease-in-out' }}`; (c) `aria-label="Elevator shaft"` + `role="img"` on SVG; (d) car group `aria-label={`Elevator at floor ${currentFloor}`}`; (e) adapts to any `totalFloors` 2–20 with no hardcoded floor count; accepts `currentFloor: number`, `totalFloors: number`, `direction: ElevatorDirection` props
- [ ] T021 [US3] Integrate `ElevatorShaft` into `frontend/src/app/page.tsx` — render `<ElevatorShaft currentFloor={floor} totalFloors={buildingConfig.totalFloors} direction={direction} />` inside `DashboardClient` when not in AwaitingData state; pass `null`-safe defaults while buildingConfig is loading

**Checkpoint**: User Story 3 fully functional — shaft diagram renders for 2–20 floors; car animates floor-by-floor on each `FloorEvent`; in-progress animation cancels correctly on rapid events.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: WCAG compliance verification, invalid-payload fault indicator, and environment validation.

- [ ] T022 [P] Audit WCAG 2.1 AA visual compliance across all components — verify contrast ratios ≥ 4.5:1 (normal text) and ≥ 3:1 (large text + UI component boundaries) in `frontend/src/components/`; verify no content flashes more than 3 times per second; fix any violations in Tailwind classes
- [ ] T023 [P] Add fault indicator to `frontend/src/app/page.tsx` — when `useElevatorHub` receives a `FloorEvent` with `floorNumber` outside `[0, buildingConfig.totalFloors - 1]` or an unrecognised `direction`, render a distinct fault state in `FloorIndicator` and `MotionStateIndicator` rather than silently displaying invalid data; retain last valid state
- [ ] T024 [P] Update `frontend/next.config.ts` — verify no conflicting rewrites with `/hubs/elevator` SignalR WebSocket upgrade path
- [ ] T025 Validate `quickstart.md` end-to-end — run both `dotnet run` and `npm run dev`, open `http://localhost:3000`, confirm "Awaiting data" state; manually trigger a `FloorEvent` from the backend and confirm floor updates within 500 ms; change `TotalFloors` to 2 and then 20 in `appsettings.json` and confirm shaft and floor indicator render correctly at both extremes; document any discrepancies found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T003, T004, T005 can run in parallel after T001 + T002
- **Foundational (Phase 2)**: Depends on Phase 1; T007 (`EventAggregator` extension) must complete before T008 (hub), T009 (test), T010 (broadcast service); T009 (test) must be written before T010 (implementation); T011 can run in parallel with backend tasks
- **User Stories (Phase 3–5)**: All depend on Phase 2 completion; stories can proceed in priority order or in parallel if team capacity allows
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on US2 or US3
- **US2 (P2)**: Starts after Phase 2; `page.tsx` (T016) must exist for T019 integration
- **US3 (P3)**: Starts after Phase 2; `page.tsx` (T016) must exist for T021 integration

### Within Each User Story

- Backend xUnit tests MUST be written and FAIL before implementation (Constitution V)
- Components (T013–T015, T018, T020) before page integration (T016, T019, T021)
- `page.tsx` must be created (T016) before subsequent integrations (T019, T021)

### Parallel Opportunities

- T003, T004, T005 in Phase 1 (different files)
- T011 in Phase 2 (independent of backend tasks)
- T014, T015 in Phase 3 (different component files)
- T022, T023, T024 in Phase 6 (different concerns)

---

## Parallel Example: User Story 1

```bash
# These two component tasks have no dependency on each other — run in parallel:
Task T014: "Create frontend/src/components/FloorIndicator.tsx"
Task T015: "Create frontend/src/components/ConnectionBanner.tsx"

# Then sequentially:
Task T013: "Create frontend/src/components/AwaitingData.tsx"
Task T016: "Create frontend/src/app/page.tsx (wires all three components)"
Task T017: "Update frontend/src/app/layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**critical — blocks all stories**)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: floor displays, stale-data banner works, cold-start shows awaiting state
5. Demo if ready — a fully functional real-time floor display with connection resilience

### Incremental Delivery

1. Setup + Foundational → backend hub + frontend hook ready
2. Add US1 → floor indicator + connection banners → validate → deploy (MVP)
3. Add US2 → motion/direction indicator → validate → deploy
4. Add US3 → shaft diagram + car animation → validate → deploy
5. Polish phase → WCAG audit + fault indicators → final validation

### Parallel Team Strategy

With two developers after Foundational phase:

- **Dev A**: US1 (T013–T017) then US3 (T020–T021)
- **Dev B**: US2 (T018–T019) then Polish (T022–T025)

---

## Notes

- `[P]` tasks operate on different files with no shared dependencies — safe to parallelise
- `[Story]` label maps each task to a specific user story for traceability
- T007 extends existing `EventAggregator.cs` — `EventAggregator` remains the sole backend state source (Constitution III); no `IElevatorStateService` or `IBuildingConfigurationService` needed
- T009 (integration test) uses `WebApplicationFactory<Program>` + real `HubConnection` — no mocks (Constitution V); triggers via `EventAggregator.Add(FloorEvent)` directly
- `Building:TotalFloors` must be set in `appsettings.json` (e.g., `"Building": { "TotalFloors": 10 }`) for `GetBuildingConfiguration()` to return a value
- `useElevatorHub.ts` (T012): cold-start buffer applies timestamp tie-breaking — apply whichever of the snapshot or held event has the later `timestamp`; `wasReconnecting` gates the "Connection restored" banner to reconnect transitions only
- Animation cancellation in `ElevatorShaft.tsx` (T020) is handled automatically by the browser CSS engine when `transform` changes mid-transition
- `AllowedOrigins` in `Program.cs` should come from configuration (not hardcoded) to support both dev (`http://localhost:3000`) and production domains
