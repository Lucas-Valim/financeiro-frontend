import { render, screen } from '@testing-library/react'
import { Layout } from '../Layout'

describe('Layout', () => {
  it('deve renderizar corretamente com children', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('deve renderizar Sidebar com itens de navegação', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Despesa')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
  })

  it('deve renderizar Header com título e botão de logout', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )
    expect(screen.getByText('Financeiro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })
})
