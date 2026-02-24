# Expense File Upload Implementation Plan

## Overview

**Goal:** Enable the frontend to create and update expenses with `bankBill` and `serviceInvoice` file uploads sent to the API via `multipart/form-data`.

**Date:** 2026-02-23

---

## Problem Analysis

### Current State

| Component | Status | Issue |
|-----------|--------|-------|
| `ExpenseUploadFields.tsx` | Working | Correctly handles file selection via `form.setValue()` |
| `useExpenseForm.ts` | Incomplete | Does not include `serviceInvoice`/`bankBill` in `submitData` |
| `expenses-api.ts` | Incomplete | Sends data as JSON, not `FormData` |
| `types/expenses.ts` | Incomplete | Missing file fields in input types |

### Backend Expectations

The backend expects files in `multipart/form-data` format with the following structure:

```typescript
// From: financeiro-backend/src/infrastructure/controllers/schemas/expense.schema.ts
fileSchema = {
  data: Buffer,      // File content as buffer
  mimetype: string,  // e.g., 'application/pdf', 'image/png'
  filename: string,  // Original filename
}
```

**Supported file types:** PDF, PNG, JPG, JPEG (max 5MB)

---

## Implementation Details

### 1. Type Definitions

#### File: `src/types/expenses.ts`

**Changes to `CreateExpenseInput` (lines 31-48):**

```typescript
export interface CreateExpenseInput {
  organizationId: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: Date;
  receiver: string;
  municipality: string;
  paymentMethod?: string;
  // NEW: File upload fields
  serviceInvoice?: File | null;
  bankBill?: File | null;
}
```

**Changes to `UpdateExpenseInput` (lines 54-67):**

```typescript
export interface UpdateExpenseInput {
  description?: string;
  amount?: number;
  dueDate?: Date;
  receiver?: string;
  municipality?: string;
  paymentMethod?: string;
  // NEW: File upload fields
  serviceInvoice?: File | null;
  bankBill?: File | null;
}
```

---

### 2. Hook Updates

#### File: `src/hooks/useExpenseForm.ts`

**Changes to `onSubmit` method (lines 81-90):**

```typescript
const submitData: CreateExpenseInput = {
  organizationId: 'fca3c088-ba34-43a2-9b32-b2b1a1246915',
  description: formData.description,
  amount: formData.amount,
  currency: formData.currency,
  dueDate: formData.dueDate,
  receiver: formData.receiver,
  municipality: formData.municipality,
  paymentMethod: formData.paymentMethod ?? undefined,
  // NEW: Include file uploads
  serviceInvoice: formData.serviceInvoice || null,
  bankBill: formData.bankBill || null,
};
```

---

### 3. API Service Updates

#### File: `src/api/expenses-api.ts`

**New private methods:**

```typescript
private hasFiles(data: CreateExpenseInput | UpdateExpenseInput): boolean {
  return (data.serviceInvoice instanceof File) || (data.bankBill instanceof File);
}

private buildFormData(data: CreateExpenseInput | UpdateExpenseInput): FormData {
  const formData = new FormData();
  
  // Text fields
  if (data.description) formData.append('description', data.description);
  if (data.amount !== undefined) formData.append('amount', String(data.amount));
  if (data.currency) formData.append('currency', data.currency);
  if (data.dueDate) formData.append('dueDate', data.dueDate.toISOString());
  if (data.receiver) formData.append('receiver', data.receiver);
  if (data.municipality) formData.append('municipality', data.municipality);
  if (data.paymentMethod) formData.append('paymentMethod', data.paymentMethod);
  if (data.organizationId) formData.append('organizationId', data.organizationId);
  
  // File fields
  if (data.serviceInvoice instanceof File) {
    formData.append('serviceInvoice', data.serviceInvoice);
  }
  if (data.bankBill instanceof File) {
    formData.append('bankBill', data.bankBill);
  }
  
  return formData;
}
```

**Updated `create` method:**

```typescript
async create(data: CreateExpenseInput): Promise<ExpenseDTO> {
  if (this.hasFiles(data)) {
    const formData = this.buildFormData(data);
    return apiClient.post<ExpenseDTO>('/expenses', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as unknown as Promise<ExpenseDTO>;
  }
  return apiClient.post<ExpenseDTO>('/expenses', data) as unknown as Promise<ExpenseDTO>;
}
```

**Updated `update` method:**

