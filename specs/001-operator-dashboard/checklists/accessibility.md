# Accessibility Requirements Checklist: Operator Elevator Status Dashboard

**Purpose**: Author self-review of accessibility requirement quality before raising a PR. Tests whether the requirements are *complete, clear, consistent, and measurable* — not whether the implementation works.
**Created**: 2026-03-13
**Feature**: [spec.md](../spec.md) · [plan.md](../plan.md)
**Standard anchor**: WCAG 2.1 AA (FR-008, SC-003)

---

## WCAG 2.1 AA Requirement Completeness

- [ ] CHK001 — Is WCAG 2.1 AA stated as a hard constraint (zero violations) rather than a soft aspiration, and is this reflected uniformly across FR-008 and SC-003? [Consistency, Spec §FR-008, §SC-003]
- [ ] CHK002 — Are contrast ratio thresholds quantified (≥ 4.5:1 for text, ≥ 3:1 for UI components and graphical objects) or is compliance deferred entirely to "WCAG AA" without enumeration? [Clarity, Spec §FR-008, Gap]
- [ ] CHK003 — Are focus indicator requirements specified for all keyboard-navigable elements in the dashboard, including banners and the shaft diagram? [Completeness, Gap]
- [ ] CHK004 — Does the spec define which dashboard regions require ARIA landmark roles (`main`, `banner`, `status`, etc.) to satisfy WCAG 1.3.6? [Completeness, Gap]
- [ ] CHK005 — Is the WCAG 2.1 AA coverage scope in SC-003 ("all state indicators") explicitly enumerated, or could an implementer reasonably exclude banners or the shaft diagram? [Clarity, Spec §SC-003]

---

## ARIA & Screen-Reader Requirements

- [ ] CHK006 — Are ARIA label requirements specified for the SVG shaft element (e.g., `role="img"` with an `aria-label` describing the shaft)? [Completeness, Spec §FR-005, Gap]
- [ ] CHK007 — Is an `aria-live` region (or equivalent mechanism) required for real-time floor position announcements, ensuring screen-reader users receive floor updates without manual navigation? [Completeness, Spec §FR-001, Gap]
- [ ] CHK008 — Are screen-reader announcement requirements defined for each motion state transition (Stationary → Moving Up, Moving Up → Stationary, etc.)? [Completeness, Spec §FR-002, Gap]
- [ ] CHK009 — Are ARIA label and role requirements specified for the stale-data warning banner and the "Connection restored" banner individually? [Completeness, Spec §FR-003, Gap]
- [ ] CHK010 — Is the "Awaiting data" cold-start state (FR-004) required to have an accessible text equivalent announced to screen readers on initial load? [Completeness, Spec §FR-004, Gap]
- [ ] CHK011 — Are ARIA requirements for the fault indicator (invalid or unknown floor number) documented, including the role or live-region politeness required? [Completeness, Spec §Edge Cases, Gap]
- [ ] CHK012 — Is the `aria-live` politeness level (`polite` vs. `assertive`) specified for each announcement type — e.g., are fault indicators `assertive` while floor updates are `polite`? [Clarity, Gap] — unspecified politeness causes screen-reader UX inconsistency

---

## Color Independence & Visual Indicators

- [ ] CHK013 — Does FR-009 enumerate the exact icon or text label required for each of the three motion states (Up, Down, Stationary), or does it leave the choice open to implementation? [Clarity, Spec §FR-009]
- [ ] CHK014 — Is "visually distinct from normal operation" (Constitution §I) defined for each fault state with a specific non-color attribute (icon, shape, or label text), or does it rely on color differentiation? [Clarity, Spec §FR-009, Gap]
- [ ] CHK015 — Are color-independence requirements explicitly applied to the stale-data warning banner (FR-003), not only to motion-state indicators (FR-009)? [Consistency, Spec §FR-003, §FR-009]
- [ ] CHK016 — Are color-independence requirements defined for the "Connection restored" banner, which must be distinguishable from the stale-data warning without relying on color alone? [Completeness, Gap]
- [ ] CHK017 — Does the spec define a color-independent treatment for the "Awaiting data" state (FR-004) that makes it distinguishable from a fault state and a connected state? [Completeness, Gap]
- [ ] CHK018 — Are direction icons (e.g., arrow glyphs) required to carry a visible text label or an `aria-label`, ensuring screen-reader users receive directional information? [Clarity, Spec §FR-009]

