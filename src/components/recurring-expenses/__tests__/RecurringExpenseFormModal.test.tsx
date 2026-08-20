import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurringExpenseFormModal } from '../RecurringExpenseFormModal';
import type {
  GeneratedOccurrenceDTO,
  RecurringExpenseDTO,
} from '@/types/recurring-expenses';

const hookState = vi.hoisted(() => ({
  value: {
    form: { control: {}, watch: vi.fn(), formState: { errors: {} } },
    isDirty: false,
    isSubmitting: false,
    onSubmit: vi.fn(),
    resetForm: vi.fn(),
    generatedOccurrences: [] as GeneratedOccurrenceDTO[],
    duplicates: [] as RecurringExpenseDTO[],
    isDuplicateDialogOpen: false,
    confirmDuplicate: vi.fn(),
    cancelDuplicate: vi.fn(),
  },
  lastParams: null as { onSuccess?: (r: RecurringExpenseDTO) => void } | null,
}));

vi.mock('@/hooks/useRecurringExpenseForm', () => ({
  useRecurringExpenseForm: vi.fn((params) => {
    hookState.lastParams = params;
    return hookState.value;
  }),
}));

// ui/dialog é mockado de modo que a estrutura JSX (aninhamento) apareça no DOM,
// para provar que o aviso de duplicidade é IRMÃO — nunca filho — do DialogContent
// do formulário.
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../RecurringExpenseFormFields', () => ({
  RecurringExpenseFormFields: ({ isEditMode, disabled }: any) => (
    <div
      data-testid="recurring-form-fields"
      data-edit={String(isEditMode)}
      data-disabled={String(disabled)}
    />
  ),
}));

vi.mock('../DuplicateWarningDialog', () => ({
  DuplicateWarningDialog: ({ isOpen, onConfirm, onCancel }: any) => (
    <div data-testid="duplicate-warning" data-open={String(isOpen)}>
      <button data-testid="dup-confirm" onClick={onConfirm}>
        confirm
      </button>
      <button data-testid="dup-cancel" onClick={onCancel}>
        cancel
      </button>
    </div>
  ),
}));

const recurrence: RecurringExpenseDTO = {
  id: 'rec-1',
  organizationId: 'org-1',
  description: 'Aluguel',
  favorecidoId: 'fav-1',
  categoryId: null,
  amountType: 'FIXED',
  amount: 1500,
  paymentMethod: null,
  municipality: 'Porto Alegre',
  dueDay: 5,
  startDate: new Date(2026, 0, 1),
  endDate: null,
  status: 'ACTIVE',
  terminationReason: null,
  terminatedAt: null,
  createdAt: new Date(2026, 0, 1),
  updatedAt: new Date(2026, 0, 1),
};

const occurrence: GeneratedOccurrenceDTO = {
  id: 'occ-1',
  recurringExpenseId: 'rec-1',
  description: 'Aluguel',
  amount: 1500,
  dueDate: new Date(2026, 1, 5),
  occurrenceMonth: new Date(2026, 1, 1),
  status: 'OPEN' as GeneratedOccurrenceDTO['status'],
  amountPendingConfirmation: false,
};

function resetHookState() {
  hookState.value = {
    form: { control: {}, watch: vi.fn(), formState: { errors: {} } },
    isDirty: false,
    isSubmitting: false,
    onSubmit: vi.fn(),
    resetForm: vi.fn(),
    generatedOccurrences: [],
    duplicates: [],
    isDuplicateDialogOpen: false,
    confirmDuplicate: vi.fn(),
    cancelDuplicate: vi.fn(),
  };
}

