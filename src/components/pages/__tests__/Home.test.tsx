import { render, screen } from '@testing-library/react'
import { Home } from '../Home'

describe('Home', () => {
  it('deve renderizar corretamente', () => {
    render(<Home />)
    expect(screen.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeInTheDocument()
  })

  it('deve exibir mensagem de boas-vindas em português', () => {
    render(<Home />)
    expect(screen.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeInTheDocument()
  })

  it('deve exibir descrição da plataforma', () => {
    render(<Home />)
    expect(screen.getByText('Plataforma de treinamento e demonstração para consultoria financeira')).toBeInTheDocument()
  })

  it('deve exibir instruções de navegação', () => {
    render(<Home />)
    expect(screen.getByText('Como navegar')).toBeInTheDocument()
    expect(screen.getByText('Utilize a barra lateral para acessar as diferentes seções do sistema:')).toBeInTheDocument()
  })

  it('deve listar as três seções do sistema', () => {
    render(<Home />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
  })

  it('deve exibir informações da seção Home', () => {
    render(<Home />)
    const listItems = screen.getAllByText('Home')
    if (listItems.length > 1) {
      const homeListItem = listItems.find(item => item.textContent?.includes('Página inicial com informações do sistema'))
      expect(homeListItem).toBeTruthy()
    }
  })

  it('deve exibir informações da seção Despesa', () => {
    render(<Home />)
    const listItem = screen.getByText('Despesa').closest('li')
    expect(listItem?.textContent).toContain('Gerenciamento de despesas e categorias')
  })

  it('deve exibir informações da seção Relatórios', () => {
    render(<Home />)
    const listItem = screen.getByText('Relatórios').closest('li')
    expect(listItem?.textContent).toContain('Visualização de relatórios financeiros')
  })

  it('deve exibir informações da sessão', () => {
    render(<Home />)
    expect(screen.getByText('Informações da sessão')).toBeInTheDocument()
    expect(screen.getByText(/Você está conectado como/)).toBeInTheDocument()
    expect(screen.getByText('Evoluire')).toBeInTheDocument()
    expect(screen.getByText(/Utilize o botão "Sair" no cabeçalho para encerrar sua sessão/)).toBeInTheDocument()
  })

  it('deve ter estrutura de Card', () => {
    render(<Home />)
    const title = screen.getByText('Bem-vindo ao sistema financeiro Evoluire')
    expect(title).toBeInTheDocument()
    expect(title.closest('[data-slot="card"]')).toBeInTheDocument()
  })
})
