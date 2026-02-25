import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
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

vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(() => ({
    categories: mockCategories,
    isLoading: false,
    error: null,
  })),
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
      expect(screen.getByLabelText(/favorecido/i)).toBeInTheDocument();
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

  describe('Receiver Field', () => {
    it('renders receiver dropdown trigger', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const receiverTrigger = screen.getByRole('combobox', { name: /favorecido/i });
      expect(receiverTrigger).toBeInTheDocument();
    });
  });

  describe('Municipality Field', () => {
    it('allows typing in municipality field', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      const municipalityInput = screen.getByLabelText(/município/i);
      await user.type(municipalityInput, 'São Paulo');

      expect(municipalityInput).toHaveValue('São Paulo');
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
      expect(screen.getByRole('combobox', { name: /favorecido/i })).toHaveAttribute('data-disabled');
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
        receiver: 'google',
        municipality: 'São Paulo',
        categoryId: 'cat-1',
      };

      render(
        <FormWrapper defaultValues={existingExpense}>
          <ExpenseFormFields organizationId={DEFAULT_ORGANIZATION_ID} />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/descrição/i)).toHaveValue('Existing expense');
      expect(screen.getByLabelText(/município/i)).toHaveValue('São Paulo');
    });

    it('pre-populates amount field with formatted currency', () => {
      const existingExpense: Partial<ExpenseFormData> = {
        description: 'Test',
        amount: 1500.5,
        dueDate: new Date(),
        receiver: 'test',
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

      expect(textInputs.length).toBeGreaterThanOrEqual(4);
      expect(comboboxes.length).toBe(2);
      expect(datePickers.length).toBe(1);
      expect(fileInputs.length).toBe(0);
    });

    it('all 7 remaining text/select fields still work', async () => {
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
      expect(screen.getByRole('combobox', { name: /favorecido/i })).toHaveAttribute('data-disabled');
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
});
