import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FilterModal } from '../FilterModal'
import { ExpenseFilter } from '@/types/expenses'
import { ExpenseStatus } from '@/constants/expenses'
import type { CategoryDTO } from '@/types/categories'
import type { FavorecidoDTO } from '@/types/favorecidos'
import { useCategories } from '@/hooks/use-categories'
import { useFavorecidos } from '@/hooks/use-favorecidos'

vi.mock('@/hooks/use-categories', () => ({ useCategories: vi.fn() }))
vi.mock('@/hooks/use-favorecidos', () => ({ useFavorecidos: vi.fn() }))

const mockUseCategories = vi.mocked(useCategories)
const mockUseFavorecidos = vi.mocked(useFavorecidos)

const CATEGORIES: CategoryDTO[] = [
  {
    id: 'cat-1',
    organizationId: 'org-1',
    name: 'Aluguel',
    description: '',
    createdAt: '',
    updatedAt: '',
  },
]

const FAVORECIDOS: FavorecidoDTO[] = [
  {
    id: 'fav-1',
    organizationId: 'org-1',
    name: 'Imobiliária Silva',
    document: null,
    documentType: null,
    zipCode: null,
    street: null,
    number: null,
    city: null,
    state: null,
    phone: null,
    email: null,
    createdAt: '',
    updatedAt: '',
  },
]

