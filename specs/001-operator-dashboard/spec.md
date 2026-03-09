# Feature Specification: Operator Elevator Status Dashboard

**Feature Branch**: `001-operator-dashboard`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "Build a frontend dashboard for service operators that
visualizes the elevator's current status and its location and motion across floors."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Real-Time Floor Position Display (Priority: P1)

A service operator opens the dashboard and immediately sees which floor the elevator is
currently on. The floor indicator updates automatically as the elevator moves, without
any manual refresh.

**Why this priority**: Knowing the elevator's current location is the most fundamental
piece of information an operator needs. All other visualizations build on top of it.

**Independent Test**: Open the dashboard while the elevator is stationary on a known
floor. Confirm the correct floor is displayed. Then trigger a floor change in the backend
and confirm the display updates without a page reload.

**Acceptance Scenarios**:

1. **Given** the elevator is stationary on floor 3, **When** the operator views the
   dashboard, **Then** the floor indicator shows "Floor 3" (or equivalent).
2. **Given** the elevator moves from floor 2 to floor 4, **When** the move is processed
   by the backend, **Then** the floor indicator transitions from 2 to 4 within 500 ms of
   the backend event being emitted.
3. **Given** the backend connection is lost, **When** the operator views the dashboard,
   **Then** a stale-data indicator is visible and the last-known floor is shown rather
   than a blank state.

---

### User Story 2 - Motion State and Direction Display (Priority: P2)

The operator can see at a glance whether the elevator is currently moving or stationary,
and if moving, whether it is travelling up or down.

**Why this priority**: Motion state and direction are needed to interpret floor position
in context (e.g., is the elevator approaching a floor or leaving it?). Without this,
position alone can be ambiguous.

**Independent Test**: Observe the dashboard while the elevator is stationary — a
"Stationary" or equivalent indicator is shown. Trigger an upward move and confirm the
direction indicator changes to "Moving Up". Trigger a downward move and confirm it shows
"Moving Down".

**Acceptance Scenarios**:

1. **Given** the elevator is stationary, **When** the operator views the dashboard,
   **Then** a clear stationary/idle state indicator is displayed.
2. **Given** the elevator is moving upward, **When** the dashboard receives the update,
   **Then** an upward-direction indicator is shown alongside the current floor.
3. **Given** the elevator is moving downward, **When** the dashboard receives the update,
   **Then** a downward-direction indicator is shown alongside the current floor.
4. **Given** the elevator transitions from moving to stationary, **When** the event
   arrives, **Then** the motion indicator updates to stationary within 500 ms.

---

### User Story 3 - Visual Shaft Floor Map (Priority: P3)

The operator sees a graphical representation of the elevator shaft with the elevator
car's position shown on a vertical floor map. This provides spatial context that
complements the text-based indicators.

**Why this priority**: The visual map improves situational awareness when multiple floors
are involved, but the system remains fully usable with P1 and P2 alone.

**Independent Test**: Load the dashboard with the elevator on the lowest floor — the car
icon appears at the bottom of the shaft diagram. Move the elevator to the top floor and
confirm the car icon moves to the top.

**Acceptance Scenarios**:

1. **Given** a multi-floor building configuration, **When** the dashboard loads, **Then**
   a vertical shaft diagram displays all floors with the elevator car at the correct
   floor.
2. **Given** the elevator moves between floors, **When** a FloorEvent is received,
   **Then** the car icon slides with a brief animation (≤200 ms) to the new floor
   position in the correct direction (up or down).
3. **Given** the elevator is stationary, **When** the operator views the shaft diagram,
   **Then** the car icon is stationary and no directional animation plays.

---

### Edge Cases

- What happens when the dashboard loads before the backend has emitted any event (cold
  start)? The dashboard MUST show an "Awaiting data" state rather than defaulting to an
  arbitrary floor.
- What happens when events arrive in rapid succession (e.g., elevator passing multiple
  floors quickly)? The display MUST update on every `FloorEvent` received; no events
  are skipped or coalesced — each floor-by-floor position change is shown.
- What happens when the backend reports an unknown or invalid floor number? The dashboard
  MUST show a fault indicator rather than silently displaying incorrect data.
- How does the display handle a building with only 2 floors vs. one with 10+ floors? The
  floor map MUST adapt to the configured number of floors without hardcoding.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The dashboard MUST display the elevator's current floor in real time.
  The backend emits a `FloorEvent` once per floor as the elevator passes through or
  arrives at each floor; the dashboard MUST update the floor indicator on every such
  event, tracking position floor-by-floor. Each update MUST appear within 500 ms of
  the event being emitted.