```typescript
async update(id: string, data: UpdateExpenseInput): Promise<ExpenseDTO> {
  if (this.hasFiles(data)) {
    const formData = this.buildFormData(data);
    return apiClient.put<ExpenseDTO>(`/expenses/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as unknown as Promise<ExpenseDTO>;
  }
  return apiClient.put<ExpenseDTO>(`/expenses/${id}`, data) as unknown as Promise<ExpenseDTO>;
}
```

---

## Test Plan

### 1. Unit Tests - API Service

#### File: `src/api/__tests__/expenses-api.test.ts`

| Test Case | Description |
|-----------|-------------|
| `create with serviceInvoice file` | Should send FormData when serviceInvoice is a File |
| `create with bankBill file` | Should send FormData when bankBill is a File |
| `create with both files` | Should send FormData with both files |
| `create without files uses JSON` | Should send JSON Content-Type when no files |
| `create with files uses multipart/form-data` | Should set correct Content-Type header |
| `FormData contains serviceInvoice` | Should append serviceInvoice to FormData |
| `FormData contains bankBill` | Should append bankBill to FormData |
| `FormData contains text fields` | Should append all text fields correctly |
| `update with serviceInvoice` | Should send FormData in update request |
| `update with bankBill` | Should send FormData in update request |
| `hasFiles returns true for serviceInvoice` | Should detect File in serviceInvoice |
| `hasFiles returns true for bankBill` | Should detect File in bankBill |
| `hasFiles returns false without files` | Should return false when no files present |

**Test implementation example:**

```typescript
describe('create with files', () => {
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
});
```

---

### 2. Unit Tests - Hook

#### File: `src/hooks/__tests__/useExpenseForm.test.ts`

| Test Case | Description |
|-----------|-------------|
| `submitData includes serviceInvoice file` | Should pass serviceInvoice to API |
| `submitData includes bankBill file` | Should pass bankBill to API |
| `submitData includes both files` | Should pass both files to API |
| `submitData with null serviceInvoice` | Should handle null serviceInvoice |
| `submitData with null bankBill` | Should handle null bankBill |
| `update includes serviceInvoice` | Should include file in update call |
| `update includes bankBill` | Should include file in update call |

**Test implementation example:**

```typescript
describe('file upload submission', () => {
  it('should include serviceInvoice file in submitData', async () => {
    const file = new File(['content'], 'invoice.pdf', { type: 'application/pdf' });
    const formDataWithFile = {
      ...validFormData,
      serviceInvoice: file,
    };

    const { result } = renderHook(() => useExpenseForm());
    result.current.form.reset(formDataWithFile);

    await result.current.onSubmit();

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceInvoice: file,
      })
    );
  });
});
```

---

### 3. Unit Tests - Types

#### File: `src/types/__tests__/expenses.test.ts`

| Test Case | Description |
|-----------|-------------|
| `CreateExpenseInput accepts serviceInvoice File` | Type should allow File |
| `CreateExpenseInput accepts bankBill File` | Type should allow File |
| `CreateExpenseInput accepts null serviceInvoice` | Type should allow null |
| `CreateExpenseInput accepts null bankBill` | Type should allow null |
| `UpdateExpenseInput accepts serviceInvoice File` | Type should allow File |
| `UpdateExpenseInput accepts bankBill File` | Type should allow File |

---

### 4. Integration Tests

#### File: `src/__tests__/integration/expense-file-upload.integration.test.tsx`

| Test Case | Description |
|-----------|-------------|
| `full flow: select files → submit → success` | Complete upload flow |
| `form validation with invalid file type` | Reject unsupported types |
| `form validation with oversized file` | Reject files > 5MB |

---

## E2E Validation with Playwright MCP

### Prerequisites

1. Backend running on `localhost:3000`
2. Frontend running on `localhost:5173`
3. Test files available:
   - `test-files/invoice.pdf` (valid PDF, < 5MB)
   - `test-files/boleto.png` (valid PNG, < 5MB)
   - `test-files/invalid.txt` (invalid type)

### Test Scenarios

#### Scenario 1: Create Expense with Service Invoice (PDF)

```gherkin
Feature: Upload service invoice on expense creation

  Scenario: Create expense with PDF invoice
    Given I am on the expenses page at /despesa
    When I click the "New Expense" button
    And I fill in the required fields:
      | Field        | Value              |
      | Description  | Test Expense       |
      | Amount       | 1500.00            |
      | Due Date     | 2024-12-31         |
      | Receiver     | Test Company       |
      | Municipality | São Paulo          |
    And I upload "invoice.pdf" to the "Service Invoice" field
    And I click "Save"
    Then I should see success message "Despesa criada com sucesso"
    And the expense should appear in the list
