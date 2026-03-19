# Research: Operator Elevator Status Dashboard

**Phase**: 0 | **Date**: 2026-03-13

---

## 1. Real-Time Transport: SignalR vs WebSocket vs SSE

**Decision**: ASP.NET Core SignalR (server) + `@microsoft/signalr` npm package (client)

**Rationale**:
- The backend is .NET 8, which ships SignalR in the framework (`Microsoft.AspNetCore.SignalR`). Zero additional backend packages required.
- SignalR provides automatic transport negotiation (WebSockets → SSE → long-polling) with a single API, handling environments where raw WebSockets may be blocked by proxies.
- Built-in automatic reconnect (`withAutomaticReconnect()`) maps directly to FR-003: auto-reconnect on connection loss without operator action.
- Reconnect lifecycle events (`onreconnecting`, `onreconnected`, `onclose`) map directly to the four `ConnectionState` values needed for the stale-data banner.
- Hub method `ReceiveFloorEvent` is a strongly-typed push from server to all clients — exactly the publish pattern the constitution requires.

**Alternatives considered**:
- *Raw WebSockets*: Lower-level, more control, but requires manual reconnect logic, no negotiation fallback, and no type-safe method dispatch. More code for no gain given .NET 8 is already in use.
- *Server-Sent Events (SSE)*: One-way (server → client only) which fits the read-only dashboard, but no browser-side reconnect lifecycle hooks and less ecosystem support with .NET's built-in tooling. SignalR SSE transport is available as a fallback anyway.
- *gRPC streaming*: Excellent for high-throughput microservices; overkill for a single-elevator dashboard. Adds proto toolchain to both projects.

---

## 2. Visualization Technology: SVG vs Canvas vs CSS Animations vs Library

**Decision**: Inline SVG with CSS `transition` on `transform: translateY`

**Rationale**:

The elevator shaft is a fixed vertical strip with N labeled floor cells (2–20) and a single
car rectangle that moves between discrete positions. This is geometrically simple — one element
moves on one axis, one step at a time (per FloorEvent).

### Evaluated options

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **SVG + CSS transitions** | DOM-based → ARIA roles/labels native. React JSX-compatible. `transition: transform 200ms ease-in-out` on a `<rect>` or `<g>` satisfies ≤200 ms spec. No external dep. | Coordinate math for floor positions is manual but trivial (each floor cell is 100 / N % of shaft height). | ✅ **Selected** |
| **CSS animations only** | Zero JS for animation. | Cannot drive `translateY` from dynamic data (floor count 2-20 is runtime, not build-time). Requires JS to set CSS custom properties anyway, so not purely CSS. | ❌ Insufficient alone |
| **Canvas 2D** | Handles complex real-time graphics (games, maps). | Imperative repaint loop. No DOM elements → accessibility requires separate ARIA live regions. Harder to test (pixel comparison). Overkill for a single moving rectangle. | ❌ Rejected |
| **D3.js** | Powerful for data-driven chart transitions. | 87 KB min+gzip for a use case that needs zero D3 features beyond `scaleLinear`. Violates YAGNI (Constitution V). | ❌ Rejected |
| **Framer Motion** | Declarative React animation with spring physics. | 34 KB min+gzip; spring physics inappropriate for discrete floor-to-floor snaps; ≤200 ms CSS ease-in-out is simpler and spec-correct. | ❌ Rejected |
| **GSAP** | Industry-standard animation timeline. | Large bundle, no WCAG advantage, adds complexity with no benefit over a single CSS `transition`. | ❌ Rejected |

### Implementation sketch

```tsx
// Floor cell height: shaft height / totalFloors (e.g., 500px / 10 floors = 50px each)
// Car Y position: (totalFloors - 1 - currentFloor) * cellHeight
// (inverted: floor 0 at bottom, floor N-1 at top)

<svg aria-label="Elevator shaft" role="img" aria-live="polite">
  {floors.map(f => <FloorCell key={f} floor={f} />)}
  <g
    transform={`translate(0, ${carY})`}
    style={{ transition: "transform 200ms ease-in-out" }}
    aria-label={`Elevator at floor ${currentFloor}`}
  >
    <rect className="car" />
    <text className="car-label">{currentFloor}</text>
  </g>
</svg>
```

