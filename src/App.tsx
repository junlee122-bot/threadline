import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Network, PauseCircle, ScanSearch, Waves } from 'lucide-react'
import './App.css'
import { BriefingScreen } from './components/BriefingScreen'
import { DecisionPanel } from './components/DecisionPanel'
import { IncidentHeader, type SimulationSpeed } from './components/IncidentHeader'
import { IncidentProgress } from './components/IncidentProgress'
import { LogStream } from './components/LogStream'
import { MetricGrid } from './components/MetricGrid'
import { EvidencePanel, ServiceInspector } from './components/OperationsRail'
import { PostmortemScreen } from './components/PostmortemScreen'
import { ServiceMap } from './components/ServiceMap'
import { TelemetryChart } from './components/TelemetryChart'
import {
  INCIDENT_DECISIONS,
  INITIAL_MODIFIERS,
  TOTAL_SECONDS,
} from './game/scenario'
import { applyChoice, buildResult, computeSnapshot } from './game/simulation'
import type {
  DecisionChoice,
  DecisionRecord,
  IncidentResult,
  MetricKey,
  ServiceId,
  SimulationModifiers,
  TelemetryPoint,
} from './types'

type Screen = 'briefing' | 'incident' | 'postmortem'

const METRIC_TABS: Array<{ id: MetricKey; label: string }> = [
  { id: 'latency', label: 'p95 latency' },
  { id: 'errorRate', label: 'error rate' },
  { id: 'throughput', label: 'throughput' },
  { id: 'dbConnections', label: 'DB pool' },
  { id: 'cacheHitRate', label: 'cache hit' },
]

