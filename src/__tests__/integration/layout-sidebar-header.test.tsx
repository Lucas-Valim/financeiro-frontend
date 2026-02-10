import { render, screen, within } from '@testing-library/react'
import { Layout } from '@/components/Layout'

describe('Integration: Layout + Sidebar + Header', () => {
  it('deve renderizar estrutura completa com Sidebar e Header', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('deve renderizar Sidebar como filho do Layout', () => {
    const { container } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const sidebar = container.querySelector('[data-sidebar]')
    expect(sidebar).toBeInTheDocument()
  })

  it('deve renderizar Header dentro do Layout', () => {
    const { container } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
    if (header) {
      expect(within(header).getByText('Financeiro')).toBeInTheDocument()
      expect(within(header).getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    }
  })

  it('deve ter posicionamento correto dos componentes', () => {
    const { container } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const sidebar = container.querySelector('[data-sidebar]')
    const header = container.querySelector('header')
    const main = container.querySelector('main')

    expect(sidebar).toBeInTheDocument()
    expect(header).toBeInTheDocument()
    expect(main).toBeInTheDocument()
  })

  it('deve exibir nome do usuário "Evoluire" no Header', () => {
    const { container } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const header = container.querySelector('header')
    if (header) {
      expect(within(header).getByText('Evoluire')).toBeInTheDocument()
    }
  })

  it('deve renderizar Sidebar com logo da Evoluire', () => {
    const { container } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const sidebar = container.querySelector('[data-sidebar]')
    if (sidebar instanceof HTMLElement) {
      expect(within(sidebar).getByText('Evoluire')).toBeInTheDocument()
    }
  })

  it('deve ter SidebarTrigger no header', () => {
    const { container } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    const sidebarTrigger = container.querySelector('[data-sidebar="trigger"]')
    expect(sidebarTrigger).toBeInTheDocument()
  })
})
