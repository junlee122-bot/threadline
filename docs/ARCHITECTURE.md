# Threadline architecture

Threadline is a Next.js application backed by typed, deterministic fixtures. The current runtime does not ingest telemetry, call an AI model, or execute production operations. Its principal engineering boundary is between inspectable scenario data, pure state transitions, and interactive presentation.

## Runtime and source boundaries

| Layer | Implementation | Responsibility |
| --- | --- | --- |
| Route shell | `src/app`, `src/components/shell` | Layout, metadata, navigation, source-library entry, sample activity inbox |
| Sample domain data | `src/lib/demo-data.ts`, `src/types/threadline.ts` | Services, source records, changes, legacy incident/report snapshots |
| Recorded incident | `src/lib/incident-replay.ts` | Canonical frames, derived snapshot, guarded action reducer, communication draft |
| Training model | `src/lib/crisis-lab.ts`, `src/types/crisis-lab.ts` | Intervention dynamics, canonical decisions, competency rubric, result replay |
| Period reports | `src/lib/impact-reports.ts` | Shared UI/export cohorts, date buckets, modeled estimates, CSV serialization |
| Interactive views | `src/components` | Selection, filtering, dialogs, replay, page-local acknowledgement |
| Report endpoint | `src/app/api/reports/impact/route.ts` | JSON and CSV attachments for a validated period |
| Offline fallback | `public/sw.js` | Minimal fallback page and icon caching |

Server-rendered route shells wrap focused Client Components. There is no required SDK initialization or environment secret. The optional site-origin setting affects public metadata.

## Route map

| Route | Behavior |
| --- | --- |
| `/` | Product narrative |
| `/command` | Investigation/recovery snapshots, guided questions, local handoff export |
| `/incidents` | Sample incident inventory |
| `/incidents/inc-2471?at=7` | Decision frame; `at=9` opens recorded recovery |
| `/lab` | Separate deterministic crisis exercise |
| `/map` | Topology selection, search, risk and activity modes |
| `/changes` | Change filters and detail drawer |
| `/agents` | Sample traces, scheduled-plan preview, local review state |
| `/reports` | Period-specific model and downloadable data |
| `/api/reports/impact?period=30d` | JSON report with scoped legacy snapshot context |
| `/api/reports/impact?period=30d&format=csv` | Chart rows with dates, units, provenance, and timezone |
| `/api/health` | Health response |
| `/offline` | Minimal network-failure fallback |

## Evidence and time

The source explorer searches bundled records and renders their stored attributes. Record IDs provide stable references inside the sample; they are not links to connected production systems.

Observed source records are distinct from inferred causal relationships. The causal graph uses solid observed paths, dashed inferred paths, and thicker approved paths. Text repeats those meanings; sparkline colors map explicitly to defined theme variables and SVG gradients have per-instance IDs.

The Incident Room is time-scoped: future nodes and evidence do not contribute to the selected replay frame. The global evidence library intentionally exposes the complete sample dataset.

Incident timestamps use UTC. The canonical incident frames separate detection at 09:21, peak p95 at 09:22, declaration at 09:24, diagnosis at 09:25, and recovery at 09:40. Conversion delta is computed relative to the 68.4% baseline; it is not a percentage-point delta.

## Incident replay and action state

`incidentReplayReducer` owns the cursor and action state:

    select frame → idle
    decision frame + demo approval → executing
    matching callback → verifying at the recorded rollback
    matching callback → completed at verified recovery

Approval is accepted only at frame 7, the 09:25 decision, while the action is idle. Each action run has an ID. A seek or reset increments that ID and clears the action; callbacks from superseded runs are ignored. Repeated or out-of-order callbacks cannot advance the state.

The action sequence is accelerated playback of a fixture, not a background operation. At 09:31, p95 is still 900 ms and errors 1.2%, so recovery is not yet accepted. The final frame exposes the 09:35–09:40 samples satisfying p95 < 800 ms and errors < 1% for five continuous minutes.

Communication drafts derive from a captured replay step. Copying a draft writes only to the local clipboard, with a manual-copy fallback. Nothing is sent to a stakeholder or status page.

## Command, handoff, and agent state

Command Center derives its two modes from the same incident snapshot helper: frame 7 at 09:25 and frame 9 at 09:40. Its links carry that cursor into the Incident Room.

Handoff review and acknowledgement are separate per mode in React state. Acknowledgement requires all three commitments, and the Markdown export includes the selected metrics, checked items, acknowledgement, and source IDs. The state is not persisted across a reload or shared between users.

The sample activity inbox keeps read state in the mounted shell. Agent views likewise use local state: scheduled runs open a plan preview; demo review changes only the designated approval gate. Existing warning findings and unfinished work are preserved.

## Crisis Lab and canonical assessment

The training twin has its own scenario and clock:

    briefing → accelerated modeled time → six paused decision gates
             → bounded interventions → canonical replay → after-action report

The engine resolves record IDs against canonical choices, accepts the first valid choice per gate, and derives scores from those definitions rather than trusting display labels or submitted score fields.

Three competency domains group the six gates:

- Causal diagnosis: the initial hypothesis.
- Load containment: stampede, pool pressure, and customer blast radius.
- Recovery discipline: warm-up and traffic restoration.

The command score weights final modeled health at 50%, exact reference-choice agreement at 30%, and mean gate quality at 20%. These are educational rubric values, not calibrated professional assessments or peer benchmarks. Wall-clock decision speed is not graded.

Result computation replays both the user's choices and no intervention at one-second modeled intervals. The traffic guard requires p95 ≤ 800 ms, pool usage ≤ 1,260 connections, and cache hits ≥ 90% sustained for the final 30 modeled seconds. Residual errors have a separate ≤ 1% objective. Full recovery requires both; an S grade or controlled traffic does not establish recovery. The interface and exported report retain this distinction.

## Report consistency

UI and endpoint import `impactReports`. Valid periods are `7d`, `30d`, and `90d`; all other values safely fall back to seven days.

Each report includes explicit start/end dates, bucket boundaries, modeled-hour values, tracked and analyzed counts, risk distribution, service context scores, and authored cohort narrative. Calendar buckets use Asia/Seoul. Partial final buckets are disclosed rather than implied to be equal-duration comparisons.

JSON includes selected-period data under `report`. Existing top-level `incident`, `dora`, `slos`, and `impact` fields are retained for compatibility; `snapshotContext` explains that these are fixed incident context, not selected-period aggregates. CSV contains exact chart rows, units, sample provenance, and timezone.

## Offline behavior and operational limits

The service worker caches the fallback page and icon. Navigation failures can return that fallback. It excludes Next.js assets, React Server Component payloads, API responses, and cross-origin requests; it is not a complete offline application.

No real authorization, connector credential store, durable audit log, message delivery, or production execution service exists. Browser policy headers reduce unnecessary capabilities, but do not turn local demo approval into a security boundary.

A production implementation would require authenticated server-side authorization, durable event ingestion and storage, independent evidence provenance, action idempotency, cancellation, rollback, and measured recovery verification. Those are future integration responsibilities.

## Verification

The repository includes strict type checking, Next/React lint rules, deterministic tests, and a production build in CI. Tests cover incident state transitions and cancellation, scenario canonicalization and scoring, report window exports, and data invariants.

Browser inspection supplements those checks for visual layout, route transitions, dialogs, copy/download behavior, and keyboard use. Accessibility practices are implemented; a full WCAG conformance audit and assistive-technology matrix are not claimed.
