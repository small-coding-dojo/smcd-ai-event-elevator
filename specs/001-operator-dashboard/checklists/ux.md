# UX Requirements Checklist: Operator Elevator Status Dashboard

**Purpose**: Author self-review of UX requirement quality before raising a PR. Tests whether visual state requirements are *complete, measurable, and unambiguous* across all three user stories — not whether the implementation renders correctly.
**Created**: 2026-03-13
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)
**Focus**: Visual states (idle, fault, awaiting-data, shaft diagram) × User Stories 1–3

---

## Idle / Stationary State

- [ ] CHK001 — Is the visual appearance of the "Stationary" state specified with measurable criteria — icon type, label text, and color treatment — beyond the phrase "a clear stationary/idle state indicator"? [Clarity, Spec §US2-AC1, §FR-002]
- [ ] CHK002 — Does the spec define what *visually distinguishes* the Stationary state from "Moving Up" and "Moving Down" states — not by color alone, but by icon and/or label? [Clarity, Spec §FR-009, §FR-002]
- [ ] CHK003 — Are the idle-state visual requirements consistent between the text-based motion indicator (FR-002 / US2) and the shaft diagram car representation (FR-005 / US3) — i.e., does the car icon also communicate "stationary" in the diagram? [Consistency, Spec §FR-002, §FR-005]

---

## Fault State

- [ ] CHK004 — Does the spec define the visual appearance of the fault indicator for an invalid or out-of-range floor number — including icon, label text, color treatment, and on-screen placement? [Completeness, Spec §Edge Cases, Gap]
- [ ] CHK005 — Is the fault state visually distinguishable from the stale-data state (FR-003) without relying on color — are distinct icons or label text required for each? [Clarity, Spec §FR-003, Gap]
- [ ] CHK006 — Does the spec define whether the fault indicator *replaces*, *overlays*, or *sits alongside* the floor indicator content when a fault is active? [Completeness, Spec §Edge Cases, Gap]
- [ ] CHK007 — Does the spec define what the shaft diagram car shows during a fault state — hidden, frozen at last-known position, or shown with a fault overlay? [Completeness, Spec §Edge Cases, §FR-005, Gap]

---

## Awaiting-Data State

- [ ] CHK008 — Is the "Awaiting data" state (FR-004) specified with a visual design — layout position, placeholder shape or skeleton, label text, and its spatial relationship to the shaft diagram? [Completeness, Spec §FR-004, Gap]
- [ ] CHK009 — Does the spec define the visual transition from "Awaiting data" to the first live state — is there an animation, an instant swap, or a fade? [Completeness, Spec §FR-004, Gap]
- [ ] CHK010 — Are the awaiting-data visual requirements consistent across all three user story display areas — do the floor indicator (US1), motion indicator (US2), and shaft diagram (US3) all enter a placeholder state simultaneously on cold start? [Consistency, Spec §FR-004, §US1, §US2, §US3]
- [ ] CHK011 — Can an operator objectively distinguish the "Awaiting data" state from the fault state and the stale-data state without prior system knowledge, satisfying the 5-second recognition criterion in SC-004? [Measurability, Spec §FR-004, §SC-004]

---

## Shaft Diagram Visual Requirements

- [ ] CHK012 — Are the visual dimensions and proportions of the shaft diagram defined — height, width, floor-cell aspect ratio — or left entirely to implementation discretion? [Completeness, Spec §FR-005, §US3, Gap]
- [ ] CHK013 — Is the floor label format inside each cell defined — numeric only (0, 1, …), a text prefix ("Floor 0"), or an abbreviated German label ("EG", "1.OG") — and is this consistent with the floor numbering convention in FR-010? [Clarity, Spec §FR-010, §US3]
- [ ] CHK014 — Is the visual appearance of the elevator car icon defined — shape, fill, border, and size relative to a floor cell — or is it unspecified? [Completeness, Spec §FR-005, Gap]
- [ ] CHK015 — Does the spec define what the shaft diagram shows before `BuildingConfiguration` is received from the backend — is it hidden, shown as a skeleton, or covered by the "Awaiting data" state treatment? [Completeness, Spec §FR-004, §FR-005, Gap]
- [ ] CHK016 — Are floor cell visual states defined — specifically, does the occupied floor cell look different from unoccupied cells, and is that difference specified? [Completeness, Spec §FR-005, Gap]
- [ ] CHK017 — Does the spec define how the shaft diagram adapts layout at the extreme configurations (2-floor minimum, 20-floor maximum per FR-010) — is there a minimum cell height, scroll behavior, or overflow rule? [Clarity, Spec §FR-010, §SC-005]

