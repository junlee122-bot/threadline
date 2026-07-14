# Threadline architecture

Threadline is an evidence-native software intelligence concept. The demo is intentionally deterministic: it tells a complete production incident story without accounts, API keys, or external services, while keeping the seams for real integrations explicit.

## Design goals

1. Trace intent, change, deployment, runtime, and customer impact as one graph.
2. Keep observed events separate from inferred insights and proposed actions.
3. Make the portfolio demo reproducible offline and safe to explore.
4. Render meaningful HTML on the server; ship JavaScript only for interactions.
5. Make every graph interaction available as text, timeline, or table.

## Runtime shape

```text
Next.js App Router
├─ Server-rendered route shell and metadata
├─ Typed deterministic demo dataset
├─ Client islands
│  ├─ command palette
│  ├─ causal graph selection
│  ├─ incident replay clock
│  ├─ approval state machine
│  └─ page-local filters
└─ Static PWA shell + offline fallback
```

Routes are statically renderable. Interactive components receive serializable data or import the fixed demo dataset. There is no module-scope SDK initialization and no required environment variable.

## Route map

| Route | Rendering | Purpose |
| --- | --- | --- |
| `/` | Server | Product narrative and interactive-demo entry |
| `/command` | Server + client island | Live briefing, causal thread, attention queue |
| `/incidents` | Server | Incident history and operating metrics |
| `/incidents/inc-2471` | Static param + client island | Replay, evidence inspection, approved mitigation |
| `/map` | Server + client island | Service topology and health modes |
| `/changes` | Server + client island | Explainable change-risk review |
| `/agents` | Server + client island | Agent run observation and approval state |
| `/reports` | Server + client island | DORA, SLO, customer impact, weekly narrative |
| `/offline` | Server | Network-independent fallback |
| `/api/health` | Route handler | Deployment smoke check |

## Evidence model

Threadline treats epistemic state as data, not styling.

- **Observed**: immutable source event such as a commit, deploy, span, or flag audit.
- **Inferred**: a derived relationship with supporting and conflicting evidence.
- **Proposed**: an action that has not been approved or executed.
- **Approved**: a human-attributed decision with a target and verification plan.

The causal graph uses solid lines for observed relationships, dashed lines for inference, and a stronger double-width path for approved actions. Labels, icons, and text repeat color meaning.

## Incident state machines

Replay is a deterministic cursor over ordered timeline events:

```text
reset → play / pause → step n → detection → hypothesis → approval → recovery
```

The demo action follows a separate safety state machine:

```text
idle → human review → executing → verifying → completed
                    ↘ failed safely / reverted (production design)
```

The portfolio demo implements the successful path. The product specification preserves failure and rollback states for a real backend.

## Production evolution

The static dataset is a boundary, not an architectural dead end. A production version would normalize connector events into an append-only event store, project entities and relations into a temporal graph, and store generated insights separately. Suggested boundaries:

```text
GitHub / OpenTelemetry / Flags / Commerce
                    │
             ingestion adapters
                    │
       append-only canonical event log
          ├─ temporal entity graph
          ├─ metric store
          └─ evidence index
                    │
        correlation + agent workflows
                    │
             Next.js query layer
```

Every generated insight would carry evidence IDs, a generation time, expiry, conflicting evidence, and alternative hypotheses. Removing an insight must never remove source events.

## Security and privacy

- No credential or secret is required by the demo.
- Browser capabilities not used by the product are disabled with `Permissions-Policy`.
- Service-worker code is served with a narrow CSP and no-cache headers.
- The service worker never caches `/_next`, RSC payloads, API responses, or cross-origin requests.
- A real authorization layer must re-check permissions in handlers/actions; routing middleware is never the sole gate.
- Production operations require an attributable role, preview, rollback plan, and success query.

## Verification layers

- TypeScript strict mode and `tsc --noEmit`
- ESLint with Next.js and React rules
- Vitest invariants for data and filtering utilities
- Production `next build`
- Browser smoke checks for navigation, replay, approval, and responsive layout
- Accessibility scans and manual keyboard verification

The CI workflow runs deterministic checks without deployment credentials. Hosting can use Vercel's Git integration for preview and production environments.
