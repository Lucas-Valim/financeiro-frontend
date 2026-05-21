import { describe, it, expect } from 'vitest';
import {
  categoryFormSchema,
  defaultCategoryFormValues,
  type CategoryFormData,
} from '../category-form-schema';

describe('categoryFormSchema', () => {
  describe('valid inputs', () => {
    it('should pass with name and empty description', () => {
      const result = categoryFormSchema.safeParse({ name: 'Alimentação', description: '' });
      expect(result.success).toBe(true);
    });

    it('should pass when description key is omitted (defaults to empty string)', () => {
      const result = categoryFormSchema.safeParse({ name: 'Transporte' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe('');
      }
    });

    it('should pass with name at max length (100 characters)', () => {
      const result = categoryFormSchema.safeParse({ name: 'a'.repeat(100) });
      expect(result.success).toBe(true);
    });

    it('should pass with description at max length (1000 characters)', () => {
      const result = categoryFormSchema.safeParse({ name: 'Saúde', description: 'a'.repeat(1000) });
      expect(result.success).toBe(true);
    });
  });

  describe('name validation', () => {
    it('should fail when name is empty', () => {
      const result = categoryFormSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O nome é obrigatório');
      }
    });

    it('should fail when name exceeds 100 characters', () => {
      const result = categoryFormSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O nome deve ter no máximo 100 caracteres');
      }
    });

    it('should fail when name contains only whitespace', () => {
      const result = categoryFormSchema.safeParse({ name: '   ' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('O nome é obrigatório');
      }
    });

    it('should trim leading and trailing whitespace from name', () => {
      const result = categoryFormSchema.safeParse({ name: '  Alimentação  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Alimentação');
      }
    });
  });

  describe('description validation', () => {
    it('should fail when description exceeds 1000 characters', () => {
      const result = categoryFormSchema.safeParse({ name: 'Saúde', description: 'a'.repeat(1001) });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('A descrição deve ter no máximo 1000 caracteres');
      }
    });
  });
});

describe('defaultCategoryFormValues', () => {
  it('should have empty string defaults for all fields', () => {
    expect(defaultCategoryFormValues.name).toBe('');
    expect(defaultCategoryFormValues.description).toBe('');
  });

  it('should be assignable to CategoryFormData type', () => {
    const values: CategoryFormData = defaultCategoryFormValues;
    expect(typeof values.name).toBe('string');
    expect(typeof values.description).toBe('string');
  });
});

describe('CategoryFormData type', () => {
  it('should correctly type name and description as strings', () => {
    const data: CategoryFormData = { name: 'Moradia', description: 'Aluguel e contas' };
    expect(data.name).toBe('Moradia');
    expect(data.description).toBe('Aluguel e contas');
  });
});