---

## Cross–User Story Consistency

- [ ] CHK018 — Do the floor-indicator update requirements in US1 (≤500 ms, FR-001) and the shaft diagram animation requirements in US3 (≤200 ms, FR-005) define whether the text indicator and shaft car position must update simultaneously, and which of the two timing constraints governs? [Consistency, Spec §FR-001, §FR-005]
- [ ] CHK019 — Are the exact label strings for motion states ("Moving Up", "Moving Down", "Stationary") used consistently across the US2 acceptance scenarios and FR-002, with no synonym variants ("Idle", "Up", "Moving") that could yield inconsistent implementations? [Consistency, Spec §FR-002, §US2]
- [ ] CHK020 — Is it specified whether the direction indicator (FR-002 / US2) must update *simultaneously* with the floor indicator (FR-001 / US1) on receipt of a single `FloorEvent`, or can they update independently? [Clarity, Spec §FR-001, §FR-002]
- [ ] CHK021 — Is the ≤500 ms update requirement (SC-001 / FR-001) measurable independently for the text floor indicator and the shaft diagram, or does it apply to them as a combined unit? [Measurability, Spec §SC-001, §FR-001, §FR-005]

---

## Connection State Visuals (cross-cutting)

- [ ] CHK022 — Is the stale-data warning (FR-003) required to visually overlay or accompany *all three* display areas (floor, motion, shaft), or only specific ones? [Completeness, Spec §FR-003]
- [ ] CHK023 — Is the stale-data indicator's visual design specified — icon, label text ("Stale data" vs. "Connection lost"), on-screen position relative to other indicators, and whether it partially or fully obscures live data? [Completeness, Spec §FR-003, Gap]
- [ ] CHK024 — Is the auto-dismiss duration for the "Connection restored" banner quantified (e.g., 3 s, 5 s) rather than left at "a few seconds"? [Clarity, Spec §FR-003]

---

## Acceptance Criteria Measurability

- [ ] CHK025 — Do the acceptance scenarios across all three user stories (US1-AC, US2-AC, US3-AC) use measurable "then" clauses — are outcomes quantified (e.g., "within 500 ms") or left as descriptive ("is shown", "is displayed", "is visible")? [Measurability, Spec §US1, §US2, §US3]
- [ ] CHK026 — Is SC-004 ("operator identifies floor, motion state, and direction within 5 seconds") testable with an objective scenario, or does it rely on subjective judgment that varies by evaluator? [Measurability, Spec §SC-004]

---

## Rapid-Event & Animation Edge Cases

- [ ] CHK027 — Does the spec define the shaft diagram animation behavior when a second `FloorEvent` arrives before the current ≤200 ms slide animation completes — does the animation interrupt immediately, queue, or skip to the final position? [Completeness, Spec §FR-005, §Edge Cases]

---

## Notes

- Check items off as completed: `[x]`
- Add inline findings (e.g., `[x] CHK004 — fault indicator spec updated in §Edge Cases: red border + "Fault" label`)
- `[Gap]` items require either a spec update or a documented decision to defer before closing
- `[Clarity]` items require rewording the requirement in the spec; do not close with a code comment alone
- SC-004 (5-second operator recognition) implicitly validates CHK001–CHK011; a walkthrough with a fresh reader is a lightweight way to evaluate these items
