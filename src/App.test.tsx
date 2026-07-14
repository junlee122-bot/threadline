// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('FAULTLINE experience', () => {
  it('moves from the mission briefing into the live command deck', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /the world is failing to pay/i }),
    ).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: /begin incident/i }))

    expect(
      screen.getByRole('region', { name: /incident telemetry and topology/i }),
    ).toBeVisible()
    expect(screen.getByRole('region', { name: /live service topology/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /checkout, nominal/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('holds the clock for a command decision and supports numeric shortcuts', () => {
    vi.useFakeTimers()
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /begin incident/i }))

    act(() => {
      vi.advanceTimersByTime(12_000)
    })

    expect(screen.getByRole('dialog', { name: /a suspicious coincidence/i })).toBeVisible()
    fireEvent.keyDown(window, { key: '1', code: 'Digit1' })

    expect(
      screen.queryByRole('dialog', { name: /a suspicious coincidence/i }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('optimal')).toBeVisible()
  })
})