- `aria-live="polite"` on the SVG ensures screen-readers announce floor changes without interrupting speech.
- No animation frame loop needed; CSS handles the transition declaratively.
- The car `<g>` re-renders with a new `transform` on each `FloorEvent`; the browser CSS engine produces the slide.

---

## 3. Frontend Framework: Next.js App Router Configuration

**Decision**: Next.js 15, App Router, with SignalR components marked `'use client'`

**Rationale**:
- App Router (Next.js 13+) is the current default and Vercel-recommended pattern.
- SignalR uses browser WebSocket/EventSource APIs, which are unavailable in Node.js server rendering. All components that use the `useElevatorHub` hook must be `'use client'` components.
- The dashboard is a single route (`/`). `page.tsx` is a lightweight server-component shell; the `<DashboardClient>` subtree is a client component boundary that owns all SignalR state.
- This pattern avoids hydration mismatch: the server renders a skeleton (e.g., "Awaiting data" state); the client component replaces it with live data on mount.

**Alternatives considered**:
- *Pages Router*: Works equally well technically; App Router is the forward-looking choice and aligns with Next.js 15 defaults.
- *Vite + React SPA*: Simpler for a pure client-side app, but the user input specified Next.js explicitly.

---

## 4. State Management

**Decision**: React `useState` + `useContext` — no external state library

**Rationale**:
- Dashboard state is: `{ floor, direction, connectionState, buildingConfig }` — four values owned by `useElevatorHub`.
- This is a read-only, single-source-of-truth state that flows downward through the component tree. No cross-cutting writes, no async action dispatch, no shared mutable state between sibling trees.
- `useContext` is sufficient for passing `ElevatorState` to child components without prop-drilling across three component levels.
- Adding Zustand or Redux would violate Constitution Principle V (YAGNI) for this data shape.

---

## 5. Backend: SignalR Hub Architecture

**Decision**: `ElevatorHub` (SignalR hub) + `ElevatorBroadcastService` (hosted service)

**Rationale**:
- `ElevatorHub` is a thin stateless hub that the frontend connects to. It exposes one server-invocable method: `GetBuildingConfiguration()` (called on connect to bootstrap `totalFloors`).
- `ElevatorBroadcastService` is an `IHostedService` that subscribes to the existing `EventAggregator`. When a `FloorEvent` is aggregated, it calls `IHubContext<ElevatorHub>.Clients.All.SendAsync("ReceiveFloorEvent", payload)`.
- This preserves the event-driven pipeline: `ButtonPressedEvent → EventAggregator → ElevatorBroadcastService → SignalR → frontend`. The frontend never bypasses the aggregator.

**CORS consideration**: The .NET API must allow the Next.js dev origin (`http://localhost:3000`) and production domain in `Program.cs`.

---

## 6. Testing Strategy

| Layer | Tool | What |
|-------|------|------|
| Backend hub | xUnit (existing) | `ElevatorBroadcastService` subscribes and broadcasts; mock `IHubContext` |
| Frontend hooks | Jest + RTL | `useElevatorHub` with mocked `@microsoft/signalr` |
| Components | Jest + RTL | Each component renders correctly for all state variants |
| Acceptance (E2E) | Playwright | SC-001 timing, SC-002 stale indicator, SC-003 WCAG, SC-005 floor counts |

---

## Resolved Unknowns

| Was NEEDS CLARIFICATION | Resolution |
|-------------------------|------------|
| Frontend framework | Next.js 15 (specified by user) |
| Real-time transport | ASP.NET Core SignalR — see §1 |
| Visualization technology | SVG + CSS transitions — see §2 |
| App Router vs Pages Router | App Router — see §3 |
| State management | useState + useContext — see §4 |
| Hub architecture | ElevatorHub + ElevatorBroadcastService — see §5 |
