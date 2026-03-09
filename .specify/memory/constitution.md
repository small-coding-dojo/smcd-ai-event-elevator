<!--
SYNC IMPACT REPORT
==================
Version change: (template) → 1.0.0
Modified principles: N/A (initial ratification from blank template)
Added sections:
  - Core Principles (5 principles)
  - Technology Stack Constraints
  - Development Workflow
  - Governance
Removed sections: N/A (template placeholders replaced)
Templates reviewed:
  - .specify/templates/plan-template.md ✅ — "Constitution Check" gate aligns with principles below
  - .specify/templates/spec-template.md ✅ — functional requirements and success criteria sections
    remain consistent; no mandatory section changes required
  - .specify/templates/tasks-template.md ✅ — task phases and parallel patterns unchanged;
    task categories (Setup, Foundational, User Story, Polish) cover separation and UI quality tasks
  - .specify/templates/constitution-template.md ✅ — source template, no changes needed
Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Confirm original adoption date; set to 2026-03-09 (today) as
    this is the initial fill. Update if the project pre-dates this conversation.
  - No frontend framework has been selected yet; update Principle II and the Technology Stack
    section once the stack is decided.
-->

# Event Elevator Constitution

## Core Principles

### I. Operator-Facing UI Quality (NON-NEGOTIABLE)

The operator UI is safety-critical instrumentation, not a consumer application. Every screen
element MUST communicate elevator state unambiguously:

- All interactive controls MUST provide immediate visual feedback (within one animation frame)
  confirming that an input was received.
- Error and fault states MUST be visually distinct from normal operation — color alone is
  insufficient; pair color with icon or label.
- The UI MUST remain usable under degraded backend connectivity: stale-state indicators MUST
  appear when live data has not refreshed within a defined staleness threshold (≤ 5 s).
- Layout and contrast MUST meet WCAG 2.1 AA accessibility standards.
- No UI element MUST require an operator to recall system state from memory; all relevant
  state (current floor, direction, pending calls, door status) MUST be visible simultaneously.

**Rationale**: Operators act on what they see. A misleading or unclear UI can cause missed
events, delayed responses, or unsafe decisions. Quality here is a correctness requirement,
not a polish concern.

### II. Real-Time Data Visualization Standards

Elevator state is continuous and time-sensitive; visualization MUST reflect this:

- All floor-position and state-change updates MUST be rendered within 500 ms of the
  corresponding backend event being emitted.
- Visualizations MUST derive their data model directly from backend event payloads — no
  client-side inference or reconstruction of elevator state is permitted.
- Animation MUST communicate directionality (ascending vs. descending) and MUST NOT mislead
  when the elevator is stationary.
- Historical event data (call log, trip history) MUST be displayed in chronological order
  with timestamps sourced from the backend, never from client-side clocks.
- Charts and indicators MUST degrade gracefully when event streams are interrupted; a
  loading/stale overlay is required rather than a frozen last-known value presented as live.

**Rationale**: Operators make decisions based on what the visualization shows. Stale, inferred,
or incorrect data creates the same risk as no data. Strict sourcing from backend events
eliminates a category of display-logic bugs.

### III. .NET Event-Driven Backend Consistency

The backend is authoritative. All state transitions originate in and are governed by the
.NET event pipeline:

- All elevator control actions (floor selection, door commands, emergency stops) MUST be
  expressed as events submitted to the `EventAggregator`. Direct property mutation or
  method calls that bypass the event pipeline are prohibited.
- New event types MUST follow the `*Event` naming convention established by
  `ButtonPressedEvent.cs` and MUST be self-contained (carry all data needed to act on them).
- The `EventAggregator` singleton MUST remain the single source of truth for in-flight
  elevator state; no secondary state stores are permitted in the backend without explicit
  justification in the plan's Complexity Tracking table.
- Frontend-to-backend communication MUST use the same event contracts consumed internally;
  no bespoke REST or RPC layer may be introduced that duplicates event semantics.

**Rationale**: The event-driven architecture provides auditability, testability, and a clear
causal chain. Bypassing it fragments the state model and undermines the audit trail.

### IV. Frontend/Backend Separation

Display logic and control logic MUST NOT be co-located:

- The frontend MUST contain ONLY: rendering, user input capture, event subscription, and
  data formatting for display. No elevator control logic (sequencing, scheduling, safety
  interlocks) is permitted in frontend code.
- The backend MUST contain ONLY: elevator control logic, event processing, and state
  management. No presentation formatting, localization strings, or UI layout decisions are
  permitted in backend code.
- The boundary between frontend and backend MUST be defined by a versioned event contract.
  Any change to a shared event schema requires updating the contract document before
  implementation begins.
- Frontend code MUST NOT read `EventAggregator` directly; it MUST consume a published
  interface (API, SignalR hub, or equivalent) that the backend exposes.

**Rationale**: Blurring the boundary makes both layers harder to test in isolation and
creates coupling that prevents independent evolution of the UI and the control system.

### V. Simplicity & Testability

Complexity MUST be justified; simplicity is the default:

- Every component MUST be independently testable without standing up the full system.
  The existing `EventElevator.Tests` project pattern MUST be extended, not bypassed.
- Abstractions MUST be introduced only when they eliminate duplication across ≥ 3 concrete
  cases or when required by a principle above. YAGNI applies.
- Unit tests MUST cover: event creation, event aggregation, and controller input handling.
  Integration tests MUST cover: end-to-end event flow from button press to state change.
- Test coverage for the backend elevator control logic MUST NOT drop below existing levels
  when new features are added.

**Rationale**: An elevator control system that cannot be tested safely cannot be shipped
safely. Testability is a first-class design constraint, not an afterthought.

## Technology Stack Constraints

- **Backend**: .NET (C#), event-driven via `EventAggregator` singleton pattern.
  Framework version: inherit from `EventElevator.csproj`; MUST NOT downgrade.
- **Frontend**: TODO(FRONTEND_STACK): No frontend framework selected yet. Once chosen,
  record here. MUST support real-time event subscription (e.g., SignalR, WebSockets, SSE).
- **Testing**: xUnit (as established by `EventElevator.Tests`). Frontend tests MUST use a
  framework compatible with the chosen frontend stack.
- **Communication**: Backend MUST expose a real-time push mechanism for frontend event
  consumption. Pull-based polling is NOT permitted for live elevator state updates.

## Development Workflow

- Every user-facing change MUST include a corresponding acceptance scenario in the feature
  spec before implementation begins.
- The "Constitution Check" gate in `plan-template.md` MUST be evaluated against all five
  principles above before Phase 0 research proceeds.
- Frontend and backend changes that touch a shared event contract MUST be reviewed together
  in the same pull request.
- Any deviation from these principles MUST be documented in the plan's Complexity Tracking
  table with explicit justification and a simpler alternative rejected with reasoning.
- This constitution supersedes all prior verbal or informal agreements. When in conflict,
  the constitution takes precedence.

## Governance

- **Amendments** require: (1) updating this file with a version bump, (2) propagating
  changes to all affected templates, and (3) recording the sync impact in the HTML comment
  at the top of this file.
- **Versioning policy**: MAJOR for principle removal or incompatible redefinition; MINOR
  for new principle or materially expanded guidance; PATCH for clarifications and wording.
- **Compliance review**: All pull requests MUST include a Constitution Check confirming no
  principle is violated. Reviewers are responsible for flagging violations before merge.
- **Guidance file**: Refer to `.specify/memory/constitution.md` (this file) as the runtime
  governance reference during all speckit workflow steps.

**Version**: 1.0.0 | **Ratified**: 2026-03-09 | **Last Amended**: 2026-03-09
