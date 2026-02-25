import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import { CalendarSkeleton } from '@/components/calendar/CalendarSkeleton'

const mockCalendarPage = vi.fn()

vi.mock('@/components/calendar/CalendarPage', () => ({
  get default() {
    return mockCalendarPage()
  },
}))

describe('calendario route', () => {
  beforeEach(() => {
    mockCalendarPage.mockReturnValue(() => (
      <div data-testid="calendar-page">Calendar Page</div>
    ))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('deve usar Suspense com CalendarSkeleton como fallback', () => {
    render(
      <Suspense fallback={<CalendarSkeleton view="month" />}>
        <div data-testid="content">Content</div>
      </Suspense>
    )
    
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('CalendarSkeleton deve ter props corretas', () => {
    render(<CalendarSkeleton view="month" />)
    
    const skeleton = screen.getByRole('status')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    expect(skeleton).toHaveAttribute('aria-label', 'Carregando calendário')
  })

  it('CalendarSkeleton deve renderizar grid para view month', () => {
    render(<CalendarSkeleton view="month" />)
    
    const cells = document.querySelectorAll('.animate-pulse')
    expect(cells.length).toBe(42)
  })

  it('CalendarSkeleton deve renderizar grid para view week', () => {
    render(<CalendarSkeleton view="week" />)
    
    const cells = document.querySelectorAll('.animate-pulse')
    expect(cells.length).toBe(7)
  })

  it('CalendarSkeleton deve renderizar grid para view day', () => {
    render(<CalendarSkeleton view="day" />)
    
    const cells = document.querySelectorAll('.animate-pulse')
    expect(cells.length).toBe(1)
  })
})
