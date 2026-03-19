# UX Requirements Checklist: Operator Elevator Status Dashboard

**Purpose**: Author self-review of UX requirement quality before raising a PR. Tests whether visual state requirements are *complete, measurable, and unambiguous* across all three user stories — not whether the implementation renders correctly.
**Created**: 2026-03-13
**Resolved**: 2026-03-19
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)
**Focus**: Visual states (idle, fault, awaiting-data, shaft diagram) × User Stories 1–3

---

## Idle / Stationary State

- [x] CHK001 — FR-002 specifies "Stationary" as the text label. Tasks T018 enumerates: Pause icon + "Stationary" text label with WCAG 2.1 AA contrast. Measurable criteria present.
- [x] CHK002 — FR-009 requires icon or text label, not color alone. T018 specifies distinct icon + text for each state: Up arrow + "Moving Up", Down arrow + "Moving Down", Pause icon + "Stationary". Three visually distinct treatments.
- [x] CHK003 — The shaft diagram (T020) communicates position only via car placement; motion state is communicated by the separate MotionStateIndicator (T018). No requirement for the car icon to independently indicate "stationary" — the car simply has no animation when stationary (US3-AC3). Consistent by design.

---

## Fault State

- [x] CHK004 — T014 specifies "renders a fault indicator (distinct styling + text)" for invalid floor. T023 specifies "render a distinct fault state in FloorIndicator and MotionStateIndicator". FR-009 ensures not color-only. Visual placement: within the existing FloorIndicator and MotionStateIndicator component areas.
- [x] CHK005 — Fault state renders within FloorIndicator/MotionStateIndicator components (T014, T023). Stale state renders as a ConnectionBanner (T015) — different components, different screen locations. Visually distinguishable without color.
- [x] CHK006 — T023: fault state replaces the current values in FloorIndicator and MotionStateIndicator while retaining last valid state. The fault indicator is shown *within* the component, not as an overlay or alongside.
- [x] CHK007 — T023 says "retain last valid state". Decision: shaft diagram freezes at last known valid floor position during fault. No fault overlay on the shaft — the FloorIndicator and MotionStateIndicator carry the fault visual.

---

## Awaiting-Data State

- [x] CHK008 — T013 specifies: "renders an 'Awaiting data' placeholder (text + accessible role) shown when connectionState === 'AwaitingData'; no floor content rendered." T016/T021 confirm shaft and all indicators are hidden during AwaitingData. Placeholder replaces all dashboard content.
- [x] CHK009 — Decision: instant swap from "Awaiting data" placeholder to live content when both BuildingConfiguration and ElevatorState resolve. No animation needed — the transition is from empty to populated, not between two data states.
- [x] CHK010 — T016 renders AwaitingData when state is AwaitingData; otherwise renders FloorIndicator, MotionStateIndicator, and ConnectionBanner. T019/T021: components are "visible in Connected and Disconnected states (hidden in AwaitingData)". All three user story display areas enter placeholder state simultaneously.
- [x] CHK011 — Three distinct visual treatments: (a) AwaitingData = text placeholder replacing all content, no floor data shown; (b) Fault = fault text within FloorIndicator/MotionStateIndicator, last valid state retained, shaft visible; (c) Stale = ConnectionBanner with last-known floor visible. An operator can distinguish them without prior system knowledge within SC-004's 5-second window.

---

## Shaft Diagram Visual Requirements

