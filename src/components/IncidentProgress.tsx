import { Check, CircleDot, Crosshair, LockKeyhole } from 'lucide-react'
import type { DecisionRecord, IncidentDecision } from '../types'

interface IncidentProgressProps {
  decisions: IncidentDecision[]
  records: DecisionRecord[]
  elapsed: number
}

export function IncidentProgress({ decisions, records, elapsed }: IncidentProgressProps) {
  return (
    <section className="progress-panel panel-shell" aria-labelledby="response-path-title">
      <div className="panel-heading">
        <span><Crosshair size={13} aria-hidden="true" /> RESPONSE PATH</span>
        <span>{records.length}/{decisions.length}</span>
      </div>
      <h2 id="response-path-title" className="sr-only">Incident response progress</h2>
      <ol className="response-path">
        {decisions.map((decision, index) => {
          const record = records.find((item) => item.decisionId === decision.id)
          const active = !record && elapsed >= decision.triggerAt
          const unlocked = elapsed >= decision.triggerAt
          return (
            <li className={record ? 'is-complete' : active ? 'is-active' : ''} key={decision.id}>
              <span className="path-icon" aria-hidden="true">
                {record ? <Check size={12} /> : active ? <CircleDot size={12} /> : <LockKeyhole size={11} />}
              </span>
              <span className="path-copy">
                <small>PHASE {String(index + 1).padStart(2, '0')}</small>
                <strong>{decision.title}</strong>
                {record && <em className={`verdict-${record.verdict}`}>{record.verdict}</em>}
              </span>
              <span className="path-time">{unlocked ? 'LIVE' : `+${Math.floor(decision.triggerAt / 60)}M`}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