```

**Playwright MCP Steps:**

1. Navigate to `http://localhost:5173/despesa`
2. Capture snapshot
3. Click element with text "Nova Despesa"
4. Fill form fields
5. Upload file to input with id "service-invoice-upload"
6. Click submit button
7. Verify toast message "Despesa criada com sucesso"
8. Verify expense in table

---

#### Scenario 2: Create Expense with Bank Bill (PNG)

```gherkin
Feature: Upload bank bill on expense creation

  Scenario: Create expense with PNG bank bill
    Given I am on the expenses page at /despesa
    When I click the "New Expense" button
    And I fill in the required fields
    And I upload "boleto.png" to the "Bank Bill" field
    And I click "Save"
    Then I should see success message "Despesa criada com sucesso"
```

---

#### Scenario 3: Create Expense with Both Files

```gherkin
Feature: Upload both files on expense creation

  Scenario: Create expense with service invoice and bank bill
    Given I am on the expenses page at /despesa
    When I click the "New Expense" button
    And I fill in the required fields
    And I upload "invoice.pdf" to the "Service Invoice" field
    And I upload "boleto.jpg" to the "Bank Bill" field
    And I click "Save"
    Then I should see success message "Despesa criada com sucesso"
```

---

#### Scenario 4: Create Expense Without Files (Optional)

```gherkin
Feature: Create expense without files

  Scenario: Create expense without uploading any files
    Given I am on the expenses page at /despesa
    When I click the "New Expense" button
    And I fill in only the required fields
    And I click "Save"
    Then I should see success message "Despesa criada com sucesso"
```

---

#### Scenario 5: Update Expense with Files

```gherkin
Feature: Upload files on expense update

  Scenario: Update existing expense with files
    Given I am on the expenses page
    And there is an existing expense without files
    When I click edit on the expense
    And I upload "invoice.pdf" to the "Service Invoice" field
    And I upload "boleto.png" to the "Bank Bill" field
    And I click "Save"
    Then I should see success message "Despesa atualizada com sucesso"
```

---

## Execution Checklist

### Phase 1: Implementation

- [ ] Update `src/types/expenses.ts`
  - [ ] Add `serviceInvoice?: File | null` to `CreateExpenseInput`
  - [ ] Add `bankBill?: File | null` to `CreateExpenseInput`
  - [ ] Add `serviceInvoice?: File | null` to `UpdateExpenseInput`
  - [ ] Add `bankBill?: File | null` to `UpdateExpenseInput`

- [ ] Update `src/hooks/useExpenseForm.ts`
  - [ ] Include `serviceInvoice` in `submitData`
  - [ ] Include `bankBill` in `submitData`

- [ ] Update `src/api/expenses-api.ts`
  - [ ] Add `hasFiles()` private method
  - [ ] Add `buildFormData()` private method
  - [ ] Modify `create()` to use FormData when files present
  - [ ] Modify `update()` to use FormData when files present

---

### Phase 2: Unit Tests

- [ ] Update `src/api/__tests__/expenses-api.test.ts`
  - [ ] Test `create` with serviceInvoice file
  - [ ] Test `create` with bankBill file
  - [ ] Test `create` with both files
  - [ ] Test `create` without files (JSON)
  - [ ] Test `create` with multipart/form-data header
  - [ ] Test `update` with files
  - [ ] Test `hasFiles()` method

- [ ] Update `src/hooks/__tests__/useExpenseForm.test.ts`
  - [ ] Test submitData includes serviceInvoice
  - [ ] Test submitData includes bankBill
  - [ ] Test submitData includes both files
  - [ ] Test update includes files

- [ ] Update `src/types/__tests__/expenses.test.ts`
  - [ ] Test types accept File
  - [ ] Test types accept null

---

### Phase 3: Validation Commands

```bash
# Run all tests
npm run test:run

# Run lint
npm run lint

# Run type check
npm run typecheck
```

**Expected Results:**
- All tests passing
- No lint errors
- No type errors

---

### Phase 4: E2E Testing (Playwright MCP)

- [ ] Start backend server
  ```bash
  cd ../financeiro-backend && npm run dev
  ```

- [ ] Start frontend server
  ```bash
  npm run dev
  ```

