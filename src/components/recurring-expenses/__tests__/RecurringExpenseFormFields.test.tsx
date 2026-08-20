import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RecurringExpenseFormFields } from '../RecurringExpenseFormFields';
import {
  recurringExpenseFormSchema,
  defaultRecurringExpenseFormValues,
  type RecurringExpenseFormData,
} from '@/schemas/recurring-expense-form-schema';

const ORG_ID = 'fca3c088-ba34-43a2-9b32-b2b1a1246915';

vi.mock('@/hooks/use-categories', () => ({
  useCategories: vi.fn(() => ({ categories: [], isLoading: false, error: null })),
}));

vi.mock('@/hooks/use-favorecidos', () => ({
  useFavorecidos: vi.fn(() => ({
    favorecidos: [
      { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Favorecido Um', document: null },
    ],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/components/favorecidos/FavorecidoFormModal', () => ({
  FavorecidoFormModal: () => null,
}));

// react-datepicker vira um `input[type=date]` para permitir digitar datas nos
// testes, no mesmo padrão de `ExpenseFormFields.test.tsx`.
vi.mock('react-datepicker', () => ({
  default: vi.fn(({ selected, onChange, placeholderText, disabled }) => (
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
    />
  )),
  registerLocale: vi.fn(),
}));

function FormWrapper({
  children,
  defaultValues = defaultRecurringExpenseFormValues,
  onSubmit = () => {},
}: {
  children: React.ReactNode;
  defaultValues?: Partial<RecurringExpenseFormData>;
  onSubmit?: (data: RecurringExpenseFormData) => void;
}) {
  const form = useForm<RecurringExpenseFormData>({
    // @ts-expect-error - Zod v4 resolver type inference issue
    resolver: zodResolver(recurringExpenseFormSchema),
    defaultValues: defaultValues as RecurringExpenseFormData,
    mode: 'onChange',
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as (data: unknown) => void)}>
        {children}
        <button type="submit">Salvar</button>
      </form>
    </FormProvider>
  );
}

describe('RecurringExpenseFormFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Amount label reacts to amount type', () => {
    it('shows "Valor da despesa" for FIXED and switches to "Valor de referência" for VARIABLE', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <RecurringExpenseFormFields organizationId={ORG_ID} />
        </FormWrapper>,
      );

      // Default FIXED
      expect(screen.getByText('Valor da despesa')).toBeInTheDocument();
      expect(screen.getByTestId('amount-help')).toHaveTextContent(
        'Valor definitivo de cada ocorrência da série.',
      );
      expect(screen.queryByText('Valor de referência')).not.toBeInTheDocument();

      // Switch to VARIABLE via the "Tipo de valor" select
      await user.click(screen.getByRole('combobox', { name: /tipo de valor/i }));
      await user.click(await screen.findByRole('option', { name: 'Variável' }));

      await waitFor(() => {
        expect(screen.getByText('Valor de referência')).toBeInTheDocument();
      });
      expect(screen.getByTestId('amount-help')).toHaveTextContent(
        'Sugestão da primeira ocorrência',
      );
      expect(screen.queryByText('Valor da despesa')).not.toBeInTheDocument();
    });
  });

  describe('Due day note', () => {
    it('renders the fixed note about months without that day', () => {
      render(
        <FormWrapper>
          <RecurringExpenseFormFields organizationId={ORG_ID} />
        </FormWrapper>,
      );

      expect(screen.getByTestId('due-day-note')).toHaveTextContent(
        'Meses sem esse dia usam o último dia do mês.',
      );
    });
  });

  describe('End date before start date', () => {
    it('shows an inline validation message on submit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <FormWrapper
          defaultValues={{
            ...defaultRecurringExpenseFormValues,
            description: 'Aluguel',
            favorecidoId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            amount: 1500,
            municipality: 'Porto Alegre',
            dueDay: 5,
            startDate: new Date(2026, 5, 15),
            endDate: new Date(2026, 5, 10),
          }}
          onSubmit={onSubmit}
        >
          <RecurringExpenseFormFields organizationId={ORG_ID} />
        </FormWrapper>,
      );

      await user.click(screen.getByRole('button', { name: /salvar/i }));

      await waitFor(() => {
        expect(
          screen.getByText('A data-fim deve ser posterior à data de início'),
        ).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode read-only fields', () => {
    const editDefaults: Partial<RecurringExpenseFormData> = {
      ...defaultRecurringExpenseFormValues,
      description: 'Aluguel',
      favorecidoId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      amountType: 'VARIABLE',
      amount: 1500,
      municipality: 'Porto Alegre',
      dueDay: 5,
      startDate: new Date(2026, 5, 15),
    };

    it('renders amountType and startDate read-only with the series-scope note', () => {
      render(
        <FormWrapper defaultValues={editDefaults}>
          <RecurringExpenseFormFields organizationId={ORG_ID} isEditMode />
        </FormWrapper>,
      );

      // amountType read-only shows the label, not an editable select
      expect(screen.getByTestId('amount-type-readonly')).toHaveTextContent('Variável');
      expect(
        screen.queryByRole('combobox', { name: /tipo de valor/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('Vale para a série inteira e não pode ser alterado.'),
      ).toBeInTheDocument();

      // startDate read-only shows the formatted date, not a datepicker
      expect(screen.getByTestId('start-date-readonly')).toHaveTextContent('15/06/2026');
      expect(
        screen.getByText('Vale para a série inteira e não pode ser alterada.'),
      ).toBeInTheDocument();

      // Only the endDate datepicker remains (startDate is read-only)
      expect(screen.getAllByTestId('date-picker')).toHaveLength(1);
    });
  });
});
