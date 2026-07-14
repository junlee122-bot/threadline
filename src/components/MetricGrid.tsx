import { CircleDollarSign, HeartPulse, TimerReset, Users } from 'lucide-react'
import type { SimulationSnapshot } from '../types'

interface MetricGridProps {
  snapshot: SimulationSnapshot
}

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function MetricGrid({ snapshot }: MetricGridProps) {
  const healthTone = snapshot.health >= 70 ? 'good' : snapshot.health >= 38 ? 'warn' : 'critical'

  const metrics = [
    {
      label: 'System health',
      value: `${Math.round(snapshot.health)}%`,
      detail: snapshot.health >= 70 ? 'Recovering' : snapshot.health >= 38 ? 'Unstable' : 'Cascade risk',
      icon: HeartPulse,
      tone: healthTone,
    },
    {
      label: 'Affected users',
      value: compactNumber.format(snapshot.affectedUsers),
      detail: `${snapshot.metrics.errorRate.toFixed(1)}% checkout errors`,
      icon: Users,
      tone: snapshot.affectedUsers > 500_000 ? 'critical' : 'warn',
    },
    {
      label: 'Revenue at risk',
      value: `$${compactNumber.format(snapshot.revenueLossRate)}/m`,
      detail: `$${compactNumber.format(snapshot.totalRevenueLost)} lost`,
      icon: CircleDollarSign,
      tone: snapshot.revenueLossRate > 700_000 ? 'critical' : 'warn',
    },
    {
      label: 'p95 latency',
      value: `${Math.round(snapshot.metrics.latency)} ms`,
      detail: `${Math.round(snapshot.metrics.throughput).toLocaleString()} req/s`,
      icon: TimerReset,
      tone: snapshot.metrics.latency > 2400 ? 'critical' : snapshot.metrics.latency > 900 ? 'warn' : 'good',
    },
  ] as const

  return (
    <section className="metric-grid" aria-label="Live incident metrics">
      {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
        <article className={`metric-card tone-${tone}`} key={label}>
          <div className="metric-card-topline">
            <span>{label}</span>
            <Icon size={14} aria-hidden="true" />
          </div>
          <strong>{value}</strong>
          <small>{detail}</small>
          <span className="metric-accent" aria-hidden="true" />
        </article>
      ))}
    </section>
  )
}
