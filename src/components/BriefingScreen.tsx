import './cinematic.css'

interface BriefingScreenProps {
  onBegin: () => void
}

const INCIDENT_SCOPE = [
  {
    label: 'Blast radius',
    value: '42 markets',
    detail: 'Checkout failures are propagating across every active region.',
  },
  {
    label: 'Traffic at risk',
    value: '18.4K tx/s',
    detail: 'Peak purchase traffic is still climbing into the incident window.',
  },
  {
    label: 'Revenue exposure',
    value: '$2.4M / min',
    detail: 'Authorization retries are compounding the loss rate.',
  },
  {
    label: 'Recovery window',
    value: '08:00',
    detail: 'Contain the cascade before database saturation becomes irreversible.',
  },
] as const

export function BriefingScreen({ onBegin }: BriefingScreenProps) {
  return (
    <main className="cinematic-screen briefing-screen" aria-labelledby="briefing-title">
      <div className="cinematic-grid" aria-hidden="true" />
      <div className="cinematic-scan" aria-hidden="true" />

      <div className="cinematic-shell briefing-shell">
        <header className="cinematic-header">
          <a className="faultline-wordmark" href="#briefing-title" aria-label="Faultline incident simulator">
            <span className="faultline-mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <span>FAULTLINE</span>
          </a>

          <div className="cinematic-header-status" aria-label="Incident status">
            <span className="status-beacon" aria-hidden="true" />
            <span>SEV-0 · ACTIVE</span>
            <time dateTime="02:13">02:13 UTC</time>
          </div>
        </header>

        <section className="briefing-hero" aria-describedby="briefing-summary">
          <div className="briefing-copy">
            <p className="cinematic-eyebrow">
              <span>INCIDENT 017</span>
              <span aria-hidden="true">/</span>
              <span>GLOBAL PAYMENTS</span>
            </p>

            <h1 id="briefing-title">
              THE WORLD IS{' '}
              <span>FAILING TO PAY.</span>
            </h1>

            <p id="briefing-summary" className="briefing-summary">
              At <strong>02:13 UTC</strong>, authorization latency crossed the red line.
              Payment failures are now cascading from the edge into checkout, cache,
              and the primary database. You are the incident commander.
            </p>

            <div className="briefing-directive" role="note" aria-label="Mission directive">
              <span className="briefing-directive-index">DIRECTIVE</span>
              <p>
                Read the telemetry. Choose the safest intervention. Protect the
                system before the eight-minute recovery window closes.
              </p>
            </div>
          </div>

          <aside className="countdown-panel" aria-labelledby="countdown-label">
            <div>
              <p id="countdown-label">RECOVERY WINDOW</p>
              <time dateTime="PT8M" aria-label="Eight minutes">
                08<span aria-hidden="true">:</span>00
              </time>
            </div>

            <div className="countdown-orbit" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <p className="countdown-warning">
              Decisions are final. The system continues to degrade while you
              investigate.
            </p>
          </aside>
        </section>

        <section className="briefing-scope" aria-labelledby="scope-title">
          <div className="briefing-section-label">
            <p id="scope-title">KNOWN SCOPE</p>
            <span>LIVE SNAPSHOT · T+00:00</span>
          </div>

          <ul className="scope-grid">
            {INCIDENT_SCOPE.map((item, index) => (
              <li key={item.label}>
                <span className="scope-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="briefing-footer">
          <p>
            <span aria-hidden="true">⌁</span>
            Keyboard and screen-reader controls are available throughout the simulation.
          </p>

          <button className="cinematic-primary-action" type="button" onClick={onBegin}>
            <span>BEGIN INCIDENT</span>
            <span aria-hidden="true">↗</span>
          </button>
        </footer>
      </div>
    </main>
  )
}
