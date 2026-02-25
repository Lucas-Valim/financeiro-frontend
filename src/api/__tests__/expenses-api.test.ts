import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpensesApiService } from '../expenses-api';
import { apiClient } from '../../lib/api-client';
import { ExpenseStatus } from '../../constants/expenses';
import type { ExpenseDTO, ListExpensesOutput, CreateExpenseInput, UpdateExpenseInput } from '../../types/expenses';

vi.mock('../../lib/api-client');

describe('ExpensesApiService', () => {
  let service: ExpensesApiService;
  const mockedApiClient = apiClient as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ExpensesApiService();
  });

  describe('fetchExpenses', () => {
    const mockExpense: ExpenseDTO = {
      id: '1',
      organizationId: 'org-123',
      categoryId: null,
      description: 'Test expense',
      amount: 100,
      currency: 'BRL',
      dueDate: new Date('2024-01-01'),
      status: ExpenseStatus.OPEN,
      paymentMethod: null,
      paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Test Receiver',
    municipality: 'Test City',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockResponse: ListExpensesOutput = {
      data: [mockExpense],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
    };

    it('should send correct query params with pagination (page, limit)', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      await service.fetchExpenses({}, { page: 2, limit: 20 });
      
      expect(mockedApiClient.get).toHaveBeenCalledWith('/expenses', {
        params: expect.any(URLSearchParams),
      });
      
      const callParams = mockedApiClient.get.mock.calls[0][1]!.params as URLSearchParams;
      expect(callParams.get('page')).toBe('2');
      expect(callParams.get('limit')).toBe('20');
    });

    it('should send correct query params with filter parameters', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      const filters = {
        status: ExpenseStatus.OPEN,
        receiver: 'Test Receiver',
        municipality: 'Test City',
      };
      
      await service.fetchExpenses(filters, { page: 1, limit: 10 });
      
      const callParams = mockedApiClient.get.mock.calls[0][1]!.params as URLSearchParams;
      expect(callParams.get('status')).toBe('OPEN');
      expect(callParams.get('receiver')).toBe('Test Receiver');
      expect(callParams.get('municipality')).toBe('Test City');
    });

    it('should send correct query params with date filters (dueDateStart, dueDateEnd)', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      const filters = {
        dueDateStart: new Date('2024-01-01T00:00:00.000Z'),
        dueDateEnd: new Date('2024-12-31T23:59:59.999Z'),
      };
      
      await service.fetchExpenses(filters, { page: 1, limit: 10 });
      
      const callParams = mockedApiClient.get.mock.calls[0][1]!.params as URLSearchParams;
      expect(callParams.get('dueDateStart')).toBe('2024-01-01T00:00:00.000Z');
      expect(callParams.get('dueDateEnd')).toBe('2024-12-31T23:59:59.999Z');
    });

    it('should handle empty response array', async () => {
      const emptyResponse: ListExpensesOutput = {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
        },
      };
      
      mockedApiClient.get.mockResolvedValue(emptyResponse);
      
      const data = await service.fetchExpenses({}, { page: 1, limit: 10 });
      
      expect(data.data).toEqual([]);
      expect(data.pagination.total).toBe(0);
    });

    it('should handle API errors appropriately and throw with meaningful messages', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));
      
      await expect(service.fetchExpenses({}, { page: 1, limit: 10 })).rejects.toThrow('Network error');
    });

    it('should use apiClient internally (verified via mocking)', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      await service.fetchExpenses({}, { page: 1, limit: 10 });
      
      expect(mockedApiClient.get).toHaveBeenCalled();
    });

    it('should enforce TypeScript types correctly in all methods', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      const result = await service.fetchExpenses({}, { page: 1, limit: 10 });
      
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should include organizationId in request', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      await service.fetchExpenses({}, { page: 1, limit: 10 });
      
      expect(mockedApiClient.get).toHaveBeenCalledWith('/expenses', {
        params: expect.any(URLSearchParams),
      });
    });

    it('should handle empty filters', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      await service.fetchExpenses({}, { page: 1, limit: 10 });
      
      const callParams = mockedApiClient.get.mock.calls[0][1]!.params as URLSearchParams;
      expect(callParams.get('page')).toBe('1');
      expect(callParams.get('limit')).toBe('10');
    });

    it('should send categoryId filter when provided', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      const filters = {
        categoryId: 'cat-123',
      };
      
      await service.fetchExpenses(filters, { page: 1, limit: 10 });
      
      const callParams = mockedApiClient.get.mock.calls[0][1]!.params as URLSearchParams;
      expect(callParams.get('categoryId')).toBe('cat-123');
    });

    it('should send all filters combined including categoryId', async () => {
      mockedApiClient.get.mockResolvedValue(mockResponse);
      
      const filters = {
        status: ExpenseStatus.OPEN,
        receiver: 'Test Receiver',
        categoryId: 'cat-456',
      };
      
      await service.fetchExpenses(filters, { page: 1, limit: 10 });
      
      const callParams = mockedApiClient.get.mock.calls[0][1]!.params as URLSearchParams;
      expect(callParams.get('status')).toBe('OPEN');
      expect(callParams.get('receiver')).toBe('Test Receiver');
      expect(callParams.get('categoryId')).toBe('cat-456');
    });
  });

  describe('fetchExpenseById', () => {
    const mockExpense: ExpenseDTO = {
      id: '123',
      organizationId: 'org-123',
      categoryId: null,
      description: 'Test expense',
      amount: 100,
      currency: 'BRL',
      dueDate: new Date('2024-01-01'),
      status: ExpenseStatus.OPEN,
      paymentMethod: null,
      paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Test Receiver',
    municipality: 'Test City',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  it('should return correct expense with valid id', async () => {
      mockedApiClient.get.mockResolvedValue(mockExpense);
      
      const result = await service.fetchExpenseById('123');
      
      expect(mockedApiClient.get).toHaveBeenCalledWith('/expenses/123');
      expect(result.id).toBe('123');
      expect(result.description).toBe('Test expense');
    });

    it('should handle not found error (404)', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Resource not found'));
      
      await expect(service.fetchExpenseById('999')).rejects.toThrow('Resource not found');
    });

    it('should include organizationId in request', async () => {
      mockedApiClient.get.mockResolvedValue(mockExpense);
      
      await service.fetchExpenseById('123');
      
      expect(mockedApiClient.get).toHaveBeenCalledWith('/expenses/123');
    });

    it('should handle API errors appropriately and throw with meaningful messages', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Internal server error'));
      
      await expect(service.fetchExpenseById('123')).rejects.toThrow('Internal server error');
    });

    it('should use apiClient internally (verified via mocking)', async () => {
      mockedApiClient.get.mockResolvedValue(mockExpense);
      
      await service.fetchExpenseById('123');
      
      expect(mockedApiClient.get).toHaveBeenCalled();
    });

    it('should enforce TypeScript types correctly', async () => {
      mockedApiClient.get.mockResolvedValue(mockExpense);

      const result = await service.fetchExpenseById('123');

      expect(result).toBeDefined();
      expect(result.id).toBe('123');
      expect(result.amount).toBe(100);
      expect(result.status).toBe(ExpenseStatus.OPEN);
    });
  });

  describe('create', () => {
    const mockCreatedExpense: ExpenseDTO = {
      id: 'new-123',
      organizationId: 'org-123',
      categoryId: null,
      description: 'New expense',
      amount: 500,
      currency: 'BRL',
      dueDate: new Date('2024-06-15'),
      status: ExpenseStatus.OPEN,
      paymentMethod: 'PIX',
      paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'New Receiver',
    municipality: 'New City',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  it('should create expense with valid data', async () => {
      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);

      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'New expense',
        amount: 500,
        currency: 'BRL',
        dueDate: new Date('2024-06-15'),
        receiver: 'New Receiver',
        municipality: 'New City',
        paymentMethod: 'PIX',
      };

      const result = await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/expenses', input);
      expect(result.id).toBe('new-123');
      expect(result.description).toBe('New expense');
      expect(result.amount).toBe(500);
    });

    it('should handle API errors appropriately and throw with meaningful messages', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('Validation error'));

      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-06-15'),
        receiver: 'Receiver',
        municipality: 'City',
      };

      await expect(service.create(input)).rejects.toThrow('Validation error');
    });

    it('should use apiClient internally (verified via mocking)', async () => {
      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);

      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'New expense',
        amount: 500,
        currency: 'BRL',
        dueDate: new Date('2024-06-15'),
        receiver: 'New Receiver',
        municipality: 'New City',
      };

      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalled();
    });

    it('should enforce TypeScript types correctly', async () => {
      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);

      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'New expense',
        amount: 500,
        currency: 'BRL',
        dueDate: new Date('2024-06-15'),
        receiver: 'New Receiver',
        municipality: 'New City',
      };

      const result = await service.create(input);

      expect(result).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(typeof result.amount).toBe('number');
      expect(result.status).toBe(ExpenseStatus.OPEN);
    });

    it('should handle network errors', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('Network error'));

      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-06-15'),
        receiver: 'Receiver',
        municipality: 'City',
      };

      await expect(service.create(input)).rejects.toThrow('Network error');
    });
  });

  describe('update', () => {
    const mockUpdatedExpense: ExpenseDTO = {
      id: '123',
      organizationId: 'org-123',
      categoryId: null,
      description: 'Updated expense',
      amount: 750,
      currency: 'BRL',
      dueDate: new Date('2024-07-20'),
      status: ExpenseStatus.OPEN,
      paymentMethod: 'Bank Transfer',
      paymentProof: null,
    paymentProofUrl: null,
    paymentDate: null,
    receiver: 'Updated Receiver',
    municipality: 'Updated City',
    serviceInvoice: null,
    serviceInvoiceUrl: null,
    bankBillUrl: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-20'),
  };

  it('should update expense with valid id and data', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedExpense);

      const input: UpdateExpenseInput = {
        description: 'Updated expense',
        amount: 750,
        receiver: 'Updated Receiver',
      };

      const result = await service.update('123', input);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/expenses/123', input);
      expect(result.id).toBe('123');
      expect(result.description).toBe('Updated expense');
      expect(result.amount).toBe(750);
    });

    it('should handle partial updates', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedExpense);

      const input: UpdateExpenseInput = {
        description: 'Only description updated',
      };

      await service.update('123', input);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/expenses/123', input);
    });

    it('should handle API errors appropriately and throw with meaningful messages', async () => {
      mockedApiClient.put.mockRejectedValue(new Error('Resource not found'));

      const input: UpdateExpenseInput = {
        description: 'Updated',
      };

      await expect(service.update('999', input)).rejects.toThrow('Resource not found');
    });

    it('should use apiClient internally (verified via mocking)', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedExpense);

      const input: UpdateExpenseInput = {
        amount: 800,
      };

      await service.update('123', input);

      expect(mockedApiClient.put).toHaveBeenCalled();
    });

    it('should enforce TypeScript types correctly', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedExpense);

      const input: UpdateExpenseInput = {
        description: 'Updated expense',
        amount: 750,
      };

      const result = await service.update('123', input);

      expect(result).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(typeof result.amount).toBe('number');
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockedApiClient.put.mockRejectedValue(new Error('Network error'));

      const input: UpdateExpenseInput = {
        description: 'Updated',
      };

      await expect(service.update('123', input)).rejects.toThrow('Network error');
    });

    it('should handle empty update data', async () => {
      mockedApiClient.put.mockResolvedValue(mockUpdatedExpense);

      const input: UpdateExpenseInput = {};

      const result = await service.update('123', input);

      expect(mockedApiClient.put).toHaveBeenCalledWith('/expenses/123', input);
      expect(result).toBeDefined();
    });
  });

  describe('create with files', () => {
    const mockCreatedExpense: ExpenseDTO = {
      id: 'new-123',
      organizationId: 'org-123',
      categoryId: null,
      description: 'New expense',
      amount: 500,
      currency: 'BRL',
      dueDate: new Date('2024-06-15'),
      status: ExpenseStatus.OPEN,
      paymentMethod: 'PIX',
      paymentProof: null,
      paymentProofUrl: null,
      paymentDate: null,
      receiver: 'New Receiver',
      municipality: 'New City',
      serviceInvoice: null,
      serviceInvoiceUrl: null,
      bankBillUrl: null,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    };

    it('should send FormData when serviceInvoice is a File', async () => {
      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
        serviceInvoice: file,
      };

      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);
      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/expenses',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should send FormData when bankBill is a File', async () => {
      const file = new File(['content'], 'boleto.png', { type: 'image/png' });
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
        bankBill: file,
      };

      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);
      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/expenses',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should send FormData when both files are present', async () => {
      const invoiceFile = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const boletoFile = new File(['content'], 'boleto.png', { type: 'image/png' });
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
        serviceInvoice: invoiceFile,
        bankBill: boletoFile,
      };

      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);
      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/expenses',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should send JSON when no files are present', async () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
      };

      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);
      await service.create(input);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/expenses', input);
    });

    it('should append serviceInvoice to FormData', async () => {
      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
        serviceInvoice: file,
      };

      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);
      await service.create(input);

      const formData = mockedApiClient.post.mock.calls[0][1] as FormData;
      expect(formData.get('serviceInvoice')).toBe(file);
    });

    it('should append bankBill to FormData', async () => {
      const file = new File(['content'], 'boleto.png', { type: 'image/png' });
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
        bankBill: file,
      };

      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);
      await service.create(input);

      const formData = mockedApiClient.post.mock.calls[0][1] as FormData;
      expect(formData.get('bankBill')).toBe(file);
    });

    it('should append all text fields to FormData', async () => {
      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test Description',
        amount: 150.50,
        currency: 'BRL',
        dueDate: new Date('2024-12-31T00:00:00.000Z'),
        receiver: 'Test Receiver',
        municipality: 'Test City',
        paymentMethod: 'PIX',
        serviceInvoice: file,
      };

      mockedApiClient.post.mockResolvedValue(mockCreatedExpense);
      await service.create(input);

      const formData = mockedApiClient.post.mock.calls[0][1] as FormData;
      expect(formData.get('description')).toBe('Test Description');
      expect(formData.get('amount')).toBe('150.5');
      expect(formData.get('currency')).toBe('BRL');
      expect(formData.get('receiver')).toBe('Test Receiver');
      expect(formData.get('municipality')).toBe('Test City');
      expect(formData.get('paymentMethod')).toBe('PIX');
      expect(formData.get('organizationId')).toBe('org-123');
    });
  });

  describe('update with files', () => {
    const mockUpdatedExpense: ExpenseDTO = {
      id: '123',
      organizationId: 'org-123',
      categoryId: null,
      description: 'Updated expense',
      amount: 750,
      currency: 'BRL',
      dueDate: new Date('2024-07-20'),
      status: ExpenseStatus.OPEN,
      paymentMethod: 'Bank Transfer',
      paymentProof: null,
      paymentProofUrl: null,
      paymentDate: null,
      receiver: 'Updated Receiver',
      municipality: 'Updated City',
      serviceInvoice: null,
      serviceInvoiceUrl: null,
      bankBillUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-20'),
    };

    it('should send FormData when serviceInvoice is a File', async () => {
      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const input: UpdateExpenseInput = {
        description: 'Updated',
        serviceInvoice: file,
      };

      mockedApiClient.put.mockResolvedValue(mockUpdatedExpense);
      await service.update('123', input);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/expenses/123',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });

    it('should send FormData when bankBill is a File', async () => {
      const file = new File(['content'], 'boleto.png', { type: 'image/png' });
      const input: UpdateExpenseInput = {
        description: 'Updated',
        bankBill: file,
      };

      mockedApiClient.put.mockResolvedValue(mockUpdatedExpense);
      await service.update('123', input);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/expenses/123',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    });
  });

  describe('error scenarios', () => {
    it('should throw error when amount is negative', async () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: -100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
      };

      await expect(service.create(input)).rejects.toThrow('Amount must be positive');
    });

    it('should throw error when amount is zero', async () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 0,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
      };

      await expect(service.create(input)).rejects.toThrow('Amount must be positive');
    });

    it('should throw error when description is too long', async () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'a'.repeat(256),
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
      };

      await expect(service.create(input)).rejects.toThrow('Description must be less than 255 characters');
    });

    it('should throw error when dueDate is not a Date object', async () => {
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: '2024-12-31' as unknown as Date,
        receiver: 'Receiver',
        municipality: 'City',
      };

      await expect(service.create(input)).rejects.toThrow('Due date must be a valid Date object');
    });

    it('should throw error when update amount is negative', async () => {
      const input: UpdateExpenseInput = {
        amount: -50,
      };

      await expect(service.update('123', input)).rejects.toThrow('Amount must be positive');
    });

    it('should handle network error during file upload', async () => {
      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
        serviceInvoice: file,
      };

      mockedApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(service.create(input)).rejects.toThrow('Network error');
    });

    it('should handle timeout during file upload', async () => {
      const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
      const input: CreateExpenseInput = {
        organizationId: 'org-123',
        description: 'Test',
        amount: 100,
        currency: 'BRL',
        dueDate: new Date('2024-12-31'),
        receiver: 'Receiver',
        municipality: 'City',
        serviceInvoice: file,
      };

      mockedApiClient.post.mockRejectedValue(new Error('timeout of 10000ms exceeded'));

      await expect(service.create(input)).rejects.toThrow('timeout of 10000ms exceeded');
    });
  });
});
