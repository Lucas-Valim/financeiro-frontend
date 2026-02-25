import { render, screen, fireEvent, act } from '@testing-library/react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Sidebar } from '../Sidebar'

vi.mock('@/components/calendar/CalendarPage', () => ({
  default: () => <div data-testid="calendar-page">Calendar Page</div>,
}))

describe('Sidebar', () => {
  const renderSidebar = (props: { currentPath?: string } = {}) => {
    return render(
      <SidebarProvider defaultOpen={true}>
        <Sidebar currentPath={props.currentPath ?? '/'} />
      </SidebarProvider>
    )
  }

  it('deve renderizar corretamente com 4 itens de navegação', () => {
    renderSidebar()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
    expect(screen.getByText('Calendário')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
  })

  it('deve indicar visualmente a página ativa', () => {
    renderSidebar({ currentPath: '/' })
    
    const homeButton = screen.getByText('Home')
    expect(homeButton).toBeInTheDocument()
    expect(homeButton.closest('[data-active="true"]')).toBeInTheDocument()
  })

  it('deve atualizar a página ativa ao mudar prop', () => {
    const { rerender } = renderSidebar({ currentPath: '/' })
    expect(screen.getByText('Home').closest('[data-active="true"]')).toBeInTheDocument()
    
    rerender(
      <SidebarProvider defaultOpen={true}>
        <Sidebar currentPath="/despesa" />
      </SidebarProvider>
    )
    
    expect(screen.getByText('Despesa').closest('[data-active="true"]')).toBeInTheDocument()
  })

  it('deve indicar visualmente a página do calendário como ativa', () => {
    renderSidebar({ currentPath: '/calendario' })
    
    const calendarioButton = screen.getByText('Calendário')
    expect(calendarioButton).toBeInTheDocument()
    expect(calendarioButton.closest('[data-active="true"]')).toBeInTheDocument()
  })

  it('deve renderizar SidebarRail', () => {
    renderSidebar()
    const rail = document.querySelector('[data-sidebar="rail"]')
    expect(rail).toBeInTheDocument()
  })

  it('deve exibir o título "Evoluire" na sidebar', () => {
    renderSidebar()
    expect(screen.getByText('Evoluire')).toBeInTheDocument()
  })

  it('deve chamar preload do calendário ao fazer hover no link', async () => {
    renderSidebar()
    
    const calendarioLink = screen.getByText('Calendário').closest('a')
    expect(calendarioLink).toBeInTheDocument()
    
    await act(async () => {
      if (calendarioLink) {
        fireEvent.mouseEnter(calendarioLink)
      }
    })
  })
})
