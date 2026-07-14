import { TerminalSquare } from 'lucide-react'
import type { DecisionRecord } from '../types'

interface LogStreamProps {
  elapsed: number
  records: DecisionRecord[]
}

type LogLevel = 'info' | 'warn' | 'error' | 'success'

interface LogEntry {
  at: number
  level: LogLevel
  service: string
  message: string
}

const SYSTEM_LOGS: LogEntry[] = [
  { at: 0, level: 'error', service: 'checkout-api', message: 'SLO burn rate 38.4× / multi-window alert fired' },
  { at: 8, level: 'warn', service: 'edge-sin1', message: 'upstream resets exceeded 12% threshold' },
  { at: 18, level: 'error', service: 'payments', message: 'deadline exceeded awaiting checkout context' },
  { at: 34, level: 'warn', service: 'deploy-ctrl', message: 'release 7f3a1d healthy in canary cohort' },
  { at: 53, level: 'error', service: 'redis-cluster', message: 'GET miss burst detected on product:* namespace' },
  { at: 79, level: 'warn', service: 'postgres-02', message: 'active connections 1,842 / 2,000' },
  { at: 111, level: 'error', service: 'checkout-api', message: 'connection acquisition timeout after 800ms' },
  { at: 147, level: 'info', service: 'tracing', message: 'fan-out correlation complete: cache → database' },
  { at: 181, level: 'error', service: 'redis-cluster', message: 'eviction storm: 17.2M keys invalidated' },
  { at: 219, level: 'warn', service: 'postgres-02', message: 'pool saturation propagating to payment writes' },
  { at: 263, level: 'info', service: 'traffic-mgr', message: 'load distribution policy recalculated' },
  { at: 304, level: 'warn', service: 'checkout-api', message: 'retry budget at 14% — circuit breaker armed' },
  { at: 351, level: 'info', service: 'slo-engine', message: 'recovery gradient evaluation started' },
  { at: 401, level: 'success', service: 'edge-sin1', message: 'successful checkout cohort increasing' },
  { at: 447, level: 'info', service: 'incident-bot', message: 'preparing containment assessment' },
]

function timestamp(at: number) {
  const total = 2 * 3600 + 13 * 60 + 7 + Math.floor(at)
  return `${String(Math.floor(total / 3600) % 24).padStart(2, '0')}:${String(Math.floor((total % 3600) / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function LogStream({ elapsed, records }: LogStreamProps) {
  const actionLogs: LogEntry[] = records.map((record) => ({
    at: record.chosenAt,
    level: record.verdict === 'optimal' ? 'success' : record.verdict === 'mixed' ? 'warn' : 'error',
    service: 'commander',
    message: `executed ${record.command} / ${record.choiceLabel}`,
  }))

  const visible = [...SYSTEM_LOGS.filter((log) => log.at <= elapsed), ...actionLogs]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8)

  return (
    <section className="log-panel panel-shell" aria-labelledby="log-stream-title">
      <div className="panel-heading">
        <span><TerminalSquare size={13} aria-hidden="true" /> LIVE EVENT STREAM</span>
        <span className="streaming-badge"><i /> STREAMING</span>
      </div>
      <h2 id="log-stream-title" className="sr-only">Live event stream</h2>
      <div className="log-list" role="log" aria-live="off">
        {visible.map((log, index) => (
          <div className={`log-line log-${log.level}`} key={`${log.at}-${log.service}-${index}`}>
            <time>{timestamp(log.at)}</time>
            <span className="log-level">{log.level.toUpperCase()}</span>
            <span className="log-service">{log.service}</span>
            <p>{log.message}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
