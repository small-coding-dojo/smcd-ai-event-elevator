# Accessibility Requirements Checklist: Operator Elevator Status Dashboard

**Purpose**: Author self-review of accessibility requirement quality before raising a PR. Tests whether the requirements are *complete, clear, consistent, and measurable* — not whether the implementation works.
**Created**: 2026-03-13
**Resolved**: 2026-03-19
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)
**Standard anchor**: WCAG 2.1 AA (FR-008, SC-003)

---

## WCAG 2.1 AA Requirement Completeness

- [x] CHK001 — FR-008 says "MUST meet WCAG 2.1 AA visual accessibility standards." SC-003 says "zero contrast or motion violations on all state indicators." Hard constraint, zero tolerance, consistent across both sections.
- [x] CHK002 — FR-008 explicitly quantifies: "≥ 4.5:1 for normal text, ≥ 3:1 for large text and UI component boundaries." Not deferred to "WCAG AA" — thresholds enumerated.
- [x] CHK003 — Out of scope. FR-008 explicitly states: "Keyboard navigation and screen-reader compatibility are explicitly out of scope for this feature." Focus indicators are a keyboard navigation concern — not required.
- [x] CHK004 — Out of scope. ARIA landmark roles are a screen-reader concern. FR-008 excludes screen-reader compatibility. Where tasks include ARIA (T013, T020), these are good-practice additions, not spec requirements.
- [x] CHK005 — SC-003 scopes to "all state indicators" for visual checks only: contrast ratios and motion safety. FR-008 clarification ("Keyboard navigation and screen-reader compliance are out of scope") applies to SC-003 as well. Banners and shaft are included for contrast/motion; excluded for screen-reader semantics.

---

## ARIA & Screen-Reader Requirements

- [x] CHK006 — T020 specifies `aria-label="Elevator shaft"` + `role="img"` on SVG and `aria-label` on car group. Included as good practice despite screen-reader being out of scope per FR-008.
- [x] CHK007 — Out of scope per FR-008. Screen-reader live region announcements are excluded. No `aria-live` region required for floor position updates.
- [x] CHK008 — Out of scope per FR-008. Screen-reader announcements for motion state transitions are not required.
- [x] CHK009 — Out of scope per FR-008. ARIA roles for banners are not required by the spec. T013 includes "accessible role" as good practice.
- [x] CHK010 — Out of scope per FR-008. Screen-reader announcement for "Awaiting data" is not required.
- [x] CHK011 — Out of scope per FR-008. ARIA requirements for fault indicator are not required by the spec.
- [x] CHK012 — Out of scope per FR-008. `aria-live` politeness levels are not required. If implemented as good practice, `polite` is appropriate for floor updates and `assertive` for fault indicators.

---

## Color Independence & Visual Indicators

- [x] CHK013 — T018 enumerates: Up arrow + "Moving Up", Down arrow + "Moving Down", Pause icon + "Stationary". Icon and text label specified for each of the three motion states. FR-009 satisfied.
- [x] CHK014 — T014: "distinct styling + text" for fault in FloorIndicator. T023: "distinct fault state" in FloorIndicator and MotionStateIndicator. FR-009 applies — not color alone. Implementation will use text label (e.g., "Fault") + icon/styling.
- [x] CHK015 — FR-009 applies to all state transitions, not just motion indicators. The stale-data banner (FR-003/T015) uses distinct text labels ("Connection lost" or equivalent) — not color-only. Consistent with FR-009.
- [x] CHK016 — The "Connection restored" banner (T015) uses a distinct text label and auto-dismisses after 3s. Visually distinguishable from stale-data warning by text content and temporal behavior (auto-dismiss). Not color-dependent.
- [x] CHK017 — "Awaiting data" state (T013) renders a text placeholder replacing all content — no floor data shown. Fault shows last valid state + fault text. Connected shows live data. Three visually distinct treatments without reliance on color.
- [x] CHK018 — T018 specifies icon + text label for each direction state. FR-009 requires label not just color. Screen-reader `aria-label` on icons is included in T018 as good practice.

---

## Keyboard Navigation Requirements

