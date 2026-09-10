# THREADLINE

> Every signal, traced to source.

Threadline is an interactive portfolio product for investigating software incidents, reviewing change risk, and practicing operational decisions. It brings a synthetic commerce incident into one workspace: inspect a source record, compare an explanation with alternatives, review a mitigation, verify recovery, and hand off the result.

**The shipped app uses deterministic sample data.** It has no live telemetry ingestion, connected production accounts, AI model calls, or production action execution. Its dialogs, filters, replay controls, exports, and training model work locally so the experience can be reviewed without credentials.

[![CI](https://github.com/junlee122-bot/something/actions/workflows/ci.yml/badge.svg)](https://github.com/junlee122-bot/something/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Start with the [five-minute reviewer guide](docs/DEMO_GUIDE.md).

See [verification coverage and environment limits](docs/VERIFICATION.md) for the tested workflows.

## What you can do

- Compare the **09:25 investigation** and **09:40 recovery** snapshots in Command Center. Metrics, incident links, and the operating narrative follow the selected snapshot.
- Search the evidence library and inspect bundled source attributes, timestamps, service references, and stable record IDs.
- Explore three guided investigation questions, including alternative explanations and measurable recovery conditions.
- Review three handoff commitments, acknowledge each snapshot locally, and download a Markdown brief. Handoff state lasts only while the page remains mounted.
- Replay the incident through ten recorded events. Evidence and proposed actions are gated by the selected time; seeking or resetting cancels an in-progress demo action.
- Inspect and copy a stakeholder communication draft. Nothing is sent or published.
- Switch report periods and export matching JSON or CSV data, including explicit modeled-estimate methodology.
- Run **FAULTLINE scenario 047** in Crisis Lab, make six decisions, and review canonical competency scores and a no-intervention comparison.

## The sample incident

Meridian Market's checkout incident is a fictional recorded scenario on **14 July 2026, UTC**:

    PR #1842 changes retry behavior
      → checkout-api@2.18.0 deploys
      → instant-tax-v2 exposure rises to 100%
      → tax-adapter connection pressure and checkout latency increase
      → a feature rollback is reviewed
      → exposure reaches 0%
      → latency and errors pass the recorded recovery window

The first latency alert appears at 09:21. Peak p95 is **1.84 seconds at 09:22**, against a 680 ms baseline. The incident is declared at 09:24, mitigation is proposed at 09:25, the recorded rollback occurs at 09:31, and the 09:35–09:40 samples verify five continuous minutes below both recovery thresholds.

Conversion changes distinguish percentages from percentage points: 68.4% to 63.5% is a **4.9 percentage-point decline**, or about **7.2% relative**. Customer-impact attribution remains an inference; revenue values are modeled estimates.

The Crisis Lab is a separate cache-stampede exercise with eight minutes of modeled time, six gates, and three choices per gate. It shares the operating language, not the incident's timeline or state. Its three competency domains are **causal diagnosis, load containment, and recovery discipline**. A high grade or controlled traffic does not imply full recovery: the residual error objective is evaluated separately.

## Product surfaces

| Route | Implemented experience |
| --- | --- |
| `/` | Product narrative and demo entry |
| `/command` | Two frozen snapshots, evidence inspection, guided questions, local handoff, Markdown export |
| `/incidents` | Sample incident inventory |
| `/incidents/inc-2471` | Time-aware replay, source inspection, guarded demo mitigation, stakeholder draft |
| `/lab` | Deterministic crisis exercise and after-action report |
| `/map` | Searchable topology with topology, risk, and activity modes |
| `/changes` | Search, risk filters, change details, and verification context |
| `/agents` | Sample execution traces, scheduled-plan previews, local demo review |
| `/reports` | Period-specific coverage, modeled effort, risk distribution, and context completeness |
| `/api/reports/impact` | JSON report; `?period=30d&format=csv` exports chart rows |
| `/offline` | Minimal offline fallback |
| `/api/health` | Application health response |

Use `⌘/Ctrl K` to search product navigation. The activity inbox contains two sample items and supports local read state.

## Local development

Requires Node.js 24+ and npm 11+.

    git clone https://github.com/junlee122-bot/something.git
    cd something
    npm ci
    npm run dev

Open [http://localhost:3000](http://localhost:3000). No account, API key, or `.env` file is required. The optional `NEXT_PUBLIC_SITE_URL` configures canonical metadata, robots, and sitemap URLs for a deployment.

## Engineering

Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS v4, and Geist typography support server-rendered route shells and focused interactive components.

The implementation separates the recorded incident reducer, simulation engine, and report fixtures from their presentation. Incident transitions reject stale timer callbacks. Crisis Lab resolves submitted choices against canonical scenario definitions. Report UI and downloads share one period dataset. Charts include explicit semantic colors and text or table alternatives.

    npm run lint
    npm run typecheck
    npm run test
    npm run build
    npm run check

GitHub Actions runs lint, type checking, tests, and a production build. Browser checks supplement those commands; automated tests alone do not establish visual or accessibility conformance.

## Scope and limitations

This is a functioning concept demo, not a deployed incident-management backend. Source labels describe fixtures; production roles, approvals, and agent traces are simulated. Guided explanations are authored content, not generated answers. There is no user authentication, shared audit store, durable handoff persistence, or connector credential handling.

Reports describe synthetic cohorts and modeled effort, not measured productivity or verified ROI. JSON keeps legacy incident/DORA/SLO snapshot fields for compatibility and labels them separately from the selected report period.

The service worker caches a minimal offline fallback and icon. It does not provide the full application, API data, or Next.js assets offline.

## Accessibility approach

The interface includes semantic landmarks, keyboard focus, native dialogs, reduced-motion handling, non-color state labels, and text alternatives for visual information. These are implemented design practices, **not a WCAG certification or a claim of full conformance**. Assistive-technology coverage and a complete accessibility audit remain future work.

## Documentation and references

- [Five-minute reviewer guide](docs/DEMO_GUIDE.md)
- [Product brief](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Research references](docs/REFERENCES.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

The separation of incident command, operations, and communications draws on [Google SRE's incident-response guidance](https://sre.google/workbook/incident-response/). Threadline turns those responsibilities into visible ownership, review boundaries, and local communication drafts.

## License

MIT © 2026 Jun Lee. See [LICENSE](LICENSE).