- [x] CHK012 — data-model.md §Floor Map Coordinate Model specifies: "SVG shaft height is a fixed CSS value (e.g., 400 px). Floor cells divide it evenly: cellHeight = shaftHeight / totalFloors." Proportions are algorithmically defined. Exact pixel values are left to implementation — appropriate for a responsive layout.
- [x] CHK013 — data-model.md: "The dashboard renders these as 'Floor 0', 'Floor 1', etc." T020: "floor cell labels for floors 0 to totalFloors - 1." Numeric-only labels, consistent with FR-010 (non-negative integers starting at 0, German convention).
- [x] CHK014 — Car icon shape/fill/border left to implementation discretion. T020 specifies behavioral requirements: positioned via `carY` formula, uses CSS transition, carries `aria-label`. Visual design details are appropriately deferred to implementation — the spec defines behavior, not pixel-level design.
- [x] CHK015 — Covered by AwaitingData state: T016/T021 confirm the shaft is not rendered until AwaitingData clears, which requires both BuildingConfiguration and ElevatorState (FR-004). No partial shaft rendering.
- [x] CHK016 — The car element's position indicates the occupied floor. Decision: no additional cell highlighting required for MVP — the car icon overlaying a cell is sufficient visual indication. Floor cell labels provide context.
- [x] CHK017 — T020: "adapts to any totalFloors 2–20 with no hardcoded floor count." SC-005 validates at 2, 5, and 20 floors. The `cellHeight = shaftHeight / totalFloors` formula handles all sizes. At 20 floors, cells will be smaller but still labeled. No scroll behavior — the shaft fits within its fixed height.

---

## Cross–User Story Consistency

- [x] CHK018 — Text indicators (FR-001, ≤500ms) update instantly via React state on each FloorEvent. Shaft animation (FR-005, ≤200ms) begins simultaneously from the same state update. Both constraints are independently met on the same event — the text is immediately correct while the shaft animates to the new position. No governing constraint conflict.
- [x] CHK019 — Consistent across spec and tasks: "Moving Up", "Moving Down", "Stationary" are the exact strings used in FR-002, US2 acceptance scenarios, and T018. No synonym variants ("Idle", "Up", "Moving") appear anywhere.
- [x] CHK020 — Both indicators derive from the same FloorEvent and are updated in the same React state update in useElevatorHub (T012). They render in the same React cycle. Simultaneous update by design.
- [x] CHK021 — SC-001 says "floor and motion state updates appear on screen within 500 ms of the backend event being emitted." The text indicators update in the same render cycle (<16ms). The shaft animation begins simultaneously and completes within ≤200ms. Both are independently within 500ms. The 500ms is measured as "appears on screen" — the animation start counts as appearing.

---

## Connection State Visuals (cross-cutting)

- [x] CHK022 — ConnectionBanner (T015) is a separate component rendered alongside the dashboard content — not overlaid on individual display areas. FR-003 specifies: "last-known floor and direction remain visible beneath it." The banner is a global dashboard-level indicator, not per-component.
- [x] CHK023 — T015 specifies three distinct banners: (a) "Stale-data warning" for Disconnected, (b) "Reconnecting…" for Reconnecting, (c) "Connection restored" for post-reconnect. Each has distinct text labels. On-screen position: above/alongside dashboard content per T016 layout. FR-009 ensures non-color distinction.
- [x] CHK024 — T012 and T015 specify "auto-dismisses after 3 s". Quantified.

---

## Acceptance Criteria Measurability

- [x] CHK025 — US1-AC2: "within 500 ms". US2-AC4: "within 500 ms". US3-AC2: "≤200 ms animation." Some acceptance scenarios use "is displayed" / "is shown" — these are testable via visual inspection and SC-004 (5-second recognition). Quantified where timing matters; qualitative where binary presence/absence is the criterion.
- [x] CHK026 — SC-004 is testable via a fresh-user walkthrough: show the dashboard to someone unfamiliar, time how long until they identify floor, motion state, and direction. This is a standard usability metric — qualitative but reproducible. Acceptable for an operator-facing dashboard spec.

---

## Rapid-Event & Animation Edge Cases

- [x] CHK027 — Fully specified in spec §Edge Cases and FR-005: "the in-progress animation MUST be immediately cancelled and a new ≤200 ms animation MUST begin from the car's current visual position to the new floor." No queueing, no dropping. T020 notes this is handled by the browser CSS engine when `transform` changes mid-transition.

---

## Notes

- All 27 items resolved on 2026-03-19 based on spec.md, plan.md, data-model.md, contracts/, and tasks.md.
- Items formerly tagged `[Gap]` were resolved by documenting explicit decisions where the spec was silent on visual details (implementation discretion) vs. behavioral requirements (fully specified).
- SC-004 (5-second operator recognition) implicitly validates CHK001–CHK011; a walkthrough with a fresh reader is a lightweight way to evaluate these items.
