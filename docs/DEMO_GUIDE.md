# Five-minute reviewer guide

Run the app with `npm ci` and `npm run dev`, then open [localhost:3000](http://localhost:3000). No account or API key is needed. On a deployed site, use the same routes below.

Everything is a deterministic sample. The interaction is real; telemetry, source systems, authored explanations, agent jobs, approvals, and modeled outcomes are not connected to production.

## 0:00–1:00 · Establish the operating picture

Open [Command Center](http://localhost:3000/command).

1. Compare **Investigation · 09:25 UTC** with **Recovery · 09:40 UTC**. Watch the incident status, metrics, explanation, and incident link change together.
2. Choose a graph node, then **Inspect this record**, or open **Explore evidence**. Search for “trace” or “flag”; inspect the record ID, attributes, source timestamp, and service references.
3. Try **What could disprove it?** and **What proves recovery?**. These are guided, authored explanations, not a general AI chat.
4. Review all three handoff checkboxes, then **Acknowledge handoff**. Use **Export operations brief** to download the selected snapshot and acknowledgement as Markdown.

Acknowledgement is independent for the two snapshots and lives only in this page session.

## 1:00–2:30 · Challenge the replay boundary

Open the [Incident Room at the decision](http://localhost:3000/incidents/inc-2471?at=7).

1. Move the replay slider backward. Before 09:25, mitigation is unavailable and later evidence is hidden. Peak p95 is at **09:22**, not the first 09:21 alert.
2. Select **Decision**, then **Review mitigation**. Inspect the environment, exposure change, recorded role, and recovery thresholds; choose **Approve demo rollback**.
3. Observe execution, monitoring, and the final recovery window. The 09:31 rollback sample alone does not qualify: the 09:35–09:40 samples must hold p95 below 800 ms and errors below 1%.
4. Repeat the approval and seek backward while it is running. The abandoned action must not later jump the replay forward.
5. Open **Stakeholder update**, review the snapshot-derived text, and copy it. The app prepares a local draft and sends nothing.

Use [the recovery frame](http://localhost:3000/incidents/inc-2471?at=9) for a direct result review.

## 2:30–3:20 · Audit a report

Open [Reports](http://localhost:3000/reports).

1. Switch **7 days**, **30 days**, and **Quarter**. Headline, chart, cohort counts, and narrative should all change.
2. Open **View exact chart data** and **Methodology & data provenance**.
3. Download **JSON** and **CSV**. Compare their selected date window and chart totals with the screen.

The seven-day fixture totals 18.4 modeled hours and 481 tracked changes; thirty days totals 76.2 and 2,004; ninety days totals 231 and 5,977. These are synthetic estimates, not measured savings. Report buckets use KST; incident replay uses UTC. Legacy JSON incident/DORA/SLO fields are explicitly scoped as fixed snapshot context.

## 3:20–4:40 · Practice a different incident

Open [Crisis Lab](http://localhost:3000/lab) and select **Assume command**.

The eight-minute model runs at 24× by default; each of six decision gates pauses time. Read the trade-off and choose an intervention. Space pauses outside a decision, and keys 1–3 choose an action while a gate is open.

At the after-action review, inspect the no-intervention comparison, three competencies, per-gate rationale, next practice exercises, and scoring rubric. Export the report.

Pay attention to **traffic control versus full recovery**. Even an S-grade reference path can leave modeled errors above 1%. A traffic guard and high score do not erase that residual error objective.

## 4:40–5:00 · Check interaction details

Use `⌘/Ctrl K` to open navigation search, and open the activity inbox to mark its two sample items read.

At [Changes](http://localhost:3000/changes), filter risk and open a detail drawer. At tablet widths, rows remain readable stacked cards. At [Agents](http://localhost:3000/agents), select a scheduled agent and use **Preview run**: it stays scheduled. **Record demo review** acknowledges only its approval gate and preserves other findings.

## What this review does not demonstrate

There is no live connector, language-model inference, authentication, durable multi-user state, real production approval, job execution, or outgoing stakeholder message. Reloading resets page-local handoff and agent interactions. The PWA provides a minimal offline fallback, not complete offline operation.

The interface includes keyboard, reduced-motion, and text-alternative practices; the project does not claim accessibility certification. Incident-role design is informed by [Google SRE's incident-response guidance](https://sre.google/workbook/incident-response/).
