import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseFormFields } from '../ExpenseFormFields';
import {
  expenseFormSchema,
  type ExpenseFormData,
  defaultExpenseFormValues,
} from '@/schemas/expense-form-schema';

const DEFAULT_ORGANIZATION_ID = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

const mockCategories = [
  { id: 'cat-1', name: 'Combustível', description: 'Combustível' },
  { id: 'cat-2', name: 'Alimentação', description: 'Alimentação' },
];

const mockFavorecidos = [
  { id: 'fav-1', name: 'Favorecido Um', document: '12345678901', organizationId: DEFAULT_ORGANIZATION_ID, documentType: 'CPF', zipCode: null, street: null, number: null, city: null, state: null, phone: null, email: null, createdAt: '', updatedAt: '' },
  { id: 'fav-2', name: 'Favorecido Dois', document: '98765432100', organizationId: DEFAULT_ORGANIZATION_ID, documentType: 'CPF', zipCode: null, street: null, number: null, city: null, state: null, phone: null, email: null, createdAt: '', updatedAt: '' },
];

vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(() => ({
    categories: mockCategories,
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: vi.fn(() => ({
    favorecidos: mockFavorecidos,
    isLoading: false,
    error: null,
  })),
}));

const createdFavorecido = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  name: 'Favorecido Novo',
  document: '11122233344',
};

vi.mock('@/components/favorecidos/FavorecidoFormModal', () => ({
  FavorecidoFormModal: ({
    isOpen,
    onClose,
    onSuccess,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (created: { id: string; name: string; document: string }) => void;
  }) =>
    isOpen ? (
      <div data-testid="favorecido-form-modal">
        <span>Favorecido Modal</span>
        <button data-testid="close-modal" onClick={onClose}>Fechar</button>
        <button data-testid="submit-modal" onClick={() => onSuccess?.(createdFavorecido)}>
          Salvar favorecido
        </button>
      </div>
    ) : null,
}));

vi.mock('react-datepicker', () => ({
  default: vi.fn(({ selected, onChange, placeholderText, disabled, ...props }) => {
    return (
      <input
        type="date"
        value={selected ? new Date(selected).toISOString().split('T')[0] : ''}
        onChange={(e) => {
          const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
          onChange(date);
        }}
        placeholder={placeholderText}
        disabled={disabled}
        data-testid="date-picker"
        {...props}
      />
    );
  }),
  registerLocale: vi.fn(),
}));

function FormWrapper({
  children,
  defaultValues = defaultExpenseFormValues,
  onSubmit = () => {},
}: {
  children: React.ReactNode;
  defaultValues?: Partial<ExpenseFormData>;
  onSubmit?: (data: ExpenseFormData) => void;
}) {
  const form = useForm<ExpenseFormData>({
    // @ts-expect-error - Zod v4 resolver type inference issue
    resolver: zodResolver(expenseFormSchema),
    defaultValues: defaultValues as ExpenseFormData,
    mode: 'onChange',
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as (data: unknown) => void)}>{children}</form>
    </FormProvider>
  );
}

function FavorecidoIdProbe() {
  const { watch } = useFormContext<ExpenseFormData>();
  return <div data-testid="favorecido-id-value">{watch('favorecidoId')}</div>;
}

