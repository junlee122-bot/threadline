# THREADLINE reference notes

THREADLINE is an original demonstration product. The sources below were used as
product-research references, not as code or visual assets. We borrowed durable
interaction and information-architecture ideas, then expressed them in the
Meridian Market / `INC-2471` scenario with original copy, fixtures, and UI.

Links were checked against first-party documentation on 2026-07-14.

## Product workflow references

### Linear

- [Search](https://linear.app/docs/search) — informed the global command/search
  surface, keyboard-first navigation, and the ability to resolve a known object
  by identifier such as `INC-2471`.
- [Display options](https://linear.app/docs/display-options) — informed compact,
  filterable operational lists whose metadata can be scanned without opening
  every row.
- [Create issues](https://linear.app/docs/creating-issues) — informed stable,
  human-readable IDs and explicit status/priority metadata.

What THREADLINE changes: search spans incidents, services, changes, agents, and
evidence rather than project-management objects. It also preserves causal links
between those result types.

### GitHub

- [About status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
  — informed the passed/pending/blocked vocabulary used on changes and approval
  gates.
- [Deployments and environments](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
  — informed environment-aware deployment records and protected production
  actions.

What THREADLINE changes: a pull request is not the terminal object. Its commit,
deployment, runtime effect, incident participation, and remediation are joined
into one evidence thread.

### Vercel

- [Deployments overview](https://vercel.com/docs/deployments/overview) — informed
  release-centric history, concise deployment summaries, and fast navigation
  from a release to runtime resources.
- [Observability](https://vercel.com/docs/observability) — informed a unified
  queryable view over application events and metrics aligned to architecture.

What THREADLINE changes: deployment cards sit inside a vendor-neutral causal
model and may point to evidence from multiple code hosts and telemetry systems.

### Sentry

- [Issue details](https://docs.sentry.io/product/issues/issue-details/) — informed
  the evidence-dense incident detail hierarchy: impact first, then event trend,
  suspect change, trace, replay, tags, and activity.
- [Trace Explorer with span metrics](https://docs.sentry.io/product/explore/traces/)
  — informed trace-to-span drill-down, attribute filtering, and the use of
  duration outliers as primary causal evidence.

What THREADLINE changes: errors, traces, logs, and customer sessions are typed
evidence records. Causal claims cite their evidence IDs and carry an explicit
confidence value.

### Datadog

- [Service Map](https://docs.datadoghq.com/tracing/services/services_map/) —
  informed topology navigation, health on nodes, and upstream/downstream service
  inspection.
- [Deployment Tracking](https://docs.datadoghq.com/tracing/services/deployment_tracking/)
  — informed version overlays and before/after release comparisons.
- [Service Level Objectives](https://docs.datadoghq.com/service_level_objectives/)
  — informed target, current status, error-budget remaining, burn rate, and
  rolling-window fields in the SLO report.

What THREADLINE changes: the system map and incident graph are separate views.
The first answers “what depends on what?”; the second answers “what caused this
specific outcome, and what proves it?”

### Graphite

- [Merge pull requests](https://graphite.com/docs/merge-pull-requests) — informed
  small-change sequencing and dependency-aware status for related changes.
- [Use the Graphite merge queue](https://graphite.com/docs/get-started-merge-queue)
  — informed queue position, readiness, failure, and human-controlled pause or
  approval states.

What THREADLINE changes: change risk includes operational topology and current
SLO state, not only mergeability and CI state.

### Sourcegraph

- [Code Search](https://sourcegraph.com/docs/code-search) — informed repository,
  path, symbol, commit, and diff-aware retrieval across a large code estate.
- [Code Navigation](https://sourcegraph.com/docs/code-navigation) — informed
  following definitions and references across repository boundaries when an
  agent maps a change's blast radius.

What THREADLINE changes: code search results become one input to a wider service
graph. The demo agent uses code relationships alongside deployments and runtime
telemetry rather than presenting code matches alone.

## Standards and measurement references

### WCAG 2.2

- [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/) —
  informs semantic landmarks, keyboard operability, visible focus, non-color
  status labels, contrast, reduced-motion support, and appropriately sized
  targets.
- [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
  — specifically informed focus-not-obscured and minimum target-size review.

The target is WCAG 2.2 AA. Graphs must retain textual summaries and tables; color
is supplementary, never the only carrier of severity or trend.

### OpenTelemetry

- [Signals](https://opentelemetry.io/docs/concepts/signals/) — informed the
  separation of traces, metrics, logs, and contextual baggage.
- [Traces](https://opentelemetry.io/docs/concepts/signals/traces/) — informed the
  trace/span hierarchy and stable trace identifiers in evidence.
- [Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
  — informed joining evidence across service and process boundaries by execution
  context rather than timestamp proximity alone.

THREADLINE's `Evidence` type is intentionally backend-neutral. Source-specific
attributes remain attached while service IDs, timestamps, and trace context
enable correlation.

### DORA

- [DORA software delivery performance metrics](https://dora.dev/guides/dora-metrics/)
  — informed the current five-metric grouping: deployment frequency, change lead
  time, failed-deployment recovery time, change fail rate, and deployment rework
  rate.
- [History of DORA's delivery metrics](https://dora.dev/insights/dora-metrics-history/)
  — informed the terminology update from generic MTTR to failed-deployment
  recovery time and the addition of deployment rework rate.

The demo reports a single application's trend over time. It does not turn DORA
metrics into individual targets or compare unrelated teams, matching DORA's
warning that context matters and broad ranking invites metric gaming.

## Demo-data policy

- All people, organizations, incidents, repositories, URLs under
  `meridian.example`, metrics, and outcomes are fictional.
- `DEMO_NOW` freezes the clock at `2026-07-14T10:42:00.000Z`; there is no random
  fixture generation.
- Every foreign key in services, causal edges, changes, agents, and evidence is a
  stable string ID. Causal confidence is normalized to `0..1`; risk is `0..100`.
- The incident timeline uses UTC ISO-8601 timestamps. Presentation utilities may
  render relative time, but raw data remains timezone-safe and sortable.