describe('FilterModal', () => {
  const mockOnApply = vi.fn()
  const mockOnClear = vi.fn()
  const mockOnClose = vi.fn()
  const defaultFilters: ExpenseFilter = {}

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCategories.mockReturnValue({
      categories: CATEGORIES,
      isLoading: false,
      error: null,
    })
    mockUseFavorecidos.mockReturnValue({
      favorecidos: FAVORECIDOS,
      isLoading: false,
      error: null,
    })
  })

  function renderModal(filters: ExpenseFilter = defaultFilters, isOpen = true) {
    return render(
      <FilterModal
        filters={filters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={isOpen}
      />
    )
  }

  it('deve renderizar o modal quando isOpen é true', () => {
    renderModal()

    expect(screen.getByText('Filtrar Despesas')).toBeInTheDocument()
  })

  it('não deve renderizar o modal quando isOpen é false', () => {
    renderModal(defaultFilters, false)

    expect(screen.queryByText('Filtrar Despesas')).not.toBeInTheDocument()
  })

  it('deve renderizar os mesmos campos da tela de relatórios', () => {
    renderModal()

    expect(screen.getByTestId('filter-status')).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Favorecido' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Município')).toBeInTheDocument()
    expect(screen.getByTestId('filter-payment-method')).toBeInTheDocument()
    expect(screen.getByTestId('filter-category')).toBeInTheDocument()
    expect(screen.getByTestId('filter-due-date-start')).toBeInTheDocument()
    expect(screen.getByTestId('filter-due-date-end')).toBeInTheDocument()
  })

  it('não deve mais exibir o campo de texto livre de Recebedor', () => {
    renderModal()

    expect(
      screen.queryByPlaceholderText('Buscar por recebedor')
    ).not.toBeInTheDocument()
  })

  it('deve permitir limpar o status pela opção "Todos os status"', async () => {
    const user = userEvent.setup()
    renderModal({ status: ExpenseStatus.PAID })

    await user.click(screen.getByTestId('filter-status'))
    await user.click(screen.getByRole('option', { name: 'Todos os status' }))
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(mockOnApply).toHaveBeenCalledWith({ status: undefined })
  })

  it('deve renderizar o botão Aplicar e chamar onApply com os filtros', async () => {
    const user = userEvent.setup()
    const filtersWithStatus: ExpenseFilter = {
      status: ExpenseStatus.OPEN,
    }

    renderModal(filtersWithStatus)

    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(mockOnApply).toHaveBeenCalledWith(filtersWithStatus)
  })

  it('deve aplicar favorecido, forma de pagamento e categoria selecionados', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('combobox', { name: 'Favorecido' }))
    await user.click(screen.getByText('Imobiliária Silva'))

    await user.click(screen.getByTestId('filter-payment-method'))
    await user.click(screen.getByRole('option', { name: 'PIX' }))

    await user.click(screen.getByTestId('filter-category'))
    await user.click(screen.getByRole('option', { name: 'Aluguel' }))

    expect(mockOnApply).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(mockOnApply).toHaveBeenCalledWith({
      receiver: 'Imobiliária Silva',
      paymentMethod: 'PIX',
      categoryId: 'cat-1',
    })
  })

  it('deve manter as alterações apenas no rascunho até o clique em Aplicar', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByTestId('filter-payment-method'))
    await user.click(screen.getByRole('option', { name: 'Boleto' }))

    expect(screen.getByTestId('filter-payment-method')).toHaveTextContent(
      'Boleto'
    )
    expect(mockOnApply).not.toHaveBeenCalled()
    expect(mockOnClear).not.toHaveBeenCalled()
  })

  it('deve renderizar o botão Limpar e chamar onClear', async () => {
    const user = userEvent.setup()
    const filtersWithData: ExpenseFilter = {
      status: ExpenseStatus.PAID,
      receiver: 'Imobiliária Silva',
      municipality: 'Rio',
      dueDateStart: new Date(2024, 0, 1),
      dueDateEnd: new Date(2024, 11, 31),
    }

    renderModal(filtersWithData)

    await user.click(screen.getByRole('button', { name: 'Limpar' }))

    expect(mockOnClear).toHaveBeenCalled()
  })

  it('deve renderizar o botão Cancelar e chamar onClose', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('deve descartar as alterações do rascunho ao cancelar', async () => {
    const user = userEvent.setup()
    // Mesma referência do objeto em ambas as renderizações: assim o reset vem do
    // handleCancel, e não do efeito que sincroniza quando a prop muda.
    const filters: ExpenseFilter = { status: ExpenseStatus.OPEN }
    const { rerender } = renderModal(filters)

    await user.click(screen.getByTestId('filter-payment-method'))
    await user.click(screen.getByRole('option', { name: 'PIX' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    rerender(
      <FilterModal
        filters={filters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    expect(screen.getByTestId('filter-payment-method')).toHaveTextContent(
      'Todas as formas'
    )
    expect(mockOnApply).not.toHaveBeenCalled()
  })

  it('deve preencher os campos com valores dos filtros ao abrir o modal', () => {
    renderModal({
      status: ExpenseStatus.OVERDUE,
      receiver: 'Imobiliária Silva',
      municipality: 'Belo Horizonte',
      paymentMethod: 'Boleto',
      categoryId: 'cat-1',
      dueDateStart: new Date(2024, 0, 15),
      dueDateEnd: new Date(2024, 5, 30),
    })

    expect(screen.getByTestId('filter-status')).toHaveTextContent('Atrasada')
    expect(
      screen.getByRole('combobox', { name: 'Favorecido' })
    ).toHaveTextContent('Imobiliária Silva')
    expect(screen.getByLabelText('Município')).toHaveValue('Belo Horizonte')
    expect(screen.getByTestId('filter-payment-method')).toHaveTextContent(
      'Boleto'
    )
    expect(screen.getByTestId('filter-category')).toHaveTextContent('Aluguel')
    expect(screen.getByTestId('filter-due-date-start')).toHaveValue(
      '2024-01-15'
    )
    expect(screen.getByTestId('filter-due-date-end')).toHaveValue('2024-06-30')
  })

  it('deve exibir corretamente com filtros vazios', () => {
    renderModal()

    expect(screen.getByTestId('filter-status')).toHaveTextContent(
      'Todos os status'
    )
    expect(
      screen.getByRole('combobox', { name: 'Favorecido' })
    ).toHaveTextContent('Todos os favorecidos')
    expect(screen.getByLabelText('Município')).toHaveValue('')
    expect(screen.getByTestId('filter-due-date-start')).toHaveValue('')
    expect(screen.getByTestId('filter-due-date-end')).toHaveValue('')
  })

  it('deve exibir corretamente com filtros parciais', () => {
    renderModal({ status: ExpenseStatus.PAID, municipality: 'Pedro' })

    expect(screen.getByTestId('filter-status')).toHaveTextContent('Paga')
    expect(screen.getByLabelText('Município')).toHaveValue('Pedro')
    expect(screen.getByTestId('filter-payment-method')).toHaveTextContent(
      'Todas as formas'
    )
  })

  it('deve aceitar entrada de texto no campo Município', async () => {
    const user = userEvent.setup()
    renderModal()

    const municipalityInput = screen.getByLabelText('Município')
    await user.type(municipalityInput, 'São Paulo')

    expect(municipalityInput).toHaveValue('São Paulo')
  })

  it('deve ter classes responsivas para mobile (< 768px)', () => {
    renderModal()

    const dialogContent = screen.getByText('Filtrar Despesas').closest('.fixed')
    expect(dialogContent).toHaveClass('max-w-[95vw]')
    expect(dialogContent).toHaveClass('sm:max-w-[500px]')
  })

  it('deve aceitar datas nos campos de vencimento', async () => {
    const user = userEvent.setup()
    renderModal()

    const dueDateStartInput = screen.getByTestId('filter-due-date-start')
    const dueDateEndInput = screen.getByTestId('filter-due-date-end')

    await user.type(dueDateStartInput, '2024-01-01')
    await user.type(dueDateEndInput, '2024-12-31')

    expect(dueDateStartInput).toHaveValue('2024-01-01')
    expect(dueDateEndInput).toHaveValue('2024-12-31')
  })

  it('deve lidar com props undefined de forma graciosa', () => {
    expect(() => {
      renderModal(undefined as unknown as ExpenseFilter)
    }).not.toThrow()
  })

  it('deve lidar com filtros null de forma graciosa', () => {
    expect(() => {
      renderModal(null as unknown as ExpenseFilter)
    }).not.toThrow()
  })

  it('deve lidar com intervalos de datas inválidos de forma graciosa', () => {
    expect(() => {
      renderModal({
        dueDateStart: new Date(2024, 11, 31),
        dueDateEnd: new Date(2024, 0, 1),
      })
    }).not.toThrow()
  })
})
