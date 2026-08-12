import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Sidebar } from '../Sidebar'

vi.mock('@/components/calendar/CalendarPage', () => ({
  default: () => <div data-testid="calendar-page">Calendar Page</div>,
}))

describe('Sidebar', () => {
  const renderSidebar = (props: { currentPath?: string; defaultOpen?: boolean } = {}) => {
    return render(
      <SidebarProvider defaultOpen={props.defaultOpen ?? true}>
        <Sidebar currentPath={props.currentPath ?? '/'} />
      </SidebarProvider>
    )
  }

  it('deve renderizar corretamente com itens de navegação', () => {
    renderSidebar()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
    expect(screen.getByText('Calendário')).toBeInTheDocument()
    expect(screen.getByText('Categorias')).toBeInTheDocument()
    expect(screen.getByText('Favorecidos')).toBeInTheDocument()
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

  describe('grupo Relatórios', () => {
    const getReportsControl = () => screen.getByRole('button', { name: 'Relatórios' })

    it('deve renderizar Relatórios como controle de expansão, não como link', () => {
      renderSidebar()

      expect(screen.queryByRole('link', { name: 'Relatórios' })).not.toBeInTheDocument()
      const control = getReportsControl()
      expect(control).toBeInTheDocument()
      expect(control.closest('a')).toBeNull()
    })

    it('deve revelar o subitem Despesas ao acionar Relatórios', () => {
      renderSidebar()

      expect(screen.queryByText('Despesas')).not.toBeInTheDocument()

      fireEvent.click(getReportsControl())

      expect(screen.getByText('Despesas')).toBeInTheDocument()
    })

    it('deve recolher o grupo ao acionar Relatórios novamente', () => {
      renderSidebar()

      fireEvent.click(getReportsControl())
      expect(screen.getByText('Despesas')).toBeInTheDocument()

      fireEvent.click(getReportsControl())
      expect(screen.queryByText('Despesas')).not.toBeInTheDocument()
    })

    it('deve destacar o subitem Despesas como ativo na rota do relatório', () => {
      renderSidebar({ currentPath: '/relatorios/despesas' })

      const despesasSubItem = screen.getByText('Despesas').closest('[data-active="true"]')
      expect(despesasSubItem).toBeInTheDocument()
    })

    it('deve vir com o grupo já expandido ao montar em /relatorios/despesas', () => {
      renderSidebar({ currentPath: '/relatorios/despesas' })

      expect(screen.getByText('Despesas')).toBeInTheDocument()
      expect(getReportsControl()).toHaveAttribute('aria-expanded', 'true')
    })

    it('deve manter o grupo expandido ao navegar dentro da área de relatórios', () => {
      const { rerender } = renderSidebar({ currentPath: '/relatorios/despesas' })
      expect(screen.getByText('Despesas')).toBeInTheDocument()

      rerender(
        <SidebarProvider defaultOpen={true}>
          <Sidebar currentPath="/relatorios" />
        </SidebarProvider>
      )

      expect(screen.getByText('Despesas')).toBeInTheDocument()
    })

    it('deve ser operável por teclado: foco no controle e Enter expande', async () => {
      const user = userEvent.setup()
      renderSidebar()

      const control = getReportsControl()
      control.focus()
      expect(control).toHaveFocus()

      await user.keyboard('{Enter}')

      expect(screen.getByText('Despesas')).toBeInTheDocument()
    })

    it('deve expor o estado de expansão a leitores de tela via aria-expanded', () => {
      renderSidebar()

      const control = getReportsControl()
      expect(control).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(control)

      expect(control).toHaveAttribute('aria-expanded', 'true')
    })

    it('deve manter a altura de 44px (h-11) exigida pelo alvo de toque', () => {
      renderSidebar()

      expect(getReportsControl()).toHaveClass('h-11')
    })

    it('deve manter os demais itens de navegação como links diretos', () => {
      renderSidebar()

      expect(screen.getByText('Home').closest('a')).toBeInTheDocument()
      expect(screen.getByText('Despesa').closest('a')).toBeInTheDocument()
      expect(screen.getByText('Categorias').closest('a')).toBeInTheDocument()
      expect(screen.getByText('Favorecidos').closest('a')).toBeInTheDocument()
    })

    it('deve expandir a barra e revelar Despesas ao acionar Relatórios no modo recolhido', () => {
      renderSidebar({ defaultOpen: false })

      expect(screen.queryByText('Despesas')).not.toBeInTheDocument()

      fireEvent.click(getReportsControl())

      expect(screen.getByText('Despesas')).toBeInTheDocument()
    })
  })
})
