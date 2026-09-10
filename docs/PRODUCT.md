# Threadline product brief

## Product and current scope

Threadline demonstrates an evidence-centered software operations workspace: understand a change, inspect its possible consequences, review a bounded mitigation, and learn from the response.

The shipped product is a deterministic sample application. Source records, reports, incidents, and agent traces are synthetic fixtures. Interactive controls work, but no external telemetry is ingested, no language model is invoked, and no production approval or operation is performed. The product vision below must be read within that boundary.

## The problem being explored

An incident's useful facts often sit in different tools: a change diff, deployment record, feature-flag audit, trace, SLO chart, and customer-impact estimate. A responder must establish what is known, what remains uncertain, who owns the next decision, and what would count as recovery.

The demo puts those questions into an inspectable workflow. A source event is not proof of causation, a modeled financial effect is not observed loss, and a successful intervention is not enough to close an incident without its acceptance conditions.

## Product principles

### Make evidence inspectable

The library exposes sample source attributes, timestamps, related services, and record IDs. Observed records, inferred relationships, and proposed actions have distinct labels. Guided questions explain the leading hypothesis, a possible confounder, and its falsifier.

### Preserve the selected time

Command Center offers Investigation at 09:25 UTC and Recovery at 09:40 UTC. Its metrics and incident links use the same selected frame. The Incident Room reveals evidence as the replay reaches the relevant event. The global source library is a fixture browser, not a time-filtered live connector.

### Make operating responsibilities concrete

Incident command, execution responsibility, stakeholder updates, and recovery criteria sit beside the telemetry. Three handoff commitments must be reviewed before local acknowledgement; each snapshot has independent page-local state and can be exported.

The assignment of command, operations, and communication responsibilities is inspired by [Google SRE's incident-response chapter](https://sre.google/workbook/incident-response/), which describes explicit roles and coordinated response.

### Show an action's boundary

The rollback preview names the sample environment, flag, exposure change, role, and verification conditions. Demo approval is available only at the decision frame. Seeking or resetting cancels an active action sequence so an old timer cannot mutate a newly selected frame.

### Keep modeled quantities explicit

Revenue impact, engineering effort, context completeness, and training scores are illustrative models. A percentage change in conversion is distinct from a percentage-point change. Report chart axes and downloadable rows expose their units and cohort boundaries.

### Score what the exercise observes

Crisis Lab assesses three competencies: causal diagnosis, load containment, and recovery discipline. Scores derive from canonical scenario choices. Unattempted gates remain unattempted; the rubric does not infer wall-clock decision speed, professional competence, or peer percentile.

## Demo world

| Item | Value |
| --- | --- |
| Workspace | Meridian Market · Sample dataset |
| Incident | INC-2471 · Checkout latency elevated |
| Scenario environment | Production, simulated only |
| Incident date and timezone | 14 July 2026 · UTC |
| Services | web-storefront, edge-gateway, identity, tax-adapter, cart, checkout-api, payments, inventory |
| Training twin | FAULTLINE 047 · separate cache-stampede scenario |

Report calendar buckets are explicitly labeled Asia/Seoul (KST); incident replay times remain UTC. They must not be compared as though they use the same clock convention.

### Recorded incident sequence

| UTC | Recorded event |
| --- | --- |
| 09:08 | PR #1842 changes the tax-quote retry policy |
| 09:12 | checkout-api@2.18.0 deploys |
| 09:18 | instant-tax-v2 exposure rises from 50% to 100% |
| 09:21 | First latency regression: p95 reaches 1.10 s |
| 09:22 | Peak p95 reaches 1.84 s; errors 4.9%; SLO burn 8.4× |
| 09:23 | Customer-impact estimate becomes available with reporting delay |
| 09:24 | INC-2471 is declared; Maya Chen assumes command |
| 09:25 | Feature rollback is proposed for review |
| 09:31 | Recorded demo approval reduces exposure to 0%; verification begins |
| 09:35–09:40 | p95 stays below 800 ms and errors below 1.0% for five continuous minutes |

The baseline conversion is 68.4%; the peak-impact frame records 63.5%. The difference is −4.9 percentage points, approximately −7.2% relative. Recovery supports the feature hypothesis, while third-party latency remains a possible contributing factor.

## Implemented journeys

### Command and handoff

At `/command`, compare the two snapshots, select graph objects, inspect source records, and use the three guided questions. Review scope, change constraint, and communication commitments; acknowledge the selected snapshot and download its Markdown brief. Reloading the page clears acknowledgement; it is not a shared audit record.

### Incident investigation and mitigation

At `/incidents/inc-2471`, replay ten events or jump to the decision frame. The graph, metrics, incident status, exposure, and source availability follow the replay. Inspect a source, switch to the evidence table, review the demo rollback, and observe the execution and verification states. A communication draft captures the selected frame and can be copied locally.

### Change and agent review

At `/changes`, filter/search sample changes and inspect risk rationale, affected paths, and check outcomes. The layout becomes stacked cards below the wide-screen table breakpoint.

At `/agents`, inspect sample traces and evidence inputs. Scheduled runs expose an execution-plan preview and remain scheduled. Recording a demo review acknowledges the designated approval gate; warning findings and unfinished checks remain intact. These controls do not launch jobs or approve a real rollout.

### Report review

At `/reports`, choose seven days, thirty days, or the ninety-day window. Headline estimates, coverage, chart series, risk mix, and narrative all use the selected cohort. JSON and CSV export the same period data. Exact chart values and methodology are inspectable.

The risk denominator includes all tracked changes; coverage separately reports analyzed changes. Hours are modeled effort avoided, not verified savings. Legacy DORA/SLO/incident fields in JSON remain labeled as a fixed incident snapshot rather than period aggregates.

### Crisis training

At `/lab`, select **Assume command**. Eight minutes of modeled time run at 24× by default; decisions pause the clock. Six gates provide eighteen possible choices. The after-action view compares the run with no intervention, explains three competency domains, lists gate-level evidence, and exports the result.

A traffic guard requires p95 ≤ 800 ms, database connections ≤ 1,260, and cache hits ≥ 90% for a final 30 modeled seconds. Full recovery also requires residual errors ≤ 1%. A reference strategy, S grade, or controlled cascade can still leave errors above the objective; the result keeps recovery open.

## Aspirations requiring production work

A real deployment would need authenticated identities, durable shared state, production connector ingestion, source retention, authorization enforced on the server, auditable approval, and an action backend with independent outcome verification. None of these capabilities is implied by the demo's local controls.

Time to useful evidence, owner identification, and review completion would be product evaluation measures. Reliability, productivity, and accessibility claims would require measured evidence and an appropriate audit before publication.