---

## Keyboard Navigation Requirements

- [ ] CHK019 — Does the spec explicitly scope keyboard requirements to navigation-only (no interactive controls per FR-007), and is this stated clearly enough that an implementer would not add keyboard-operable buttons? [Clarity, Spec §FR-007]
- [ ] CHK020 — Are focus order and tab-stop requirements defined for the dashboard layout, including the relationship between the shaft diagram, floor indicator, motion indicator, and banners? [Completeness, Gap]
- [ ] CHK021 — Are keyboard requirements defined for banners — specifically, whether the stale-data or "Connection restored" banner can be dismissed early via keyboard before it auto-dismisses? [Completeness, Spec §FR-003, Gap]
- [ ] CHK022 — Is the screen focus behavior defined for when the "Connection restored" banner auto-dismisses — does focus remain stable or return to a documented target element? [Clarity, Spec §FR-003, Gap]

---

## Animation & Motion Requirements

- [ ] CHK023 — Is `prefers-reduced-motion` handling specified for the ≤ 200 ms car-icon slide (FR-005) — i.e., should the animation be skipped or instantaneous for users who have set this OS preference? [Completeness, Spec §FR-005, Gap]
- [ ] CHK024 — Is the ≤ 200 ms animation ceiling in FR-005 stated as a maximum that implementations may reduce (including to zero for reduced-motion), or could it be interpreted as a target duration? [Clarity, Spec §FR-005]
- [ ] CHK025 — Is the animation defined as directional only (car slides in the direction of travel), with an explicit prohibition on non-directional decorative motion that could distract or disorient? [Completeness, Spec §FR-005, Constitution §II]

---

## Acceptance Criteria Measurability

- [ ] CHK026 — Does SC-003 identify the specific automated tool or audit method (e.g., axe, Lighthouse, WAVE) to be used for WCAG 2.1 AA validation, or is the verification method left undefined? [Clarity, Spec §SC-003]
- [ ] CHK027 — Is "zero violations on all state indicators" in SC-003 scoped to automated checks only, or does it include manual checks (keyboard navigation, screen-reader testing with NVDA/VoiceOver)? [Clarity, Spec §SC-003]
- [ ] CHK028 — Are acceptance scenarios defined for screen-reader announcement of each discrete dashboard state (floor update, direction change, stale, reconnecting, restored, fault)? [Completeness, Gap] — user stories cover visual rendering only
- [ ] CHK029 — Is SC-003 testable by the author alone in a typical dev environment, or does it implicitly require assistive technology setup that should be called out as a prerequisite? [Clarity, Spec §SC-003]

---

## Edge Cases & Degraded State Coverage

- [ ] CHK030 — Are accessibility requirements (ARIA role, live region, contrast) defined for the fault indicator shown when an invalid or out-of-range floor number arrives from the backend? [Completeness, Spec §Edge Cases, Gap]
- [ ] CHK031 — Are contrast and icon requirements stated to hold during degraded states (stale overlay, reconnecting banner) as well as normal operation — i.e., is there a risk that overlays reduce contrast below 4.5:1 for underlying text? [Consistency, Gap]
- [ ] CHK032 — Does the spec define how floor labels in the shaft diagram are accessible at both extremes (2 floors and 20 floors per FR-010), including whether floor "0" requires a visible label such as "Ground" for disambiguation? [Coverage, Spec §FR-010]
- [ ] CHK033 — Are accessibility requirements consistent and complete when the elevator reports a `Stationary` direction on a `FloorEvent` — is there a requirement to suppress or update the direction indicator rather than leave a stale directional label? [Consistency, Spec §FR-002, §FR-005]

---

## Notes

- Check items off as completed: `[x]`
- Add inline findings (e.g., `[x] CHK007 — aria-live region added to spec §FR-001, polite politeness specified`)
- `[Gap]` items require either a spec update or a documented decision to defer
- `[Clarity]` items require rewording the requirement; do not close without a PR spec edit
- Automated a11y scan (axe or Lighthouse) catches ~30–40% of WCAG issues; manual keyboard and screen-reader pass required for full SC-003 coverage
