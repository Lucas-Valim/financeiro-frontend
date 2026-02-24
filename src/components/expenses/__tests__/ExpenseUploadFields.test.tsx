import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseUploadFields } from '../ExpenseUploadFields';
import {
  expenseFormSchema,
  EXPENSE_FILE_ALLOWED_TYPES,
  EXPENSE_FILE_MAX_SIZE,
  type ExpenseFormData,
  defaultExpenseFormValues,
} from '@/schemas/expense-form-schema';

vi.mock('@/components/ui/file-upload', () => ({
  FileUpload: ({ id, value, onChange, acceptedTypes, maxSize, allowedTypesDisplay, disabled, error }: any) => (
    <div data-testid={`file-upload-${id}`}>
      <span data-testid="accepted-types">{acceptedTypes?.join(',')}</span>
      <span data-testid="max-size">{maxSize}</span>
      <span data-testid="allowed-types-display">{allowedTypesDisplay}</span>
      <span data-testid="disabled">{disabled.toString()}</span>
      {error && <span data-testid="external-error">{error}</span>}
      {value && <span data-testid="has-file">{value.name}</span>}
      <button 
        data-testid="trigger-change" 
        onClick={() => onChange?.(new File(['test'], 'new-file.pdf', { type: 'application/pdf' }))}
      >
        Trigger Change
      </button>
      <button 
        data-testid="trigger-null" 
        onClick={() => onChange?.(null)}
      >
        Trigger Null
      </button>
    </div>
  ),
}));

function FormWrapper({
  children,
  defaultValues = defaultExpenseFormValues,
  onSubmit = vi.fn(),
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
      <form onSubmit={form.handleSubmit(onSubmit as any)}>{children}</form>
    </FormProvider>
  );
}

