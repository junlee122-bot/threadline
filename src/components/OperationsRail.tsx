import { Binary, Eye, ServerCog } from 'lucide-react'
import type { DecisionRecord, ServiceNode } from '../types'

interface EvidencePanelProps {
  elapsed: number
  records: DecisionRecord[]
}

const EVIDENCE = [
  {
    unlockAt: 24,
    title: 'Canary cohort remains healthy',
    detail: 'New release is correlated, but not causal.',
  },
  {
    unlockAt: 86,
    title: 'Cache hit rate collapses first',
    detail: '−62 pts exactly 1.8s before DB saturation.',
  },
  {
    unlockAt: 158,
    title: '17.2M keys invalidated together',
    detail: 'Regional catalog job exceeded its shard scope.',
  },
  {
    unlockAt: 238,
    title: 'Connection pool is downstream damage',
    detail: 'Retries amplify the cache stampede by 4.7×.',
  },
]

export function EvidencePanel({ elapsed, records }: EvidencePanelProps) {
  const optimalSignals = records.filter((record) => record.verdict === 'optimal').length
  const revealBoost = optimalSignals * 28

  return (
    <section className="evidence-panel panel-shell" aria-labelledby="evidence-title">
      <div className="panel-heading">
        <span><Eye size={13} aria-hidden="true" /> EVIDENCE BOARD</span>
        <span>{EVIDENCE.filter((item) => elapsed + revealBoost >= item.unlockAt).length}/{EVIDENCE.length} CORRELATED</span>
      </div>
      <h2 id="evidence-title" className="sr-only">Correlated incident evidence</h2>
      <ul className="evidence-list">
        {EVIDENCE.map((item, index) => {
          const seen = elapsed + revealBoost >= item.unlockAt
          const hot = seen && index === EVIDENCE.length - 1
          return (
            <li className={hot ? 'is-hot' : seen ? 'is-seen' : ''} key={item.title}>
              <i aria-hidden="true" />
              <span className="evidence-copy">
                <strong>{seen ? item.title : 'Signal awaiting correlation'}</strong>
                <small>{seen ? item.detail : `TRACE LOCKED / CONFIDENCE ${16 + index * 7}%`}</small>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

interface ServiceInspectorProps {
  service: ServiceNode
}

export function ServiceInspector({ service }: ServiceInspectorProps) {
  return (
    <section className="service-inspector panel-shell" aria-labelledby="service-inspector-title">
      <div className="panel-heading">
        <span><ServerCog size={13} aria-hidden="true" /> SELECTED SERVICE</span>
        <Binary size={13} aria-hidden="true" />
      </div>
      <div className="inspector-body">
        <div className="inspector-service">
          <span>
            <strong id="service-inspector-title">{service.label}</strong>
            <small>{service.code} / AP-SOUTHEAST-1</small>
          </span>
          <span className={`status-chip status-${service.status}`}>{service.status}</span>
        </div>
        <div className="inspector-stats">
          <span>Primary signal<strong>{service.metricValue}</strong></span>
          <span>Resource load<strong>{Math.round(service.load)}%</strong></span>
        </div>
      </div>
    </section>
  )
}
