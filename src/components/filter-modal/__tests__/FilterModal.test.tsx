import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { FilterModal } from '../FilterModal'
import { ExpenseFilter } from '@/types/expenses'
import { ExpenseStatus } from '@/constants/expenses'

describe('FilterModal', () => {
  const mockOnApply = vi.fn()
  const mockOnClear = vi.fn()
  const mockOnClose = vi.fn()
  const defaultFilters: ExpenseFilter = {}

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o modal quando isOpen é true', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    expect(screen.getByText('Filtrar Despesas')).toBeInTheDocument()
  })

  it('não deve renderizar o modal quando isOpen é false', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={false}
      />
    )

    expect(screen.queryByText('Filtrar Despesas')).not.toBeInTheDocument()
  })

  it('deve renderizar o dropdown de Status com 4 opções', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const statusTrigger = screen.getByText('Selecione o status')
    expect(statusTrigger).toBeInTheDocument()
  })

  it('deve renderizar o campo Recebedor como Input de texto', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const receiverInput = screen.getByPlaceholderText('Buscar por recebedor')
    expect(receiverInput).toBeInTheDocument()
    expect(receiverInput).toHaveAttribute('type', 'text')
  })

  it('deve renderizar o campo Município como Input de texto', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const municipalityInput = screen.getByPlaceholderText('Buscar por município')
    expect(municipalityInput).toBeInTheDocument()
    expect(municipalityInput).toHaveAttribute('type', 'text')
  })

  it('deve renderizar 2 campos de data (Data Inicial e Data Final)', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    expect(screen.getByLabelText('Data Inicial')).toBeInTheDocument()
    expect(screen.getByLabelText('Data Final')).toBeInTheDocument()
  })

  it('deve aceitar entrada de texto no campo Recebedor', async () => {
    const user = userEvent.setup()
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const receiverInput = screen.getByPlaceholderText('Buscar por recebedor')
    await user.type(receiverInput, 'João Silva')

    expect(receiverInput).toHaveValue('João Silva')
  })

  it('deve aceitar entrada de texto no campo Município', async () => {
    const user = userEvent.setup()
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const municipalityInput = screen.getByPlaceholderText('Buscar por município')
    await user.type(municipalityInput, 'São Paulo')

    expect(municipalityInput).toHaveValue('São Paulo')
  })

  it('deve renderizar o botão Aplicar e chamar onApply com os filtros', async () => {
    const user = userEvent.setup()
    const filtersWithStatus: ExpenseFilter = {
      status: ExpenseStatus.OPEN,
    }

    render(
      <FilterModal
        filters={filtersWithStatus}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const applyButton = screen.getByRole('button', { name: 'Aplicar' })
    await user.click(applyButton)

    expect(mockOnApply).toHaveBeenCalledWith(filtersWithStatus)
  })

  it('deve renderizar o botão Limpar e chamar onClear', async () => {
    const user = userEvent.setup()
    const filtersWithData: ExpenseFilter = {
      status: ExpenseStatus.PAID,
      receiver: 'Teste',
      municipality: 'Rio',
      dueDateStart: new Date('2024-01-01'),
      dueDateEnd: new Date('2024-12-31'),
    }

    render(
      <FilterModal
        filters={filtersWithData}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const clearButton = screen.getByRole('button', { name: 'Limpar' })
    await user.click(clearButton)

    expect(mockOnClear).toHaveBeenCalled()
  })

  it('deve renderizar o botão Cancelar e chamar onClose', async () => {
    const user = userEvent.setup()
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('deve preencher os campos com valores dos filtros ao abrir o modal', () => {
    const filtersWithValues: ExpenseFilter = {
      status: ExpenseStatus.OVERDUE,
      receiver: 'Maria Santos',
      municipality: 'Belo Horizonte',
      dueDateStart: new Date('2024-01-15'),
      dueDateEnd: new Date('2024-06-30'),
    }

    render(
      <FilterModal
        filters={filtersWithValues}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const receiverInput = screen.getByPlaceholderText('Buscar por recebedor')
    const municipalityInput = screen.getByPlaceholderText('Buscar por município')

    expect(receiverInput).toHaveValue('Maria Santos')
    expect(municipalityInput).toHaveValue('Belo Horizonte')
  })

  it('deve exibir corretamente com filtros vazios', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const receiverInput = screen.getByPlaceholderText('Buscar por recebedor')
    const municipalityInput = screen.getByPlaceholderText('Buscar por município')
    const dueDateStartInput = screen.getByLabelText('Data Inicial')
    const dueDateEndInput = screen.getByLabelText('Data Final')

    expect(receiverInput).toHaveValue('')
    expect(municipalityInput).toHaveValue('')
    expect(dueDateStartInput).toHaveValue('')
    expect(dueDateEndInput).toHaveValue('')
  })

  it('deve exibir corretamente com filtros parciais', () => {
    const partialFilters: ExpenseFilter = {
      status: ExpenseStatus.PAID,
      receiver: 'Pedro',
    }

    render(
      <FilterModal
        filters={partialFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const receiverInput = screen.getByPlaceholderText('Buscar por recebedor')
    const municipalityInput = screen.getByPlaceholderText('Buscar por município')

    expect(receiverInput).toHaveValue('Pedro')
    expect(municipalityInput).toHaveValue('')
  })

  it('deve ter classes responsivas para mobile (< 768px)', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const dialogContent = screen.getByText('Filtrar Despesas').closest('.fixed')
    expect(dialogContent).toHaveClass('max-w-[95vw]')
    expect(dialogContent).toHaveClass('sm:max-w-[500px]')
  })

  it('deve ter classes responsivas para tablet e desktop', () => {
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const dialogContent = screen.getByText('Filtrar Despesas').closest('.fixed')
    expect(dialogContent).toHaveClass('sm:max-w-[500px]')
  })

  it('deve aceitar datas nos campos de data', async () => {
    const user = userEvent.setup()
    render(
      <FilterModal
        filters={defaultFilters}
        onApply={mockOnApply}
        onClear={mockOnClear}
        onClose={mockOnClose}
        isOpen={true}
      />
    )

    const dueDateStartInput = screen.getByLabelText('Data Inicial')
    const dueDateEndInput = screen.getByLabelText('Data Final')

    await user.type(dueDateStartInput, '2024-01-01')
    await user.type(dueDateEndInput, '2024-12-31')

    expect(dueDateStartInput).toHaveValue('2024-01-01')
    expect(dueDateEndInput).toHaveValue('2024-12-31')
  })

  it('deve lidar com props undefined de forma graciosa', () => {
    expect(() => {
      render(
        <FilterModal
          filters={undefined as unknown as ExpenseFilter}
          onApply={mockOnApply}
          onClear={mockOnClear}
          onClose={mockOnClose}
          isOpen={true}
        />
      )
    }).not.toThrow()
  })

  it('deve lidar com filtros null de forma graciosa', () => {
    expect(() => {
      render(
        <FilterModal
          filters={null as unknown as ExpenseFilter}
          onApply={mockOnApply}
          onClear={mockOnClear}
          onClose={mockOnClose}
          isOpen={true}
        />
      )
    }).not.toThrow()
  })

  it('deve lidar com intervalos de datas inválidos de forma graciosa', () => {
    const invalidFilters: ExpenseFilter = {
      dueDateStart: new Date('2024-12-31'),
      dueDateEnd: new Date('2024-01-01'),
    }

    expect(() => {
      render(
        <FilterModal
          filters={invalidFilters}
          onApply={mockOnApply}
          onClear={mockOnClear}
          onClose={mockOnClose}
          isOpen={true}
        />
      )
    }).not.toThrow()
  })
})
