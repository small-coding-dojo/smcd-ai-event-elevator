# Realtime Requirements Checklist: Operator Elevator Status Dashboard

**Purpose**: Author self-review of realtime/SignalR requirement quality before raising a PR. Tests whether requirements are *complete and unambiguous* for rapid event succession, cold start sequencing, and reconnect transition states — not whether the implementation handles them.
**Created**: 2026-03-13
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md) · [contracts/signalr-hub.md](../contracts/signalr-hub.md)
**Focus**: Rapid event succession · Cold start sequencing · Reconnect transition states

---

## Rapid Event Succession

- [ ] CHK001 — Is "no events skipped or coalesced" (Spec §Edge Cases) defined to apply at the *event processing* layer, the *visual rendering* layer, or both — i.e., does the requirement bind the SignalR handler, the React state update, or the animation? [Clarity, Spec §Edge Cases, §FR-001]
- [ ] CHK002 — Does the spec define required behavior when `FloorEvent`s arrive faster than the ≤200 ms animation window (FR-005) — must each event trigger a new animation from the current car position, jump immediately to the new floor, or queue? [Completeness, Spec §FR-005, §Edge Cases, Gap]
- [ ] CHK003 — Is the ≤500 ms display latency requirement (SC-001 / FR-001) defined as applying to *each individual event* in a rapid-succession burst, or only to the most recently received event? [Clarity, Spec §SC-001, §FR-001]
- [ ] CHK004 — Are ordering guarantees required for rapid-succession `FloorEvent`s — must the display advance floors in strict received order, or is out-of-order display acceptable as long as no event is skipped? [Completeness, Spec §FR-001, §Edge Cases, Gap]
- [ ] CHK005 — Does the spec define behavior when the SignalR transport delivers multiple `FloorEvent`s in a single message batch — are all individually required to produce a display update, or is only the last one in the batch sufficient? [Completeness, Spec §FR-001, Gap]
- [ ] CHK006 — Is there a requirement for how the direction indicator (FR-002) behaves during a rapid burst of same-direction events — must it visually acknowledge each one, or is it sufficient to hold the current direction value unchanged? [Completeness, Spec §FR-002, Gap]

---

## Cold Start Sequencing

- [ ] CHK007 — Does the spec define the required ordering of the cold start sequence — must `GetBuildingConfiguration` complete successfully *before* the dashboard begins accepting `FloorEvent`s, or can both arrive concurrently? [Completeness, Spec §FR-004, Assumption §spec, Gap]
- [ ] CHK008 — Are requirements defined for the case where the first `FloorEvent` arrives *before* `BuildingConfiguration` is received — does the shaft diagram remain hidden, render with a fallback floor count, or block the event until config is available? [Completeness, Spec §FR-004, §FR-005, Gap]
- [ ] CHK009 — Is there a requirement for what the dashboard shows if `GetBuildingConfiguration` fails (timeout or hub error) while the SignalR connection itself remains healthy? [Completeness, Spec §FR-004, Gap]
- [ ] CHK010 — Is a timeout threshold defined after which `GetBuildingConfiguration` is considered failed, and is the resulting dashboard state (fault, stale, or indefinite "Awaiting data") specified? [Completeness, Spec §FR-004, Gap]
- [ ] CHK011 — Is the "Awaiting data" state (FR-004) defined to persist until *both* `BuildingConfiguration` and the first `FloorEvent` are received, or only until the first `FloorEvent` regardless of config? [Clarity, Spec §FR-004, Ambiguity]
- [ ] CHK012 — Are requirements defined for what happens if `BuildingConfiguration` returns a `totalFloors` value outside the valid range (< 2 or > 20 per FR-010) — is this a fault state, a clamped fallback, or undefined? [Completeness, Spec §FR-010, §Edge Cases, Gap]

---

## Reconnect Transition States

- [ ] CHK013 — Is the 5 s staleness threshold (FR-003) defined as triggering on *no `FloorEvent` received for 5 s regardless of connection health*, or only when a connection loss is detected — i.e., can the stale indicator appear while the SignalR connection is technically open? [Clarity, Spec §FR-003, Ambiguity]
- [ ] CHK014 — Is the transition sequence between `ConnectionState` values explicitly defined — specifically, can the dashboard transition directly from `Connected` to `Reconnecting`, or must it pass through `Stale` first? [Completeness, Spec §FR-003, Gap]
- [ ] CHK015 — After a successful reconnect, is there a requirement to re-invoke `GetBuildingConfiguration` in case the building configuration changed while disconnected, or is the previously received config assumed valid indefinitely? [Completeness, Spec §FR-003, Assumption §spec]
- [ ] CHK016 — Is the floor position display during active reconnection defined — does the spec require showing the last-known floor (with stale indicator) or entering an "Awaiting data"-style placeholder? [Clarity, Spec §FR-003, §FR-004, Ambiguity]
- [ ] CHK017 — When reconnect retries are exhausted and the dashboard reaches a `Disconnected` state, does the spec define the only recourse as a manual browser refresh, or is an operator-initiated retry required — and if so, how does that interact with FR-007's read-only constraint? [Completeness, Spec §FR-003, §FR-007, Gap]
- [ ] CHK018 — Does the spec address missed `FloorEvent`s during a disconnection window — is there a requirement to request missed events on reconnect, or is displaying only the first post-reconnect event as current state explicitly acceptable? [Completeness, Spec §FR-003, §FR-006, Gap]
- [ ] CHK019 — Is the "Connection restored" banner (FR-003) required to appear after *every* successful reconnect, or only when the operator was previously shown a stale or disconnected indicator? [Clarity, Spec §FR-003, Ambiguity]

---

## Cross-Cutting: Event Contract & Timing Assumptions

- [ ] CHK020 — Is the ≤500 ms latency requirement (SC-001) defined in terms of when the *backend emitted* the event or when the *client received* it — and for reconnection recovery, does the 500 ms window restart from connection-restored time? [Clarity, Spec §SC-001, §FR-001, Ambiguity]
- [ ] CHK021 — Are requirements defined for a `FloorEvent` that arrives with a `timestamp` significantly in the past (delayed or replayed by the transport) — must the dashboard display the backend timestamp as-is or flag it as anomalous? [Completeness, Spec §FR-006, Gap]
- [ ] CHK022 — Is the assumption that client-side clock suffices for stale detection (the `lastEventAt` field in `ElevatorState` using the client clock) explicitly documented and accepted, given that FR-006 requires all *displayed* data to be sourced from backend events? [Assumption, Spec §FR-006, data-model §ElevatorState]
- [ ] CHK023 — Does the spec define whether the 5 s stale detection timer resets on *any* SignalR activity (transport heartbeat, acknowledgment frame) or *only* on receipt of a `FloorEvent` — since the two would produce different stale trigger behaviour under an idle but connected hub? [Clarity, Spec §FR-003, Gap]

---

## Notes

- Check items off as completed: `[x]`
- Add inline findings (e.g., `[x] CHK002 — spec updated: animation interrupts immediately on new event; no queueing`)
- `[Gap]` items require a spec update or explicit deferral decision before closing
- `[Ambiguity]` items require rewriting the requirement to remove dual interpretations
- `[Assumption]` items require the assumption to be either promoted to an explicit requirement or documented as a known risk in the spec's Assumptions section
- CHK001–CHK006 (rapid succession) are the highest-risk items given the ≤200 ms animation + no-coalescing constraint are potentially in tension — resolve these first
