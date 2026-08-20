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
    expect(screen.getByText('Cadastros')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
  })

  it('deve manter no primeiro nível apenas os itens de uso diário', () => {
    renderSidebar()

    // Categorias, Favorecidos e Recorrências são configuração: ficam dentro do
    // grupo Cadastros, recolhido por padrão fora das suas rotas.
    expect(screen.queryByText('Categorias')).not.toBeInTheDocument()
    expect(screen.queryByText('Favorecidos')).not.toBeInTheDocument()
    expect(screen.queryByText('Recorrências')).not.toBeInTheDocument()
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

  describe('grupo Cadastros', () => {
    const getCadastrosControl = () => screen.getByRole('button', { name: 'Cadastros' })

    it('deve exibir "Cadastros" como segundo item, imediatamente após "Home"', () => {
      renderSidebar()

      const homeItem = screen
        .getByText('Home')
        .closest('[data-slot="sidebar-menu-item"]')
      const cadastrosItem = screen
        .getByText('Cadastros')
        .closest('[data-slot="sidebar-menu-item"]')

      expect(homeItem).not.toBeNull()
      expect(cadastrosItem).not.toBeNull()
      expect(homeItem?.nextElementSibling).toBe(cadastrosItem)
    })

    it('deve manter Calendário e Despesa depois do grupo Cadastros', () => {
      renderSidebar()

      const items = Array.from(
        document.querySelectorAll('[data-slot="sidebar-menu-item"]')
      )
      const labelAt = (index: number) => items[index]?.textContent ?? ''

      expect(labelAt(0)).toContain('Home')
      expect(labelAt(1)).toContain('Cadastros')
      expect(labelAt(2)).toContain('Calendário')
      expect(labelAt(3)).toContain('Despesa')
      expect(labelAt(4)).toContain('Relatórios')
    })

    it('deve renderizar Cadastros como controle de expansão, não como link', () => {
      renderSidebar()

      expect(getCadastrosControl()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('link', { name: 'Cadastros' })).not.toBeInTheDocument()
    })

    it('deve revelar Recorrências, Categorias e Favorecidos ao acionar Cadastros', () => {
      renderSidebar()

      fireEvent.click(getCadastrosControl())

      expect(screen.getByText('Recorrências')).toBeInTheDocument()
      expect(screen.getByText('Categorias')).toBeInTheDocument()
      expect(screen.getByText('Favorecidos')).toBeInTheDocument()
    })

    it('deve recolher o grupo ao acionar Cadastros novamente', () => {
      renderSidebar()

      fireEvent.click(getCadastrosControl())
      expect(screen.getByText('Recorrências')).toBeInTheDocument()

      fireEvent.click(getCadastrosControl())
      expect(screen.queryByText('Recorrências')).not.toBeInTheDocument()
    })

    it('deve vir com o grupo já expandido ao montar em /recorrencias', () => {
      renderSidebar({ currentPath: '/recorrencias' })

      expect(getCadastrosControl()).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Recorrências')).toBeInTheDocument()
    })

    it('deve marcar o subitem Recorrências como ativo na rota /recorrencias', () => {
      renderSidebar({ currentPath: '/recorrencias' })

      const recorrenciasButton = screen.getByText('Recorrências')
      expect(recorrenciasButton.closest('[data-active="true"]')).toBeInTheDocument()
    })

    it('não deve marcar o grupo como ativo em rota fora dos cadastros', () => {
      renderSidebar({ currentPath: '/despesa' })

      expect(getCadastrosControl().closest('[data-active="true"]')).not.toBeInTheDocument()
    })

    it('deve expandir a barra e revelar os cadastros ao acionar no modo recolhido', () => {
      renderSidebar({ defaultOpen: false })

      expect(screen.queryByText('Categorias')).not.toBeInTheDocument()

      fireEvent.click(getCadastrosControl())

      expect(screen.getByText('Categorias')).toBeInTheDocument()
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
      expect(screen.getByText('Calendário').closest('a')).toBeInTheDocument()
    })

    it('deve expandir a barra e revelar Despesas ao acionar Relatórios no modo recolhido', () => {
      renderSidebar({ defaultOpen: false })

      expect(screen.queryByText('Despesas')).not.toBeInTheDocument()

      fireEvent.click(getReportsControl())

      expect(screen.getByText('Despesas')).toBeInTheDocument()
    })
  })
})