- [x] CHK019 — FR-007: "read-only and MUST NOT expose any controls." FR-008: "Keyboard navigation... explicitly out of scope." Clear enough — no keyboard-operable buttons or controls. The dashboard is display-only.
- [x] CHK020 — Out of scope per FR-008. Focus order and tab-stop requirements are keyboard navigation concerns — explicitly excluded.
- [x] CHK021 — Out of scope per FR-008. Banner keyboard dismissal is a keyboard interaction — excluded. The "Connection restored" banner auto-dismisses after 3s without operator action.
- [x] CHK022 — Out of scope per FR-008. Focus behavior on banner dismiss is a keyboard/screen-reader concern — excluded.

---

## Animation & Motion Requirements

- [x] CHK023 — Not specified in the spec. Decision: implementation SHOULD respect `prefers-reduced-motion` by setting animation duration to 0 (instant transition). This aligns with WCAG 2.3.3 (Animation from Interactions) and is achievable with a single CSS media query. Added as a T022 audit item.
- [x] CHK024 — FR-005 says "≤200 ms" — the ≤ symbol is unambiguously a maximum. Implementation may reduce to 0ms for `prefers-reduced-motion` users. No interpretation conflict.
- [x] CHK025 — FR-005: "brief slide... to the new floor position; no inter-floor interpolation beyond this discrete per-event transition." Only directional car movement (up/down slide). No decorative motion, no bouncing, no easing overshoot. Constitution §II reinforces: visualization serves data, not decoration.

---

## Acceptance Criteria Measurability

- [x] CHK026 — Decision: Lighthouse accessibility audit is the standard automated tool for visual WCAG checks. Manual contrast verification with browser DevTools as supplementary. T022 specifies: "verify contrast ratios ≥ 4.5:1 (normal text) and ≥ 3:1 (large text + UI component boundaries)." Tool selection is an implementation detail, not a spec concern.
- [x] CHK027 — SC-003 scopes to "visual accessibility checks" — automated contrast and motion checks. Manual keyboard/screen-reader testing is explicitly excluded ("out of scope and excluded from this criterion"). Automated checks + visual inspection are sufficient.
- [x] CHK028 — Out of scope per FR-008. Screen-reader acceptance scenarios are not required for this feature. Visual rendering is covered by US1-AC, US2-AC, US3-AC.
- [x] CHK029 — Yes. SC-003 requires only visual contrast and motion checks. Browser DevTools (contrast ratio inspector) and Lighthouse are standard dev-environment tools. No assistive technology setup required.

---

## Edge Cases & Degraded State Coverage

- [x] CHK030 — FR-009 applies to fault indicators (not color alone). FR-008 contrast requirements apply to all visible elements including fault state. Screen-reader specifics (ARIA role, live region) are out of scope per FR-008. Visual accessibility is covered.
- [x] CHK031 — FR-008 and SC-003 apply to "all state indicators" — including degraded states. T022 audits "all components" for contrast. Overlays (banners) must maintain their own contrast and must not reduce underlying content contrast below thresholds. Implementation must ensure banners don't obscure content in a way that violates contrast ratios.
- [x] CHK032 — data-model.md: numeric labels "Floor 0", "Floor 1", ..., "Floor N-1". FR-010: non-negative integers starting at 0, German convention. No "Ground" alias needed — "Floor 0" is unambiguous in this convention. At 2 floors: "Floor 0", "Floor 1". At 20 floors: "Floor 0" through "Floor 19". Labels scale without ambiguity.
- [x] CHK033 — The direction indicator (T018) updates on every FloorEvent, including events with `direction: Stationary`. When the elevator stops, the backend emits a FloorEvent with `direction: Stationary`, and the indicator immediately updates to "Stationary" (Pause icon + text). No stale directional label persists.

---

## Notes

- All 33 items resolved on 2026-03-19 based on spec.md, plan.md, data-model.md, and tasks.md.
- FR-008's explicit scoping to visual-only accessibility (excluding keyboard and screen-reader) resolves 14 of the 33 items as "out of scope."
- Where tasks include ARIA attributes (T013, T018, T020) despite screen-reader being out of scope, these are treated as good-practice additions, not spec requirements.
- `prefers-reduced-motion` handling (CHK023) is a recommended addition captured in T022 audit scope.
