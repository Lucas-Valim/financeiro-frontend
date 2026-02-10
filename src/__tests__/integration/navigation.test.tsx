import { render, screen } from '@testing-library/react'
import { Layout } from '@/components/Layout'
import { Home } from '@/components/pages/Home'
import { Despesa } from '@/components/pages/Despesa'
import { Relatorios } from '@/components/pages/Relatorios'

const renderApp = () => {
  return render(
    <Layout>
      <div>Test Content</div>
    </Layout>
  )
}

describe('Integration: Navegação Completa', () => {
  it('deve renderizar Layout com estrutura completa', () => {
    renderApp()

    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('deve renderizar todas as páginas corretamente', () => {
    render(<Home />)
    expect(screen.getByText('Bem-vindo ao sistema financeiro Evoluire')).toBeInTheDocument()

    render(<Despesa />)
    expect(screen.getByText('Gerenciamento de Despesas')).toBeInTheDocument()

    render(<Relatorios />)
    expect(screen.getByText('Relatórios Financeiros')).toBeInTheDocument()
  })

  it('deve ter todos os itens de navegação disponíveis', () => {
    renderApp()

    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /despesa/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /relatórios/i })).toBeInTheDocument()
  })
})
