import { Activity, Gauge, Pause, Play, Radio } from 'lucide-react'
import type { SystemStatus } from '../types'

export type SimulationSpeed = 1 | 4 | 8

interface IncidentHeaderProps {
  remaining: number
  elapsed: number
  status: SystemStatus
  isPaused: boolean
  speed: SimulationSpeed
  onTogglePause: () => void
  onSpeedChange: (speed: SimulationSpeed) => void
}

function formatCountdown(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function formatUtc(elapsed: number) {
  const total = 2 * 3600 + 13 * 60 + 7 + Math.floor(elapsed)
  const hours = Math.floor(total / 3600) % 24
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} UTC`
}

const STATUS_COPY: Record<SystemStatus, string> = {
  nominal: 'SYSTEM NOMINAL',
  degraded: 'SERVICE DEGRADED',
  critical: 'SEV-1 ACTIVE',
  recovering: 'RECOVERY IN PROGRESS',
}

export function IncidentHeader({
  remaining,
  elapsed,
  status,
  isPaused,
  speed,
  onTogglePause,
  onSpeedChange,
}: IncidentHeaderProps) {
  return (
    <header className="incident-header">
      <div className="brand-lockup" aria-label="Faultline incident command">
        <span className="brand-mark"><Activity size={16} strokeWidth={2.5} /></span>
        <span className="brand-word">FAULTLINE</span>
        <span className="brand-edition">/ IC-01</span>
      </div>

      <div className="header-status-cluster">
        <div className={`live-status status-${status}`}>
          <Radio size={13} aria-hidden="true" />
          <span>{STATUS_COPY[status]}</span>
        </div>
        <span className="utc-clock">{formatUtc(elapsed)}</span>
      </div>

      <div className="incident-clock" aria-label={`${formatCountdown(remaining)} remaining`}>
        <span className="clock-label">TIME TO CONTAIN</span>
        <strong>T−{formatCountdown(remaining)}</strong>
      </div>

      <div className="playback-controls">
        <button
          type="button"
          className="icon-control"
          onClick={onTogglePause}
          aria-label={isPaused ? 'Resume simulation' : 'Pause simulation'}
        >
          {isPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}
        </button>
        <div className="speed-control" aria-label="Simulation speed">
          <Gauge size={13} aria-hidden="true" />
          {([1, 4, 8] as const).map((value) => (
            <button
              type="button"
              key={value}
              className={speed === value ? 'is-active' : ''}
              onClick={() => onSpeedChange(value)}
              aria-pressed={speed === value}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
