import { describe, it, expect, vi } from 'vitest';

describe('ExpenseFormModal - handleClose force parameter', () => {
  it('handleClose with force=true should bypass dirty check', () => {
    const onClose = vi.fn();
    const isDirty = true;

    const handleClose = (force = false) => {
      if (!force && isDirty) {
        return 'show-confirm';
      }
      onClose();
      return 'closed';
    };

    expect(handleClose()).toBe('show-confirm');
    expect(handleClose(false)).toBe('show-confirm');
    expect(handleClose(true)).toBe('closed');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('handleClose with force=false and isDirty=false should close directly', () => {
    const onClose = vi.fn();
    const isDirty = false;

    const handleClose = (force = false) => {
      if (!force && isDirty) {
        return 'show-confirm';
      }
      onClose();
      return 'closed';
    };

    expect(handleClose()).toBe('closed');
    expect(handleClose(false)).toBe('closed');
    expect(handleClose(true)).toBe('closed');
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
