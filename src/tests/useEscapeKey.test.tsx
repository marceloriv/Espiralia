import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEscapeKey } from '../utils/useEscapeKey';

describe('useEscapeKey', () => {
  it('llama onClose al pulsar Escape', async () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(onClose));

    await userEvent.setup().keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('no llama onClose con active=false', async () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(onClose, false));

    await userEvent.setup().keyboard('{Escape}');

    expect(onClose).not.toHaveBeenCalled();
  });

  it('no llama onClose con otras teclas', async () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeKey(onClose));

    await userEvent.setup().keyboard('{Enter}a');

    expect(onClose).not.toHaveBeenCalled();
  });
});