describe('RecurringExpenseFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHookState();
  });

  it('does not render when closed', () => {
    render(<RecurringExpenseFormModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('recurring-form-fields')).not.toBeInTheDocument();
  });

  it('renders the create form with the "Nova recorrência" title', () => {
    render(<RecurringExpenseFormModal isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Nova recorrência')).toBeInTheDocument();
    expect(screen.getByTestId('recurring-form-fields')).toHaveAttribute('data-edit', 'false');
    expect(screen.getByRole('button', { name: 'Criar Recorrência' })).toBeInTheDocument();
  });

  it('renders the edit form (read-only fields flag) when a recurrence is provided', () => {
    render(<RecurringExpenseFormModal isOpen onClose={vi.fn()} recurringExpense={recurrence} />);

    expect(screen.getByText('Editar recorrência')).toBeInTheDocument();
    expect(screen.getByTestId('recurring-form-fields')).toHaveAttribute('data-edit', 'true');
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeInTheDocument();
  });

  it('renders only a "Fechar" button in read-only mode', () => {
    render(
      <RecurringExpenseFormModal
        isOpen
        onClose={vi.fn()}
        recurringExpense={{ ...recurrence, status: 'ENDED' }}
        readOnly
      />,
    );

    expect(screen.getByText('Detalhes da recorrência')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument();
  });

  it('submits the form via the hook onSubmit', async () => {
    const user = userEvent.setup();
    render(<RecurringExpenseFormModal isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Criar Recorrência' }));

    expect(hookState.value.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('renders the duplicate warning as a sibling, outside the form DialogContent', () => {
    render(<RecurringExpenseFormModal isOpen onClose={vi.fn()} />);

    const warning = screen.getByTestId('duplicate-warning');
    expect(warning).toBeInTheDocument();
    // Sibling of the form, never nested inside its DialogContent.
    expect(warning.closest('[data-testid="dialog-content"]')).toBeNull();
  });

  describe('Discard confirmation when dirty', () => {
    beforeEach(() => {
      hookState.value.isDirty = true;
    });

    it('asks for discard confirmation when closing a dirty form', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<RecurringExpenseFormModal isOpen onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));

      expect(screen.getByText('Alterações não salvas')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('returns to the form when "Continuar Editando" is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<RecurringExpenseFormModal isOpen onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      await user.click(screen.getByRole('button', { name: 'Continuar Editando' }));

      expect(screen.queryByText('Alterações não salvas')).not.toBeInTheDocument();
      expect(screen.getByTestId('recurring-form-fields')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });

    it('discards and closes when "Descartar e Sair" is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<RecurringExpenseFormModal isOpen onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      await user.click(screen.getByRole('button', { name: 'Descartar e Sair' }));

      expect(hookState.value.resetForm).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success callback', () => {
    it('closes the modal on a successful edit (no occurrences)', () => {
      const onClose = vi.fn();
      render(
        <RecurringExpenseFormModal isOpen onClose={onClose} recurringExpense={recurrence} />,
      );

      act(() => hookState.lastParams?.onSuccess?.(recurrence));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('stays open on a successful create so the occurrences can be shown', () => {
      const onClose = vi.fn();
      render(<RecurringExpenseFormModal isOpen onClose={onClose} />);

      act(() => hookState.lastParams?.onSuccess?.(recurrence));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Duplicate dialog open', () => {
    beforeEach(() => {
      hookState.value.isDuplicateDialogOpen = true;
      hookState.value.duplicates = [recurrence];
    });

    it('hides the form and marks the duplicate warning open', () => {
      render(<RecurringExpenseFormModal isOpen onClose={vi.fn()} />);

      expect(screen.queryByTestId('recurring-form-fields')).not.toBeInTheDocument();
      expect(screen.getByTestId('duplicate-warning')).toHaveAttribute('data-open', 'true');
    });

    it('wires confirm and cancel to the hook', async () => {
      const user = userEvent.setup();
      render(<RecurringExpenseFormModal isOpen onClose={vi.fn()} />);

      await user.click(screen.getByTestId('dup-confirm'));
      expect(hookState.value.confirmDuplicate).toHaveBeenCalledTimes(1);

      await user.click(screen.getByTestId('dup-cancel'));
      expect(hookState.value.cancelDuplicate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Generated occurrences after save', () => {
    beforeEach(() => {
      hookState.value.generatedOccurrences = [occurrence];
    });

    it('shows the created occurrences with description, due date and amount', () => {
      render(<RecurringExpenseFormModal isOpen onClose={vi.fn()} />);

      expect(screen.getByText('Recorrência criada')).toBeInTheDocument();
      const items = screen.getAllByTestId('generated-occurrence-item');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('Aluguel');
      expect(items[0]).toHaveTextContent('05/02/2026');
      expect(items[0]).toHaveTextContent('R$');
      // The form itself is replaced by the occurrences view.
      expect(screen.queryByTestId('recurring-form-fields')).not.toBeInTheDocument();
    });

    it('closes the modal from the "Concluir" button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<RecurringExpenseFormModal isOpen onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: 'Concluir' }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