function App() {
  const [screen, setScreen] = useState<Screen>('briefing')
  const [elapsed, setElapsed] = useState(0)
  const [modifiers, setModifiers] = useState<SimulationModifiers>(INITIAL_MODIFIERS)
  const [records, setRecords] = useState<DecisionRecord[]>([])
  const [history, setHistory] = useState<TelemetryPoint[]>([
    computeSnapshot(0, INITIAL_MODIFIERS).metrics,
  ])
  const [totalRevenueLost, setTotalRevenueLost] = useState(0)
  const [selectedServiceId, setSelectedServiceId] = useState<ServiceId>('checkout')
  const [activeMetric, setActiveMetric] = useState<MetricKey>('latency')
  const [speed, setSpeed] = useState<SimulationSpeed>(4)
  const [isPaused, setIsPaused] = useState(false)
  const [result, setResult] = useState<IncidentResult | null>(null)

  const elapsedRef = useRef(0)
  const modifiersRef = useRef<SimulationModifiers>(INITIAL_MODIFIERS)
  const lossRef = useRef(0)
  const lastHistoryTickRef = useRef(-1)

  const computedSnapshot = useMemo(
    () => computeSnapshot(elapsed, modifiers),
    [elapsed, modifiers],
  )
  const snapshot = useMemo(
    () => ({ ...computedSnapshot, totalRevenueLost: Math.round(totalRevenueLost) }),
    [computedSnapshot, totalRevenueLost],
  )

  const activeDecision = useMemo(
    () =>
      INCIDENT_DECISIONS.find(
        (decision) =>
          elapsed >= decision.triggerAt &&
          !records.some((record) => record.decisionId === decision.id),
      ) ?? null,
    [elapsed, records],
  )

  const selectedService =
    snapshot.services.find((service) => service.id === selectedServiceId) ??
    snapshot.services[0]

  const chooseDecision = useCallback((choice: DecisionChoice) => {
    if (!activeDecision) return
    const nextModifiers = applyChoice(modifiersRef.current, choice)
    modifiersRef.current = nextModifiers
    setModifiers(nextModifiers)
    setRecords((current) => [
      ...current,
      {
        decisionId: activeDecision.id,
        choiceId: choice.id,
        title: activeDecision.title,
        choiceLabel: choice.label,
        command: choice.command,
        verdict: choice.verdict,
        scoreDelta: choice.scoreDelta,
        rationale: choice.rationale,
        chosenAt: Math.round(elapsedRef.current),
      },
    ])
  }, [activeDecision])

  useEffect(() => {
    if (
      screen !== 'incident' ||
      isPaused ||
      activeDecision ||
      elapsedRef.current >= TOTAL_SECONDS
    ) {
      return
    }

    let lastFrame = performance.now()
    const interval = window.setInterval(() => {
      const now = performance.now()
      const realDelta = Math.min(0.5, (now - lastFrame) / 1000)
      lastFrame = now

      const current = elapsedRef.current
      const next = Math.min(TOTAL_SECONDS, current + realDelta * speed)
      const midpoint = current + (next - current) / 2
      const lossRate = computeSnapshot(midpoint, modifiersRef.current).revenueLossRate

      lossRef.current += lossRate * (next - current)
      elapsedRef.current = next
      setTotalRevenueLost(lossRef.current)
      setElapsed(next)
    }, 100)

    return () => window.clearInterval(interval)
  }, [activeDecision, isPaused, screen, speed])

  useEffect(() => {
    const tick = snapshot.metrics.tick
    if (screen !== 'incident' || tick === lastHistoryTickRef.current) return
    lastHistoryTickRef.current = tick
    setHistory((current) => [...current, snapshot.metrics].slice(-120))
  }, [screen, snapshot.metrics])

  useEffect(() => {
    if (screen !== 'incident' || elapsed < TOTAL_SECONDS) return
    const finalResult = buildResult(snapshot, records)
    setResult(finalResult)
    setScreen('postmortem')
  }, [elapsed, records, screen, snapshot])

  useEffect(() => {
    if (screen !== 'incident') return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isTyping =
        target instanceof Element &&
        target.matches('input, textarea, select, [contenteditable="true"]')
      if (isTyping) return

      if (activeDecision && ['1', '2', '3'].includes(event.key)) {
        const choice = activeDecision.choices[Number(event.key) - 1]
        if (choice) {
          event.preventDefault()
          chooseDecision(choice)
        }
        return
      }

      if (event.code === 'Space' && !activeDecision) {
        event.preventDefault()
        setIsPaused((current) => !current)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeDecision, chooseDecision, screen])

  function resetSimulation() {
    elapsedRef.current = 0
    modifiersRef.current = INITIAL_MODIFIERS
    lossRef.current = 0
    lastHistoryTickRef.current = -1
    setElapsed(0)
    setModifiers(INITIAL_MODIFIERS)
    setRecords([])
    setHistory([computeSnapshot(0, INITIAL_MODIFIERS).metrics])
    setTotalRevenueLost(0)
    setSelectedServiceId('checkout')
    setActiveMetric('latency')
    setSpeed(4)
    setIsPaused(false)
    setResult(null)
  }

  function beginIncident() {
    resetSimulation()
    setScreen('incident')
  }

  function restartIncident() {
    resetSimulation()
    setScreen('briefing')
  }

  function exportReport() {
    if (!result) return
    const report = [
      '# FAULTLINE / AFTER-ACTION REPORT',
      '',
      `Ending: ${result.ending.toUpperCase()}`,
      `Grade: ${result.grade} (${result.score}/100)`,
      `MTTR: ${Math.floor(result.mttrSeconds / 60)}m ${result.mttrSeconds % 60}s`,
      `Decision accuracy: ${result.accuracy}%`,
      `Revenue protected: $${result.revenueProtected.toLocaleString()}`,
      `Revenue lost: $${result.revenueLost.toLocaleString()}`,
      '',
      '## COMMAND TIMELINE',
      ...records.flatMap((record) => [
        '',
        `### T+${record.chosenAt}s / ${record.choiceLabel}`,
        `\`${record.command}\``,
        `${record.verdict.toUpperCase()} (${record.scoreDelta > 0 ? '+' : ''}${record.scoreDelta}) — ${record.rationale}`,
      ]),
      '',
      'Root cause: synchronized cache expiry triggered an origin stampede and exhausted the database connection pool.',
      '',
      '_Generated by FAULTLINE Incident Commander. Scenario data is synthetic._',
    ].join('\n')
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `faultline-${result.ending}-report.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (screen === 'briefing') {
    return <BriefingScreen onBegin={beginIncident} />
  }

  if (screen === 'postmortem' && result) {
    return (
      <PostmortemScreen
        result={result}
        decisions={records}
        onRestart={restartIncident}
        onExport={exportReport}
      />
    )
  }

  return (
    <div className="incident-app">
      <IncidentHeader
        remaining={snapshot.remaining}
        elapsed={elapsed}
        status={snapshot.status}
        isPaused={isPaused}
        speed={speed}
        onTogglePause={() => setIsPaused((current) => !current)}
        onSpeedChange={setSpeed}
      />

      {isPaused && !activeDecision && (
        <div className="paused-banner" role="status">
          <PauseCircle size={13} aria-hidden="true" /> SIMULATION PAUSED / PRESS SPACE TO RESUME
        </div>
      )}

      <main className="command-deck">
        <aside className="deck-column deck-left">
          <IncidentProgress
            decisions={INCIDENT_DECISIONS}
            records={records}
            elapsed={elapsed}
          />
          <ServiceInspector service={selectedService} />
        </aside>

        <section className="deck-column deck-center" aria-label="Incident telemetry and topology">
          <MetricGrid snapshot={snapshot} />

          <div className="stage-panel panel-shell">
            <div className="panel-heading stage-heading">
              <span><Network size={13} aria-hidden="true" /> <span id="topology-title">LIVE SERVICE TOPOLOGY</span></span>
              <span className="status-legend" aria-label="Status legend">
                <span className="legend-item"><i className="legend-dot degraded" />Degraded</span>
                <span className="legend-item"><i className="legend-dot critical" />Critical</span>
                <span className="legend-item"><i className="legend-dot recovering" />Recovering</span>
              </span>
            </div>
            <div className="service-map-wrap">
              <ServiceMap
                services={snapshot.services}
                links={snapshot.links}
                selectedId={selectedServiceId}
                onSelect={setSelectedServiceId}
              />
            </div>
          </div>

          <section className="telemetry-panel panel-shell" aria-labelledby="telemetry-title">
            <div className="panel-heading telemetry-heading">
              <span><Waves size={13} aria-hidden="true" /> <span id="telemetry-title">ROLLING TELEMETRY</span></span>
              <span className="metric-tabs" aria-label="Telemetry metric">
                {METRIC_TABS.map((metric) => (
                  <button
                    type="button"
                    className={`metric-tab ${activeMetric === metric.id ? 'is-active' : ''}`}
                    key={metric.id}
                    aria-pressed={activeMetric === metric.id}
                    onClick={() => setActiveMetric(metric.id)}
                  >
                    {metric.label}
                  </button>
                ))}
              </span>
            </div>
            <div className="telemetry-wrap">
              <TelemetryChart data={history} activeMetric={activeMetric} />
            </div>
          </section>
        </section>

        <aside className="deck-column deck-right">
          <EvidencePanel elapsed={elapsed} records={records} />
          <LogStream elapsed={elapsed} records={records} />
        </aside>
      </main>

      <footer className="simulation-note">
        <span><ScanSearch size={10} aria-hidden="true" /> Synthetic scenario model / deterministic telemetry / no external data</span>
        <span><Activity size={10} aria-hidden="true" /> Keyboard: Space pause · 1–3 execute · Select any service node to inspect</span>
      </footer>

      {activeDecision && (
        <DecisionPanel decision={activeDecision} onChoose={chooseDecision} />
      )}
    </div>
  )
}

export default App
