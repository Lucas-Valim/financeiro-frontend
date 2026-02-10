import { render, screen, within } from '@testing-library/react'
import { Layout } from '@/components/Layout'
import { Home } from '@/components/pages/Home'

describe('Integration: Layout + Home', () => {
  it('deve renderizar Layout com componente Home', () => {
    render(
      <Layout>
        <Home />
      </Layout>
    )

    expect(screen.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeInTheDocument()
  })

  it('deve renderizar Home como filho do Layout', () => {
    const { container } = render(
      <Layout>
        <Home />
      </Layout>
    )

    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
    if (main) {
      expect(within(main).getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeInTheDocument()
    }
  })

  it('deve exibir conteúdo de Home corretamente', () => {
    render(
      <Layout>
        <Home />
      </Layout>
    )

    expect(screen.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeInTheDocument()
    expect(screen.getByText('Plataforma de treinamento e demonstração para consultoria financeira')).toBeInTheDocument()
    expect(screen.getByText('Como navegar')).toBeInTheDocument()
    expect(screen.getByText('Informações da sessão')).toBeInTheDocument()
  })

  it('deve exibir instruções de navegação do Home', () => {
    const { container } = render(
      <Layout>
        <Home />
      </Layout>
    )

    expect(screen.getByText('Utilize a barra lateral para acessar as diferentes seções do sistema:')).toBeInTheDocument()
    
    const main = container.querySelector('main')
    if (main) {
      const homeItems = within(main).getAllByText('Home')
      expect(homeItems.length).toBeGreaterThan(0)
    }
  })

  it('deve exibir informações de sessão do Home', () => {
    const { container } = render(
      <Layout>
        <Home />
      </Layout>
    )

    const main = container.querySelector('main')
    if (main) {
      expect(within(main).getByText(/Você está conectado como/)).toBeInTheDocument()
    }
    const evoluireTexts = screen.getAllByText('Evoluire')
    expect(evoluireTexts.length).toBeGreaterThan(0)
    if (main) {
      expect(within(main).getByText(/Utilize o botão "Sair" no cabeçalho para encerrar sua sessão/)).toBeInTheDocument()
    }
  })

  it('deve manter estrutura do Layout ao renderizar Home', () => {
    const { container } = render(
      <Layout>
        <Home />
      </Layout>
    )

    expect(container.querySelector('[data-sidebar]')).toBeInTheDocument()
    expect(container.querySelector('header')).toBeInTheDocument()
    expect(container.querySelector('main')).toBeInTheDocument()
    expect(screen.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeInTheDocument()
  })

  it('deve ter Card com CardHeader e CardContent', () => {
    const { container } = render(
      <Layout>
        <Home />
      </Layout>
    )

    const main = container.querySelector('main')
    if (main) {
      const title = within(main).getByText('Bem-vindo ao sistema financeiro Evoluire')
      expect(title).toBeInTheDocument()
      expect(title.closest('[data-slot="card"]')).toBeInTheDocument()
    }
  })

  it('deve ter título "Financeiro" no header junto com Home', () => {
    render(
      <Layout>
        <Home />
      </Layout>
    )

    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeInTheDocument()
  })
})