- [ ] Execute E2E scenarios:
  - [ ] Scenario 1: Create with PDF invoice
  - [ ] Scenario 2: Create with PNG bank bill
  - [ ] Scenario 3: Create with both files
  - [ ] Scenario 4: Create without files
  - [ ] Scenario 5: Update with files

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐                                                   │
│  │ ExpenseUploadFields  │                                                   │
│  │                      │                                                   │
│  │ ┌──────────────────┐ │                                                   │
│  │ │ serviceInvoice   │ │     form.setValue('serviceInvoice', file)        │
│  │ │   FileUpload     │─────────────────────────────┐                       │
│  │ └──────────────────┘ │                           │                       │
│  │                      │                           ▼                       │
│  │ ┌──────────────────┐ │     ┌──────────────────────────────────────┐     │
│  │ │ bankBill         │ │     │          useExpenseForm              │     │
│  │ │   FileUpload     │──────▶│                                      │     │
│  │ └──────────────────┘ │     │  submitData = {                      │     │
│  └──────────────────────┘     │    ...fields,                        │     │
│                               │    serviceInvoice: File,             │     │
│                               │    bankBill: File                    │     │
│                               │  }                                   │     │
│                               └──────────────┬───────────────────────┘     │
│                                              │                              │
│                                              ▼                              │
│                               ┌──────────────────────────────────────┐     │
│                               │        ExpensesApiService            │     │
│                               │                                      │     │
│                               │  if (hasFiles(data)) {               │     │
│                               │    formData = buildFormData(data)    │     │
│                               │    POST /expenses, formData          │     │
│                               │    Content-Type: multipart/form-data │     │
│                               │  } else {                            │     │
│                               │    POST /expenses, JSON              │     │
│                               │  }                                   │     │
│                               └──────────────┬───────────────────────┘     │
│                                              │                              │
└──────────────────────────────────────────────┼──────────────────────────────┘
                                               │
                                               │ HTTP POST /expenses
                                               │ Content-Type: multipart/form-data
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────┐                                   │
│  │        ExpenseController             │                                   │
│  │                                      │                                   │
│  │  extract serviceInvoice from body    │                                   │
│  │  extract bankBill from body          │                                   │
│  │                                      │                                   │
│  │  {                                   │                                   │
│  │    data: Buffer,                     │                                   │
│  │    mimetype: string,                 │                                   │
│  │    filename: string                  │                                   │
│  │  }                                   │                                   │
│  └──────────────┬───────────────────────┘                                   │
│                 │                                                            │
│                 ▼                                                            │
│  ┌──────────────────────────────────────┐                                   │
│  │     CreateExpenseUseCase             │                                   │
│  │                                      │                                   │
│  │  Upload files to storage             │                                   │
│  │  Create expense record               │                                   │
│  │  Return expense with URLs            │                                   │
│  └──────────────────────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
financeiro-frontend/
├── src/
│   ├── api/
│   │   ├── expenses-api.ts          # MODIFIED: Add FormData support
│   │   └── __tests__/
│   │       └── expenses-api.test.ts # MODIFIED: Add file upload tests
│   ├── hooks/
│   │   ├── useExpenseForm.ts        # MODIFIED: Include files in submitData
│   │   └── __tests__/
│   │       └── useExpenseForm.test.ts # MODIFIED: Add file tests
│   ├── types/
│   │   ├── expenses.ts              # MODIFIED: Add file fields
│   │   └── __tests__/
│   │       └── expenses.test.ts     # MODIFIED: Add type tests
│   └── components/
│       └── expenses/
│           └── ExpenseUploadFields.tsx # NO CHANGES (already working)
├── test-files/                       # NEW: Test files for E2E
│   ├── invoice.pdf
│   ├── boleto.png
│   └── invalid.txt
└── docs/
    └── expense-file-upload-implementation-plan.md # THIS FILE
```

---

## Rollback Plan

If issues arise in production:

1. **Revert code changes:**
   ```bash
   git revert <commit-hash>
   ```

2. **Quick fix:** Remove file fields from submitData:
   ```typescript
   // In useExpenseForm.ts, remove these lines:
   serviceInvoice: formData.serviceInvoice || null,
   bankBill: formData.bankBill || null,
   ```

3. **API fallback:** The API already handles missing files gracefully (they're optional).

---

## Success Criteria

- [ ] User can create expense with serviceInvoice file (PDF, PNG, JPG, JPEG)
- [ ] User can create expense with bankBill file (PDF, PNG, JPG, JPEG)
- [ ] User can create expense with both files
- [ ] User can create expense without any files
- [ ] User can update expense and add/remove files
- [ ] All unit tests pass
- [ ] No lint errors
- [ ] No type errors
- [ ] E2E tests validate real browser behavior
- [ ] Backend correctly receives and stores files

---

## References

- Backend schema: `financeiro-backend/src/infrastructure/controllers/schemas/expense.schema.ts`
- Backend controller: `financeiro-backend/src/infrastructure/controllers/expense.controller.ts`
- Existing FormData pattern: `financeiro-frontend/src/api/expenses-api.ts` (pay method)
- File upload component: `financeiro-frontend/src/components/expenses/ExpenseUploadFields.tsx`
