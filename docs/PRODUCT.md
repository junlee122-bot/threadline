# Threadline product brief

## One sentence

Threadline connects code, deployments, telemetry, and customer impact into an evidence-backed command center where teams can understand change, approve safe remediation, and practice high-pressure judgment in a deterministic crisis lab.

## Problem

During an incident, the facts already exist—but they are distributed across a pull request, deploy dashboard, feature-flag audit, trace waterfall, SLO monitor, analytics tool, and chat room. Teams spend the first minutes reconstructing context instead of evaluating evidence.

AI summaries do not solve this if their claims cannot be inspected. Threadline's product bet is that the durable interface is not a chatbot. It is a time-aware evidence graph with AI embedded into each operational object.

## Product principles

### Evidence before assertion

Every conclusion names the signals that support it, their freshness, and relevant disagreement. Threadline says “leading explanation,” not “root cause,” until a person verifies the claim.

### Time is first-class

The graph can be replayed. Moving the clock changes which nodes, edges, and metric values were knowable at that moment.

### AI lives inside objects

Services, changes, incidents, and agent runs carry contextual summaries and actions. A global command menu is useful for discovery, but chat is not the product hierarchy.

### Actions are previewable and reversible

An agent cannot hide the target or blast radius. Before approval, the interface shows exact environment, structured diff, role, rollback strategy, and verification criteria.

### Customer impact meets technical impact

Latency and error rate matter because of their effect on completed checkouts. The command center places SLO burn next to conversion and modeled revenue impact without presenting a fake universal health score.

## Demo world

Workspace: **Meridian Market · Demo**

- Teams: Storefront, Commerce Core, Platform, Fulfillment
- Services: web-storefront, edge-gateway, identity, tax-adapter, cart, checkout-api, payments, inventory
- Core incident: `INC-2471 · Checkout latency elevated`
- Environment: production
- Timezone: Asia/Seoul

### Core narrative

| Time | Event |
| --- | --- |
| 09:08 | PR #1842 merges a higher retry count for tax quote requests |
| 09:12 | checkout-api@2.18.0 deploy completes |
| 09:18 | instant-tax-v2 exposure increases from 50% to 100% |
| 09:21 | p95 latency rises from 680 ms to 1.84 s |
| 09:22 | error rate reaches 4.9%; SLO burn reaches 8.4× |
| 09:23 | checkout conversion falls 7.3% relative |
| 09:25 | Threadline correlates code, deploy, trace, SLO, and business signals |
| 09:31 | a Production Operator approves the demo flag rollback |
| 09:40 | p95 remains inside baseline for five minutes; recovery is verified |

## Primary journeys

### Two-minute briefing

Open `/command`, identify the only customer-facing regression, inspect the evidence, and enter the incident without searching across tools.

### Incident investigation

Open `/incidents/inc-2471`, replay the timeline, select any graph object, compare synchronized metrics, and challenge the leading hypothesis through source evidence.

### Safe mitigation

Review the proposed flag rollback, confirm environment and blast radius, approve a demo-only action, and watch execution transition into recovery verification.

### Change review

Open `/changes`, filter by explainable risk, inspect downstream impact and test gaps, and follow the risky change into the related incident.

### Weekly review

Open `/reports` to evaluate delivery and reliability together: DORA metrics, SLO status, customer impact, and the week's operating narrative.

### Crisis training

Open `/lab` to command FAULTLINE scenario 047. The eight-minute training twin pauses at six decision gates, applies every intervention to a shared causal model, and scores the final outcome against system health, decision accuracy, impact, and recovery time. The after-action report reveals the rationale only after each decision has been made.

## Success measures for a real product

- Time to first useful evidence under 30 seconds
- Time to identify the impacted owner under two minutes
- Fewer than three primary interactions from incident to mitigation preview
- Every AI claim with at least one inspectable source or an explicit “insufficient evidence” state
- Every production action with a role, preview, rollback plan, and verification query
- No critical or serious accessibility findings on primary journeys
