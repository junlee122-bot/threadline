import type { DecisionRecord, IncidentResult } from '../types'
import './cinematic.css'

interface PostmortemScreenProps {
  result: IncidentResult
  decisions: DecisionRecord[]
  onRestart: () => void
  onExport: () => void
}

interface EndingCopy {
  eyebrow: string
  headline: string
  summary: string
  status: string
}

const ENDING_COPY = {
  sovereign: {
    eyebrow: 'ENDING 01 · SOVEREIGN RECOVERY',
    headline: 'THE SYSTEM BENT. YOU DIDN’T.',
    summary:
      'You isolated the fault, preserved the payment core, and recovered without surrendering control of the network.',
    status: 'INCIDENT NEUTRALIZED',
  },
  contained: {
    eyebrow: 'ENDING 02 · CONTAINED IMPACT',
    headline: 'THE BLAST RADIUS HELD.',
    summary:
      'The cascade was stopped before total failure. Recovery came with measurable damage, but the platform survived the night.',
    status: 'SERVICE RESTORED',
  },
  cascade: {
    eyebrow: 'ENDING 03 · SYSTEMIC CASCADE',
    headline: 'THE CASCADE WON.',
    summary:
      'Compounding interventions pushed the payment path beyond recovery. The next shift inherits a full regional rebuild.',
    status: 'CRITICAL FAILURE',
  },
} satisfies Record<IncidentResult['ending'], EndingCopy>

const OPTIMAL_PLAYBOOK = [
  {
    phase: 'T+00:40',
    action: 'Isolate the failing edge route',
    command: 'Shift traffic to the healthy regional path before retries amplify.',
  },
  {
    phase: 'T+02:15',
    action: 'Bypass the poisoned cache',
    command: 'Protect checkout reads while preserving a controlled origin load.',
  },
  {
    phase: 'T+04:10',
    action: 'Shield primary database writes',
    command: 'Drain nonessential traffic and reserve connections for payment commits.',
  },
  {
    phase: 'T+06:20',
    action: 'Recover through a measured ramp',
    command: 'Restore capacity in stages and validate telemetry before full release.',
  },
] as const

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatTimelineTime(elapsedSeconds: number) {
  return `T+${formatDuration(elapsedSeconds)}`
}

