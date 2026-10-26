import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VaultModal } from '../components/vault/VaultModal';
import { StorageService } from '../services/storage';
import type { Profile } from '../types';

describe('VaultModal', () => {
  const mockProfile: Profile = {
    id: 'p-modal-test',
    name: 'Francisca',
    avatar: 'F',
    createdAt: '2026-10-15',
  };

  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile(mockProfile);
  });

  it('renderiza diálogo accesible con pestañas Exportar e Importar', () => {
    render(<VaultModal isOpen={true} onClose={vi.fn()} profile={mockProfile} />);

    expect(screen.getByRole('dialog', { name: /bóveda offline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar respaldo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restaurar \/ importar/i })).toBeInTheDocument();
  });

  it('permite alternar el checkbox de cifrado con contraseña', async () => {
    const user = userEvent.setup();
    render(<VaultModal isOpen={true} onClose={vi.fn()} profile={mockProfile} />);

    const encryptCheckbox = screen.getByLabelText(/cifrar archivo con contraseña/i);
    expect(encryptCheckbox).not.toBeChecked();

    await user.click(encryptCheckbox);
    expect(encryptCheckbox).toBeChecked();

    expect(screen.getByLabelText(/contraseña de cifrado/i)).toBeInTheDocument();
  });

  it('renderiza el modal envuelto en contenedor de papel rasgado con washi tape decorativa', () => {
    render(<VaultModal isOpen={true} onClose={vi.fn()} profile={mockProfile} />);

    const dialog = screen.getByRole('dialog', { name: /bóveda offline/i });
    expect(dialog).toBeInTheDocument();

    const modalWrap = dialog.closest('div[class*="modalWrap"]');
    expect(modalWrap).toBeInTheDocument();

    const washiTape = modalWrap?.querySelector('div[class*="washiTape"]');
    expect(washiTape).toBeInTheDocument();
    expect(washiTape).toHaveAttribute('aria-hidden', 'true');
  });

  it('cierra el modal cuando el usuario hace clic fuera de la hoja de papel rasgado (overlay)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <VaultModal isOpen={true} onClose={onClose} profile={mockProfile} />
    );

    const overlay = container.querySelector('div[class*="modalOverlay"]');
    expect(overlay).toBeInTheDocument();
    if (overlay) {
      await user.click(overlay);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });
});