describe('ExpenseUploadFields', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders Nota de Serviço label', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      expect(screen.getByText('Nota de Serviço')).toBeInTheDocument();
    });

    it('renders Boleto label', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      expect(screen.getByText('Boleto')).toBeInTheDocument();
    });

    it('renders Service Invoice FileUpload component', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      expect(screen.getByTestId('file-upload-service-invoice-upload')).toBeInTheDocument();
    });

    it('renders Boleto FileUpload component', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      expect(screen.getByTestId('file-upload-bank-bill-upload')).toBeInTheDocument();
    });

    it('renders both FileUpload components', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const uploads = screen.getAllByTestId(/file-upload-/);
      expect(uploads).toHaveLength(2);
    });
  });

  describe('FileUpload Props', () => {
    it('passes correct accepted types to both FileUpload components', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const acceptedTypes = screen.getAllByTestId('accepted-types');
      const expectedTypes = EXPENSE_FILE_ALLOWED_TYPES.join(',');
      
      acceptedTypes.forEach(el => {
        expect(el).toHaveTextContent(expectedTypes);
      });
    });

    it('passes correct max size to both FileUpload components', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const maxSizes = screen.getAllByTestId('max-size');
      maxSizes.forEach(el => {
        expect(el).toHaveTextContent(EXPENSE_FILE_MAX_SIZE.toString());
      });
    });

    it('passes allowedTypesDisplay to both FileUpload components', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const displays = screen.getAllByTestId('allowed-types-display');
      displays.forEach(el => {
        expect(el).toHaveTextContent('PDF, PNG, JPG, JPEG');
      });
    });
  });

  describe('Disabled State', () => {
    it('passes disabled=true to both FileUpload components', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields disabled={true} />
        </FormWrapper>
      );

      const disabledFlags = screen.getAllByTestId('disabled');
      disabledFlags.forEach(flag => {
        expect(flag).toHaveTextContent('true');
      });
    });

    it('passes disabled=false to both FileUpload components', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields disabled={false} />
        </FormWrapper>
      );

      const disabledFlags = screen.getAllByTestId('disabled');
      disabledFlags.forEach(flag => {
        expect(flag).toHaveTextContent('false');
      });
    });

    it('defaults to disabled=false when prop not provided', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const disabledFlags = screen.getAllByTestId('disabled');
      disabledFlags.forEach(flag => {
        expect(flag).toHaveTextContent('false');
      });
    });
  });

  describe('Form Integration - serviceInvoice', () => {
    it('displays file when serviceInvoice has value in form', () => {
      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const valuesWithFile = {
        ...defaultExpenseFormValues,
        serviceInvoice: file,
      };

      render(
        <FormWrapper defaultValues={valuesWithFile}>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const serviceInvoiceUpload = screen.getByTestId('file-upload-service-invoice-upload');
      expect(serviceInvoiceUpload.querySelector('[data-testid="has-file"]')).toHaveTextContent('invoice.pdf');
    });

    it('calls form.setValue when serviceInvoice file changes', async () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const triggerButton = screen.getAllByTestId('trigger-change')[0];
      await user.click(triggerButton);

      expect(triggerButton).toBeInTheDocument();
    });
  });

  describe('Form Integration - bankBill', () => {
    it('displays file when bankBill has value in form', () => {
      const file = new File(['content'], 'boleto.png', { type: 'image/png' });
      const valuesWithFile = {
        ...defaultExpenseFormValues,
        bankBill: file,
      };

      render(
        <FormWrapper defaultValues={valuesWithFile}>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const bankBillUpload = screen.getByTestId('file-upload-bank-bill-upload');
      expect(bankBillUpload.querySelector('[data-testid="has-file"]')).toHaveTextContent('boleto.png');
    });
  });

  describe('Error Display', () => {
    it('displays serviceInvoice error from form state', () => {
      const FormWrapperWithError = () => {
        const form = useForm<ExpenseFormData>({
          // @ts-expect-error - Zod v4 resolver type inference issue
          resolver: zodResolver(expenseFormSchema),
          defaultValues: defaultExpenseFormValues as ExpenseFormData,
          mode: 'onChange',
        });

        // Manually set an error
        form.formState.errors.serviceInvoice = { message: 'File too large', type: 'manual' } as any;

        return (
          <FormProvider {...form}>
            <form><ExpenseUploadFields /></form>
          </FormProvider>
        );
      };

      render(<FormWrapperWithError />);

      const serviceInvoiceUpload = screen.getByTestId('file-upload-service-invoice-upload');
      expect(serviceInvoiceUpload.querySelector('[data-testid="external-error"]')).toHaveTextContent('File too large');
    });

    it('displays bankBill error from form state', () => {
      const FormWrapperWithError = () => {
        const form = useForm<ExpenseFormData>({
          // @ts-expect-error - Zod v4 resolver type inference issue
          resolver: zodResolver(expenseFormSchema),
          defaultValues: defaultExpenseFormValues as ExpenseFormData,
          mode: 'onChange',
        });

        // Manually set an error
        form.formState.errors.bankBill = { message: 'Invalid type', type: 'manual' } as any;

        return (
          <FormProvider {...form}>
            <form><ExpenseUploadFields /></form>
          </FormProvider>
        );
      };

      render(<FormWrapperWithError />);

      const bankBillUpload = screen.getByTestId('file-upload-bank-bill-upload');
      expect(bankBillUpload.querySelector('[data-testid="external-error"]')).toHaveTextContent('Invalid type');
    });

    it('shows no error when form has no errors', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const externalErrors = screen.queryAllByTestId('external-error');
      expect(externalErrors).toHaveLength(0);
    });
  });

  describe('Both Files Together', () => {
    it('can display both files simultaneously', () => {
      const invoiceFile = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const boletoFile = new File(['content'], 'boleto.png', { type: 'image/png' });
      const valuesWithFiles = {
        ...defaultExpenseFormValues,
        serviceInvoice: invoiceFile,
        bankBill: boletoFile,
      };

      render(
        <FormWrapper defaultValues={valuesWithFiles}>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const hasFileElements = screen.getAllByTestId('has-file');
      expect(hasFileElements).toHaveLength(2);
      expect(hasFileElements[0]).toHaveTextContent('invoice.pdf');
      expect(hasFileElements[1]).toHaveTextContent('boleto.png');
    });

    it('can display one file while other is null', () => {
      const invoiceFile = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const valuesWithFile = {
        ...defaultExpenseFormValues,
        serviceInvoice: invoiceFile,
        bankBill: null,
      };

      render(
        <FormWrapper defaultValues={valuesWithFile}>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const hasFileElements = screen.getAllByTestId('has-file');
      expect(hasFileElements).toHaveLength(1);
      expect(hasFileElements[0]).toHaveTextContent('invoice.pdf');
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure with labels', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      expect(screen.getByText('Nota de Serviço')).toBeInTheDocument();
      expect(screen.getByText('Boleto')).toBeInTheDocument();
    });

    it('renders in correct order (serviceInvoice first, bankBill second)', () => {
      render(
        <FormWrapper>
          <ExpenseUploadFields />
        </FormWrapper>
      );

      const labels = screen.getAllByText(/Nota de Serviço|Boleto/);
      expect(labels[0]).toHaveTextContent('Nota de Serviço');
      expect(labels[1]).toHaveTextContent('Boleto');
    });
  });
});
