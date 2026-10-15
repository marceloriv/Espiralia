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
});
