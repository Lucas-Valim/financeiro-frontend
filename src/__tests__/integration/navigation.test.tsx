import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { Home } from '@/components/pages/Home'
import { Despesa } from '@/components/pages/Despesa'
import { Relatorios } from '@/components/pages/Relatorios'

const mockUseExpenses = vi.fn()

vi.mock('@/hooks/use-expenses', () => ({
  useExpenses: (...args: unknown[]) => mockUseExpenses(...args),
}))

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>()
  return {
    ...actual,
  }
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const renderApp = () => {
  return render(
    <Layout>
      <div>Test Content</div>
    </Layout>
  )
}

describe('Integration: Navegação Completa', () => {
  beforeEach(() => {
    mockUseExpenses.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      reset: vi.fn(),
    })
  })

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

    render(<Despesa />, { wrapper })
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
