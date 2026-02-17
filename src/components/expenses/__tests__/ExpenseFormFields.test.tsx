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

// Mock react-datepicker
vi.mock('react-datepicker', () => ({
  default: vi.fn(({ selected, onChange, placeholderText, disabled, ...props }) => {
    // Render a simple input for testing
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

// Wrapper component to provide form context
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
      <form onSubmit={form.handleSubmit(onSubmit)}>{children}</form>
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
          <ExpenseFormFields />
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
          <ExpenseFormFields />
        </FormWrapper>
      );

      expect(screen.getByText('Descrição')).toBeInTheDocument();
      expect(screen.getByText('Valor')).toBeInTheDocument();
      expect(screen.getByText('Data de Vencimento')).toBeInTheDocument();
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Favorecido')).toBeInTheDocument();
      expect(screen.getByText('Município')).toBeInTheDocument();
      expect(screen.getByText('Forma de Pagamento')).toBeInTheDocument();
      expect(screen.getByText('Nota de Serviço')).toBeInTheDocument();
    });

    it('shows asterisk for required fields', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields />
        </FormWrapper>
      );

      // Check that required fields have asterisks
      const requiredLabels = screen.getAllByText('*');
      expect(requiredLabels.length).toBeGreaterThanOrEqual(5); // Description, Value, Date, Receiver, Municipality
    });
  });

  describe('Description Field', () => {
    it('allows typing in description field', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields />
        </FormWrapper>
      );

      const descriptionInput = screen.getByLabelText(/descrição/i);
      await user.type(descriptionInput, 'Test expense description');

      expect(descriptionInput).toHaveValue('Test expense description');
    });

    it('shows validation error when description exceeds max length', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields />
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
          <ExpenseFormFields />
        </FormWrapper>
      );

      const amountInput = screen.getByLabelText(/valor/i);
      expect(amountInput).toHaveAttribute('inputmode', 'decimal');
    });

    it('formats amount as currency during input', async () => {
      render(
        <FormWrapper>
          <ExpenseFormFields />
        </FormWrapper>
      );

      const amountInput = screen.getByLabelText(/valor/i);

      await user.type(amountInput, '1234');

      // The value should be formatted as BRL currency
      const value = amountInput;
      expect(value).toBeInTheDocument();
      // Check that the value contains numbers and currency formatting
      expect((value as HTMLInputElement).value).toMatch(/R\$/);
    });
  });

  describe('Date Field', () => {
    it('renders date picker with placeholder', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields />
        </FormWrapper>
      );

      // The mocked date picker renders as an input
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });

  describe('Category Field', () => {
    it('renders category dropdown trigger', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields />
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
          <ExpenseFormFields />
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
          <ExpenseFormFields />
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
          <ExpenseFormFields disabled={true} />
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
          <ExpenseFormFields disabled={false} />
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
        categoryId: 'software',
      };

      render(
        <FormWrapper defaultValues={existingExpense}>
          <ExpenseFormFields />
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
          <ExpenseFormFields />
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
              <ExpenseFormFields />
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
          <ExpenseFormFields />
        </FormWrapper>
      );

      const descriptionInput = screen.getByLabelText(/descrição/i);
      expect(descriptionInput).toHaveAttribute('aria-describedby');
    });

    it('has proper form structure', () => {
      render(
        <FormWrapper>
          <ExpenseFormFields />
        </FormWrapper>
      );

      // Check form elements are properly associated
      expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
      // Form element exists but may not have explicit role, check inputs are present
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });
});