- **FR-002**: The dashboard MUST display the elevator's current motion state:
  "Moving Up", "Moving Down", or "Stationary".
- **FR-003**: The dashboard MUST display a stale-data warning when live data has not
  refreshed within 5 seconds. When connectivity recovers, the dashboard MUST
  auto-reconnect without operator action and MUST display a brief "Connection restored"
  banner that dismisses automatically after a few seconds.
- **FR-004**: The dashboard MUST show an "Awaiting data" state on initial load until the
  first event is received from the backend.
- **FR-005**: The dashboard MUST render a vertical shaft diagram showing all configured
  floors and the elevator car's current position. On each FloorEvent, the car icon MUST
  animate with a brief slide (≤200 ms) to the new floor position; no inter-floor
  interpolation beyond this discrete per-event transition is permitted.
- **FR-006**: All data displayed MUST be sourced exclusively from backend events; no
  client-side inference or reconstruction of state is permitted.
- **FR-007**: The dashboard MUST be read-only and MUST NOT expose any controls that send
  commands to the backend.
- **FR-011**: The dashboard MUST display current elevator state only; no historical event
  log or trip history is shown.
- **FR-008**: The dashboard MUST meet WCAG 2.1 AA accessibility standards — contrast,
  keyboard navigation, and screen-reader labels for all state indicators.
- **FR-009**: State transitions (floor change, direction change) MUST NOT rely on color
  alone; each state MUST also use an icon or text label.
- **FR-010**: The dashboard MUST function correctly for buildings configured with 2 to 20
  floors without code changes. Floor labels are non-negative integers starting at 0
  (ground floor = 0), following the German floor-numbering convention.

### Key Entities

- **ElevatorState**: The current snapshot of the elevator — floor number, motion
  direction (Up / Down / Stationary), and a timestamp from the backend.
- **FloorEvent**: A discrete backend event emitted once per floor as the elevator either
  passes through or arrives at that floor, carrying the floor number and direction of
  travel at that moment. The dashboard updates the displayed floor on every received
  event, tracking position floor-by-floor as the elevator moves.
- **BuildingConfiguration**: The total number of floors; drives floor map rendering and
  is sourced from the backend, not hardcoded. Floors are numbered as non-negative
  integers starting at 0 (ground floor = 0, first upper floor = 1, etc.), following
  the German convention. No basement or mezzanine labels.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Elevator floor and motion state updates appear on screen within 500 ms of
  the backend event being emitted, verified by end-to-end timing observation.
- **SC-002**: The stale-data indicator appears no later than 5 seconds after backend
  connectivity is lost, verified by disconnection simulation.
- **SC-003**: The dashboard passes WCAG 2.1 AA automated accessibility checks with zero
  violations on all state indicators.
- **SC-004**: An operator unfamiliar with the system can correctly identify the current
  floor, motion state, and direction within 5 seconds of viewing the dashboard.
- **SC-005**: The dashboard correctly handles buildings configured with 2, 5, and 20
  floors without layout overflow or visual defects.

## Clarifications

### Session 2026-03-09

- Q: When does a FloorEvent fire, and what should the dashboard display while the elevator is in transit between floors? → A: Event fires once per floor when the elevator arrives at or passes through a floor; dashboard tracks and displays position floor-by-floor as each event arrives.
- Q: When the backend connection drops and recovers, should the dashboard auto-reconnect or require operator action? → A: Auto-reconnect with a visible "Connection restored" banner that dismisses automatically.
- Q: Should the dashboard include a historical event log or show current state only? → A: Current state only — no event history log.
- Q: What floor numbering convention does the building use? → A: Non-negative integers starting at 0 (ground floor = 0, first upper floor = 1…), German convention.
- Q: How should the shaft diagram car icon move between floor positions? → A: Brief animated slide (≤200 ms) per received FloorEvent; one discrete step per event.

## Assumptions

- The backend will expose a push-based real-time channel (e.g., SignalR hub or
  WebSocket) that emits `FloorEvent` payloads; the exact protocol is TBD and will be
  confirmed during planning.
- The number of floors is provided by a backend configuration endpoint or included in
  the connection handshake; it is not hardcoded in the frontend.
- Only one elevator is in scope for this feature; multi-elevator support is out of scope.
- The dashboard is a web application accessed via a modern browser on an
  operator workstation; no native mobile app is required.
- Authentication and authorization are out of scope; the dashboard is assumed to be
  deployed on an internal or trusted network.
