import { describe, it, expect } from 'vitest';
import {
  favorecidoFormSchema,
  defaultFavorecidoFormValues,
  type FavorecidoFormData,
} from '../favorecido-form-schema';

describe('favorecidoFormSchema', () => {
  describe('valid inputs', () => {
    it('should pass with full valid input (name, document, address, contact)', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '12345678901',
        zipCode: '01001000',
        street: 'Rua Teste',
        number: '123',
        city: 'São Paulo',
        state: 'SP',
        phone: '11999999999',
        email: 'joao@test.com',
      });
      expect(result.success).toBe(true);
    });

    it('should pass with minimal valid input (name and document only)', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '12345678901',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('João Silva');
        expect(result.data.document).toBe('12345678901');
        expect(result.data.zipCode).toBe('');
        expect(result.data.street).toBe('');
        expect(result.data.phone).toBe('');
      }
    });

    it('should pass with CNPJ document (14 digits)', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'Empresa LTDA',
        document: '12345678000190',
      });
      expect(result.success).toBe(true);
    });

    it('should strip non-digit characters from document', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '123.456.789-01',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.document).toBe('12345678901');
      }
    });

    it('should trim leading and trailing whitespace from name', () => {
      const result = favorecidoFormSchema.safeParse({
        name: '  João Silva  ',
        document: '12345678901',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('João Silva');
      }
    });

    it('should pass with name at max length (100 characters)', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'a'.repeat(100),
        document: '12345678901',
      });
      expect(result.success).toBe(true);
    });

    it('should default optional fields to empty strings when omitted', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'Test',
        document: '12345678901',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.zipCode).toBe('');
        expect(result.data.street).toBe('');
        expect(result.data.number).toBe('');
        expect(result.data.city).toBe('');
        expect(result.data.state).toBe('');
        expect(result.data.phone).toBe('');
        expect(result.data.email).toBe('');
      }
    });
  });

  describe('name validation', () => {
    it('should fail when name is empty', () => {
      const result = favorecidoFormSchema.safeParse({
        name: '',
        document: '12345678901',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameIssue = result.error.issues.find((i) =>
          i.path.includes('name')
        );
        expect(nameIssue?.message).toBe('O nome é obrigatório');
      }
    });

    it('should fail when name exceeds 100 characters', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'a'.repeat(101),
        document: '12345678901',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameIssue = result.error.issues.find((i) =>
          i.path.includes('name')
        );
        expect(nameIssue?.message).toBe('O nome deve ter no máximo 100 caracteres');
      }
    });

    it('should fail when name contains only whitespace', () => {
      const result = favorecidoFormSchema.safeParse({
        name: '   ',
        document: '12345678901',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameIssue = result.error.issues.find((i) =>
          i.path.includes('name')
        );
        expect(nameIssue?.message).toBe('O nome é obrigatório');
      }
    });
  });

  describe('document validation', () => {
    it('should pass when document key is omitted entirely', () => {
      const result = favorecidoFormSchema.safeParse({ name: 'João Silva' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.document).toBe('');
      }
    });

    it('should pass when document is empty (optional)', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.document).toBe('');
      }
    });

    it('should pass when document is only mask characters (normalized to empty)', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '.-/',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.document).toBe('');
      }
    });

    it('should fail when document has wrong length (not 11 or 14 digits)', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '12345678',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const docIssue = result.error.issues.find((i) =>
          i.path.includes('document')
        );
        expect(docIssue?.message).toContain('11');
      }
    });

    it('should fail when document has 10 digits', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '1234567890',
      });
      expect(result.success).toBe(false);
    });

    it('should fail when document has 15 digits', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '123456789012345',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('state validation', () => {
    it('should fail when state exceeds 2 characters', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '12345678901',
        state: 'SPO',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const stateIssue = result.error.issues.find((i) =>
          i.path.includes('state')
        );
        expect(stateIssue?.message).toBe('O estado deve ter 2 caracteres');
      }
    });

    it('should pass with valid 2-character state', () => {
      const result = favorecidoFormSchema.safeParse({
        name: 'João Silva',
        document: '12345678901',
        state: 'SP',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('defaultFavorecidoFormValues', () => {
  it('should have empty string defaults for all fields', () => {
    expect(defaultFavorecidoFormValues.name).toBe('');
    expect(defaultFavorecidoFormValues.document).toBe('');
    expect(defaultFavorecidoFormValues.zipCode).toBe('');
    expect(defaultFavorecidoFormValues.street).toBe('');
    expect(defaultFavorecidoFormValues.number).toBe('');
    expect(defaultFavorecidoFormValues.city).toBe('');
    expect(defaultFavorecidoFormValues.state).toBe('');
    expect(defaultFavorecidoFormValues.phone).toBe('');
    expect(defaultFavorecidoFormValues.email).toBe('');
  });

  it('should be assignable to FavorecidoFormData type', () => {
    const values: FavorecidoFormData = defaultFavorecidoFormValues;
    expect(typeof values.name).toBe('string');
    expect(typeof values.document).toBe('string');
  });
});
