import { render, screen } from '@testing-library/react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Sidebar } from '../Sidebar'

describe('Sidebar', () => {
  const renderSidebar = (props: { currentPath?: string } = {}) => {
    return render(
      <SidebarProvider defaultOpen={true}>
        <Sidebar currentPath={props.currentPath ?? '/'} />
      </SidebarProvider>
    )
  }

  it('deve renderizar corretamente com 3 itens de navegação', () => {
    renderSidebar()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
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

  it('deve renderizar SidebarRail', () => {
    renderSidebar()
    const rail = document.querySelector('[data-sidebar="rail"]')
    expect(rail).toBeInTheDocument()
  })

  it('deve exibir o título "Evoluire" na sidebar', () => {
    renderSidebar()
    expect(screen.getByText('Evoluire')).toBeInTheDocument()
  })
})