export function PostmortemScreen({
  result,
  decisions,
  onRestart,
  onExport,
}: PostmortemScreenProps) {
  const ending = ENDING_COPY[result.ending]

  const metrics = [
    { label: 'MTTR', value: formatDuration(result.mttrSeconds), detail: 'MIN : SEC' },
    {
      label: 'Peak affected',
      value: compactNumberFormatter.format(result.peakAffectedUsers),
      detail: 'USERS',
    },
    {
      label: 'Revenue protected',
      value: compactCurrencyFormatter.format(result.revenueProtected),
      detail: 'ESTIMATED',
    },
    {
      label: 'Revenue lost',
      value: compactCurrencyFormatter.format(result.revenueLost),
      detail: 'REALIZED',
    },
    {
      label: 'Final health',
      value: `${Math.round(result.finalHealth)}%`,
      detail: 'SYSTEM',
    },
    {
      label: 'Decision accuracy',
      value: `${Math.round(result.accuracy)}%`,
      detail: 'PLAYBOOK MATCH',
    },
  ]

  return (
    <main
      className={`cinematic-screen postmortem-screen postmortem-screen--${result.ending}`}
      aria-labelledby="postmortem-title"
    >
      <div className="cinematic-grid" aria-hidden="true" />
      <div className="cinematic-scan" aria-hidden="true" />

      <div className="cinematic-shell postmortem-shell">
        <header className="cinematic-header">
          <div className="faultline-wordmark" aria-label="Faultline">
            <span className="faultline-mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <span>FAULTLINE</span>
          </div>

          <div className="cinematic-header-status postmortem-status" aria-label={ending.status}>
            <span className="status-beacon" aria-hidden="true" />
            <span>{ending.status}</span>
            <span>AFTER-ACTION REPORT</span>
          </div>
        </header>

        <section className="postmortem-hero">
          <div className="postmortem-outcome">
            <p className="cinematic-eyebrow">{ending.eyebrow}</p>
            <h1 id="postmortem-title">{ending.headline}</h1>
            <p>{ending.summary}</p>
          </div>

          <div className="grade-lockup" aria-label={`Incident grade ${result.grade}, score ${result.score}`}>
            <div>
              <span>INCIDENT GRADE</span>
              <strong aria-hidden="true">{result.grade}</strong>
            </div>
            <p>
              SCORE <strong>{result.score.toLocaleString('en-US')}</strong>
            </p>
          </div>
        </section>

        <section className="kpi-section" aria-labelledby="kpi-title">
          <div className="briefing-section-label">
            <p id="kpi-title">INCIDENT PERFORMANCE</p>
            <span>FINAL TELEMETRY</span>
          </div>

          <dl className="kpi-grid">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
                <span>{metric.detail}</span>
              </div>
            ))}
          </dl>
        </section>

        <section className="decision-review" aria-labelledby="decision-review-title">
          <div className="decision-review-heading">
            <div>
              <p className="cinematic-eyebrow">DECISION FORENSICS</p>
              <h2 id="decision-review-title">Your timeline vs. the optimal playbook</h2>
            </div>
            <p>
              Compare the sequence, timing, and system effect of every intervention.
            </p>
          </div>

          <div className="timeline-comparison">
            <article className="decision-timeline decision-timeline--user">
              <header>
                <span>YOUR TIMELINE</span>
                <strong>{decisions.length} DECISIONS</strong>
              </header>

              {decisions.length > 0 ? (
                <ol>
                  {decisions.map((decision) => (
                    <li
                      className={`decision-item decision-item--${decision.verdict}`}
                      key={`${decision.decisionId}-${decision.choiceId}-${decision.chosenAt}`}
                    >
                      <div className="decision-time">
                        <time dateTime={`PT${decision.chosenAt}S`}>
                          {formatTimelineTime(decision.chosenAt)}
                        </time>
                        <span>{decision.verdict}</span>
                      </div>
                      <div>
                        <h3>{decision.choiceLabel}</h3>
                        <code>{decision.command}</code>
                        <p>{decision.rationale}</p>
                      </div>
                      <strong className="decision-score">
                        {decision.scoreDelta > 0 ? '+' : ''}
                        {decision.scoreDelta}
                      </strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="timeline-empty">No intervention was recorded.</p>
              )}
            </article>

            <article className="decision-timeline decision-timeline--optimal">
              <header>
                <span>OPTIMAL PLAYBOOK</span>
                <strong>REFERENCE PATH</strong>
              </header>

              <ol>
                {OPTIMAL_PLAYBOOK.map((step) => (
                  <li className="decision-item" key={step.phase}>
                    <div className="decision-time">
                      <time>{step.phase}</time>
                      <span>optimal</span>
                    </div>
                    <div>
                      <h3>{step.action}</h3>
                      <p>{step.command}</p>
                    </div>
                    <span className="playbook-check" aria-label="Recommended">
                      ✓
                    </span>
                  </li>
                ))}
              </ol>
            </article>
          </div>
        </section>

        <footer className="postmortem-footer">
          <p>
            REPORT ID · FL-0213-{result.ending.toUpperCase()}
            <span> · </span>
            GENERATED FROM LIVE SIMULATION TELEMETRY
          </p>

          <div className="postmortem-actions">
            <button className="cinematic-secondary-action" type="button" onClick={onRestart}>
              <span aria-hidden="true">↺</span>
              RUN AGAIN
            </button>
            <button className="cinematic-primary-action" type="button" onClick={onExport}>
              EXPORT REPORT
              <span aria-hidden="true">↓</span>
            </button>
          </div>
        </footer>
      </div>
    </main>
  )
}
