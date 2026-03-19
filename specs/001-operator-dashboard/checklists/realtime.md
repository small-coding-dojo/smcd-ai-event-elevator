# Realtime Requirements Checklist: Operator Elevator Status Dashboard

**Purpose**: Author self-review of realtime/SignalR requirement quality before raising a PR. Tests whether requirements are *complete and unambiguous* for rapid event succession, cold start sequencing, and reconnect transition states — not whether the implementation handles them.
**Created**: 2026-03-13
**Resolved**: 2026-03-19
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [contracts/signalr-hub.md](../contracts/signalr-hub.md)
**Focus**: Rapid event succession · Cold start sequencing · Reconnect transition states

---

## Rapid Event Succession

- [x] CHK001 — Spec §Edge Cases: "The display MUST update on every FloorEvent received; no events are skipped or coalesced." This binds the event processing layer — every FloorEvent updates React state. The visual rendering layer handles it via CSS transition interruption (FR-005). Both layers are covered: state always updates, animation always restarts.
- [x] CHK002 — Spec §Edge Cases and FR-005 explicitly define: "the in-progress animation MUST be immediately cancelled and a new ≤200 ms animation MUST begin from the car's current visual position to the new floor." No queueing, no jumping, no skipping. T020 notes the browser CSS engine handles this automatically when `transform` changes mid-transition.
- [x] CHK003 — SC-001: "updates appear on screen within 500 ms of the backend event being emitted." This applies to each individual event. In a rapid burst, each FloorEvent triggers a React state update (sub-millisecond) and render (<16ms). The 500ms budget is comfortably met per-event even during bursts.
- [x] CHK004 — SignalR guarantees in-order message delivery over a single connection. The `connection.on('ReceiveFloorEvent', ...)` handler fires once per event in received order. The spec does not need to restate transport-level ordering guarantees. Display advances in strict received order.
- [x] CHK005 — SignalR's client library invokes the `ReceiveFloorEvent` handler once per logical message, regardless of wire-level batching. Each invocation triggers a React state update. No spec requirement needed — this is a transport implementation detail.
- [x] CHK006 — During a rapid burst of same-direction events, the direction indicator holds the current direction value unchanged (e.g., stays on "Moving Up"). No per-event visual acknowledgment is needed for direction — the floor indicator is what changes. The direction updates only when the direction value in the FloorEvent actually changes.

---

## Cold Start Sequencing

- [x] CHK007 — FR-004: "These two calls MUST be made concurrently immediately after the SignalR connection is established." T012: "immediately invokes GetBuildingConfiguration and GetCurrentElevatorState concurrently on connect, buffers any ReceiveFloorEvent that arrives before both resolve." Concurrent with buffering — fully specified.
- [x] CHK008 — T012: "buffers any ReceiveFloorEvent that arrives before both resolve, and on resolution applies whichever is newer by comparing FloorEvent.timestamp against ElevatorStateDto.timestamp." AwaitingData persists until both responses available. FloorEvent held in buffer, not dropped.
- [x] CHK009 — Decision: if GetBuildingConfiguration fails, the dashboard remains in AwaitingData state indefinitely. The operator can refresh the page. Building config is a static backend value that should always be available — transient failure is the only realistic scenario. No separate fault state needed for config failure in MVP.
- [x] CHK010 — Decision: use SignalR's default invocation timeout (30s via ServerTimeout). If GetBuildingConfiguration times out, AwaitingData persists. The operator sees "Awaiting data" and can refresh. No custom timeout mechanism needed for MVP — the default timeout is a reasonable upper bound.
- [x] CHK011 — FR-004: "until BOTH BuildingConfiguration and the initial ElevatorState snapshot... have been received." Spec §Edge Cases: "If GetCurrentElevatorState returns a null or empty result (elevator has never moved), the 'Awaiting data' state persists until the first live FloorEvent arrives." Both config AND elevator state required.
- [x] CHK012 — Decision: if totalFloors is outside [2,20], treat as unexpected backend configuration. Implementation should clamp to [2,20] range and proceed — the backend is the authoritative source and should enforce valid ranges. Frontend validation is a safety net, not a primary control.

---

