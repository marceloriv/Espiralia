import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderModal } from '../components/folders/FolderModal';

describe('Modal form lifecycle sin setState en useEffect', () => {
  it('inicializa limpio al abrir y permite guardar', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <FolderModal
        isOpen={true}
        onClose={() => {}}
        onSave={handleSave}
      />
    );

    const input = screen.getByRole('textbox', { name: /nombre de la carpeta/i });
    await user.type(input, 'Carpeta Nueva');

    const submitBtn = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Carpeta Nueva' }));
  });
});