describe('ExpenseFormFields', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all required form fields', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data de vencimento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /favorecido/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/município/i)).toBeInTheDocument();
    });

    it('displays Portuguese labels for each field', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByText('Descrição')).toBeInTheDocument();
      expect(screen.getByText('Valor')).toBeInTheDocument();
      expect(screen.getByText('Data de Vencimento')).toBeInTheDocument();
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Favorecido')).toBeInTheDocument();
      expect(screen.getByText('Município')).toBeInTheDocument();
      expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
    });

    it('shows asterisk for required fields', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const requiredLabels = screen.getAllByText('*');
      expect(requiredLabels.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Description Field', () => {
    it('allows typing in description field', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const descriptionInput = screen.getByLabelText(/descrição/i);
      await user.type(descriptionInput, 'Test expense description');

      expect(descriptionInput).toHaveValue('Test expense description');
    });

    it('shows validation error when description exceeds max length', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const descriptionInput = screen.getByLabelText(/descrição/i);
      const longText = 'a'.repeat(256);

      await user.type(descriptionInput, longText);
      await user.tab();

      await waitFor(
        () => {
          const errorMessages = screen.queryAllByText(/255 caract/i);
          expect(errorMessages.length).toBeGreaterThan(0);
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Amount Field (Currency)', () => {
    it('has correct input mode for numeric input', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const amountInput = screen.getByLabelText(/valor/i);
      expect(amountInput).toHaveAttribute('inputmode', 'decimal');
    });

    it('formats amount as currency during input', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const amountInput = screen.getByLabelText(/valor/i);

      await user.type(amountInput, '1234');

      const value = amountInput;
      expect(value).toBeInTheDocument();
      expect((value as HTMLInputElement).value).toMatch(/R\$/);
    });
  });

  describe('Date Field', () => {
    it('renders date picker with placeholder', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });

  describe('Category Field', () => {
    it('renders category dropdown trigger', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const categoryTrigger = screen.getByRole('combobox', { name: /categoria/i });
      expect(categoryTrigger).toBeInTheDocument();
    });
  });

  describe('Favorecido Field', () => {
    it('renders favorecido combobox trigger', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const favorecidoTrigger = screen.getByRole('combobox', { name: /favorecido/i });
      expect(favorecidoTrigger).toBeInTheDocument();
    });

    it('does NOT render RECEIVER_OPTIONS hardcoded list', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.queryByText('Advento Aprendizagem')).not.toBeInTheDocument();
      expect(screen.queryByText('KingHost')).not.toBeInTheDocument();
      expect(screen.queryByText('Unimed')).not.toBeInTheDocument();
    });

    it('loads favorecidos from useFavorecidos hook', async () => {
      const { useFavorecidos } = await import('@/hooks/use-favorecidos');
      const mockedUseFavorecidos = vi.mocked(useFavorecidos);

      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(mockedUseFavorecidos).toHaveBeenCalledWith(DEFAULT_ORGANIZATION_ID);
    });
  });

  describe('Municipality Field', () => {
    it('allows selecting a municipality from the dropdown', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const municipalityTrigger = screen.getByRole('combobox', { name: /município/i });
      await user.click(municipalityTrigger);

      const option = await screen.findByRole('option', { name: 'Porto Alegre' });
      await user.click(option);

      await waitFor(() => {
        expect(municipalityTrigger).toHaveTextContent('Porto Alegre');
      });
    });
  });

  describe('Disabled State', () => {
    it('disables all fields when disabled prop is true', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields disabled={true} organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/descrição/i)).toBeDisabled();
      expect(screen.getByLabelText(/valor/i)).toBeDisabled();
      expect(screen.getByLabelText(/município/i)).toBeDisabled();
      expect(screen.getByTestId('date-picker')).toBeDisabled();
      expect(screen.getByRole('combobox', { name: /categoria/i })).toHaveAttribute('data-disabled');
      expect(screen.getByRole('combobox', { name: /favorecido/i })).toBeDisabled();
    });

    it('enables all fields when disabled prop is false', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields disabled={false} organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/descrição/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/valor/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/município/i)).not.toBeDisabled();
    });
  });

  describe('Edit Mode (Pre-populated Fields)', () => {
    it('pre-populates description field correctly in edit mode', () => {
      const existingExpense: Partial<ExpenseFormData> = {
        description: 'Existing expense',
        amount: 1500.5,
        dueDate: new Date('2024-12-31'),
        favorecidoId: 'fav-1',
        municipality: 'Porto Alegre',
        categoryId: 'cat-1',
      };

      render(
        <FormWrapper defaultValues={existingExpense}>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/descrição/i)).toHaveValue('Existing expense');
      expect(screen.getByRole('combobox', { name: /município/i })).toHaveTextContent('Porto Alegre');
    });

    it('pre-populates amount field with formatted currency', () => {
      const existingExpense: Partial<ExpenseFormData> = {
        description: 'Test',
        amount: 1500.5,
        dueDate: new Date(),
        favorecidoId: 'fav-1',
        municipality: 'Test City',
      };

      render(
        <FormWrapper defaultValues={existingExpense}>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const amountInput = screen.getByLabelText(/valor/i);
      expect((amountInput as HTMLInputElement).value).toMatch(/R\$/);
    });
  });

  describe('FormProvider Integration', () => {
    it('integrates correctly with FormProvider context', () => {
      const FormWithSubmit = () => {
        const form = useForm<ExpenseFormData>({
          // @ts-expect-error - Zod v4 resolver type inference issue
          resolver: zodResolver(expenseFormSchema),
          defaultValues: defaultExpenseFormValues as ExpenseFormData,
          mode: 'onChange',
        });

        return (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(() => {})}>
              <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
              <button type="submit">Submit</button>
            </form>
          </FormProvider>
        );
      };

      render(<FormWithSubmit />);

      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-describedby for error messages', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const descriptionInput = screen.getByLabelText(/descrição/i);
      expect(descriptionInput).toHaveAttribute('aria-describedby');
    });

    it('has proper form structure', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });

  describe('Service Invoice Field Removal', () => {
    it('does NOT render Nota de Serviço text input', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.queryByText('Nota de Serviço')).not.toBeInTheDocument();
    });

    it('does NOT have serviceInvoice placeholder', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.queryByPlaceholderText(/nota de serviço/i)).not.toBeInTheDocument();
    });

    it('renders exactly 7 main form fields (no file fields in Dados tab)', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const textInputs = screen.getAllByRole('textbox');
      const comboboxes = screen.getAllByRole('combobox');
      const datePickers = screen.queryAllByTestId('date-picker');
      const fileInputs = document.querySelectorAll('input[type="file"]');

      // description + amount are textboxes; categoria/favorecido/município/forma de pagamento are comboboxes
      expect(textInputs.length).toBe(2);
      expect(comboboxes.length).toBe(4);
      expect(datePickers.length).toBe(1);
      expect(fileInputs.length).toBe(0);
    });

    it('all 7 remaining text/select fields still work', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /categoria/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /favorecido/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/município/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/forma de pagamento/i)).toBeInTheDocument();
    });

    it('disabled state works for all remaining fields', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields disabled={true} organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/descrição/i)).toBeDisabled();
      expect(screen.getByLabelText(/valor/i)).toBeDisabled();
      expect(screen.getByTestId('date-picker')).toBeDisabled();
      expect(screen.getByRole('combobox', { name: /categoria/i })).toHaveAttribute('data-disabled');
      expect(screen.getByRole('combobox', { name: /favorecido/i })).toBeDisabled();
      expect(screen.getByLabelText(/município/i)).toBeDisabled();
      expect(screen.getByLabelText(/forma de pagamento/i)).toBeDisabled();
    });
  });

  describe('Dynamic Categories', () => {
    it('should call useCategories with organizationId prop', async () => {
      const { useCategories } = await import('@/hooks/use-categories');
      const mockedUseCategories = vi.mocked(useCategories);

      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(mockedUseCategories).toHaveBeenCalledWith(DEFAULT_ORGANIZATION_ID);
    });

    it('should show categories from API in dropdown', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const categoryTrigger = screen.getByRole('combobox', { name: /categoria/i });
      await user.click(categoryTrigger);

      await waitFor(() => {
        const combustivelOptions = screen.getAllByText('Combustível');
        const alimentacaoOptions = screen.getAllByText('Alimentação');
        expect(combustivelOptions.length).toBeGreaterThan(0);
        expect(alimentacaoOptions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Dynamic Favorecidos via Combobox', () => {
    it('should call useFavorecidos with organizationId prop', async () => {
      const { useFavorecidos } = await import('@/hooks/use-favorecidos');
      const mockedUseFavorecidos = vi.mocked(useFavorecidos);

      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(mockedUseFavorecidos).toHaveBeenCalledWith(DEFAULT_ORGANIZATION_ID);
    });

    it('should show favorecidos from API in combobox', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const favorecidoTrigger = screen.getByRole('combobox', { name: /favorecido/i });
      await user.click(favorecidoTrigger);

      await waitFor(() => {
        expect(screen.getByText('Favorecido Um')).toBeInTheDocument();
        expect(screen.getByText('Favorecido Dois')).toBeInTheDocument();
      });
    });

    it('selecting a favorecido sets favorecidoId in the form', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
          <FavorecidoIdProbe />
        </FormWrapper>
      );

      await user.click(screen.getByRole('combobox', { name: /favorecido/i }));
      await user.click(await screen.findByText('Favorecido Um'));

      await waitFor(() => {
        expect(screen.getByTestId('favorecido-id-value')).toHaveTextContent('fav-1');
      });
    });

    it('shows the "Cadastrar novo favorecido" action in the dropdown', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      await user.click(screen.getByRole('combobox', { name: /favorecido/i }));

      expect(screen.getByText('Cadastrar novo favorecido')).toBeInTheDocument();
    });

    it('opens the FavorecidoFormModal and auto-selects the created favorecido', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
          <FavorecidoIdProbe />
        </FormWrapper>
      );

      await user.click(screen.getByRole('combobox', { name: /favorecido/i }));
      await user.click(screen.getByText('Cadastrar novo favorecido'));

      expect(screen.getByTestId('favorecido-form-modal')).toBeInTheDocument();

      await user.click(screen.getByTestId('submit-modal'));

      await waitFor(() => {
        expect(screen.getByTestId('favorecido-id-value')).toHaveTextContent(
          '7c9e6679-7425-40de-944b-e07fc1f90ae7'
        );
      });
      expect(screen.queryByTestId('favorecido-form-modal')).not.toBeInTheDocument();
    });

    it('starts with an empty combobox for legacy expenses without favorecidoId', () => {
      const legacyExpense: Partial<ExpenseFormData> = {
        description: 'Legacy expense',
        amount: 500,
        dueDate: new Date('2024-12-31'),
        municipality: 'Porto Alegre',
        favorecidoId: '',
      };

      render(
        <FormWrapper defaultValues={legacyExpense}>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const favorecidoTrigger = screen.getByRole('combobox', { name: /favorecido/i });
      expect(favorecidoTrigger).toHaveTextContent('Selecione um favorecido');
      expect(favorecidoTrigger).not.toHaveTextContent('Favorecido Um');
    });

    it('shows a validation error when submitting without selecting a favorecido', async () => {
      function FormWithSubmit() {
        const form = useForm<ExpenseFormData>({
          // @ts-expect-error - Zod v4 resolver type inference issue
          resolver: zodResolver(expenseFormSchema),
          defaultValues: defaultExpenseFormValues as ExpenseFormData,
          mode: 'onChange',
        });

        return (
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(() => {})}>
              <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
              <button type="submit">Salvar</button>
            </form>
          </FormProvider>
        );
      }

      render(<FormWithSubmit />);

      await user.click(screen.getByRole('button', { name: /salvar/i }));

      await waitFor(() => {
        expect(screen.getByText('O favorecido é obrigatório')).toBeInTheDocument();
      });
    });
  });
});