## Reconnect Transition States

- [x] CHK013 — Fully resolved in Clarifications §2026-03-13 and contract v1.2: "Only on confirmed connection loss (SignalR onreconnecting / onclose). An open-but-idle connection is treated as live; no stale banner for event silence alone." No 5s idle timer. Stale detection is purely event-driven via SignalR lifecycle.
- [x] CHK014 — data-model.md §State Transitions defines the sequence: Connected → Reconnecting (onreconnecting) → Connected (onreconnected) OR Disconnected (onclose). No intermediate "Stale" state — the stale-data warning IS the Disconnected state (displayed when onclose fires after retries exhausted). Direct Connected → Reconnecting transition, no Stale pass-through.
- [x] CHK015 — T012: "re-invokes GetCurrentElevatorState on onreconnected before resuming live event processing." GetBuildingConfiguration is NOT re-invoked — building configuration is static (floor count doesn't change during operation). If it changes, a page reload is acceptable. Decision documented and appropriate for MVP.
- [x] CHK016 — FR-003(b): "Reconnecting indicator: displayed while SignalR is actively attempting to reconnect; visually distinct from the stale-data warning. The last-known floor and direction remain visible beneath it." Clearly specified — last-known floor shown with reconnecting overlay.
- [x] CHK017 — When retries exhausted, onclose fires → Disconnected state → stale-data warning with last-known floor. FR-007 says read-only — no interactive retry button. Decision: operator must manually refresh the browser. This is consistent with read-only constraint and standard web application behavior.
- [x] CHK018 — Clarifications §2026-03-13: "Call GetCurrentElevatorState on reconnect to recover the current elevator state before resuming live FloorEvents." Missed intermediate floor positions during disconnection are not recovered — only the current state at reconnect time. This is explicitly acceptable per the reconnect design.
- [x] CHK019 — T012/T015: "Connection restored" banner appears "when wasReconnecting is true" — only after a reconnect transition, not on initial connect. The wasReconnecting flag is set to true on onreconnecting and cleared after the banner auto-dismisses. Only shown when the operator was previously in a reconnecting or disconnected state.

---

## Cross-Cutting: Event Contract & Timing Assumptions

- [x] CHK020 — SC-001: "within 500 ms of the backend event being emitted." Measured from backend emission to on-screen display. For reconnection recovery, the GetCurrentElevatorState snapshot is a point-in-time fetch, not a replayed event — the 500ms SLA applies to live ReceiveFloorEvent messages after reconnection, not to the snapshot itself.
- [x] CHK021 — Decision: the dashboard displays whatever the backend sends without timestamp anomaly detection. FR-006: "All data displayed MUST be sourced exclusively from backend events; no client-side inference or reconstruction." The dashboard trusts the backend. Delayed or replayed events are a backend concern, not a frontend validation concern.
- [x] CHK022 — data-model.md §ElevatorState Note explicitly documents: "lastEventAt uses the client clock to record when an event was received locally. It is used only for cold-start tie-breaking... and is never displayed to the operator. All displayed timestamps come from backendTimestamp. Stale-data detection is handled exclusively by SignalR lifecycle events — there is no client-side idle timer." Assumption documented and accepted.
- [x] CHK023 — No 5s stale timer exists. Contract v1.2: "stale warning fires only on confirmed connection loss (onclose). Open-but-idle connection treated as Connected." Stale detection is purely SignalR lifecycle-driven (onreconnecting, onclose), not based on event frequency. No ambiguity about heartbeat vs. FloorEvent reset.

---

## Notes

- All 23 items resolved on 2026-03-19 based on spec.md, plan.md, data-model.md, contracts/signalr-hub.md, and Clarifications §2026-03-13.
- CHK009, CHK010, CHK012 are MVP decisions — appropriate for a single-elevator operator dashboard. Future features may require explicit fault handling for config failures.
- CHK001–CHK006 (rapid succession): the potential tension between ≤200ms animation and no-coalescing is resolved by CSS transition interruption — the browser engine handles mid-animation restarts natively.
- CHK013 and CHK023 were the highest-risk items; both are fully resolved by the 2026-03-13 clarification session and contract v1.2.
