import { useEffect, useRef, type KeyboardEvent } from 'react'
import { ArrowUpRight, BrainCircuit, Command, ShieldAlert } from 'lucide-react'
import type { DecisionChoice, IncidentDecision } from '../types'

interface DecisionPanelProps {
  decision: IncidentDecision
  onChoose: (choice: DecisionChoice) => void
}

export function DecisionPanel({ decision, onChoose }: DecisionPanelProps) {
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    return () => previouslyFocused?.focus()
  }, [])

  function trapFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return
    const buttons = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    )
    if (buttons.length === 0) return

    const first = buttons[0]
    const last = buttons[buttons.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="decision-backdrop" role="presentation">
      <section
        className="decision-panel"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
        aria-describedby="decision-situation"
        onKeyDown={trapFocus}
      >
        <div className="decision-signal-column" aria-hidden="true">
          <span className="signal-ring"><ShieldAlert size={25} /></span>
          <span className="signal-line" />
          <span className="signal-index">{decision.index}</span>
        </div>

        <div className="decision-content">
          <div className="decision-kicker">
            <BrainCircuit size={14} aria-hidden="true" />
            COMMAND DECISION REQUIRED
          </div>
          <h2 id="decision-title">{decision.title}</h2>
          <p id="decision-situation">{decision.situation}</p>
          <div className="signal-evidence">
            <span>NEW SIGNAL</span>
            <code>{decision.signal}</code>
          </div>

          <div className="decision-options" aria-label="Response options">
            {decision.choices.map((choice, index) => (
              <button
                type="button"
                className="decision-option"
                key={choice.id}
                onClick={() => onChoose(choice)}
                autoFocus={index === 0}
              >
                <span className="option-number">0{index + 1}</span>
                <span className="option-body">
                  <strong>{choice.label}</strong>
                  <small><Command size={11} aria-hidden="true" /> {choice.command}</small>
                  <span>{choice.description}</span>
                </span>
                <ArrowUpRight className="option-arrow" size={17} aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="decision-footer">
            Incident clock held while you decide
            <span>Press 1–3 to execute</span>
          </div>
        </div>
      </section>
    </div>
  )
}
