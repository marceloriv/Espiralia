import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileGateView } from '../components/ProfileGateView';
import { StorageService } from '../services/storage';

describe('ProfileGateView', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('permite crear un nuevo perfil sin PIN y seleccionarlo', async () => {
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();

    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    expect(screen.getByText(/selecciona tu perfil/i)).toBeInTheDocument();

    const openCreateBtn = screen.getByRole('button', { name: /nuevo perfil/i });
    await user.click(openCreateBtn);

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Valentina');

    const submitBtn = screen.getByRole('button', { name: /crear perfil/i });
    await user.click(submitBtn);

    expect(onSelectProfile).toHaveBeenCalledTimes(1);
    expect(onSelectProfile.mock.calls[0][0].name).toBe('Valentina');
  });

  it('solicita PIN si el perfil tiene PIN y rechaza PIN incorrecto', async () => {
    const user = userEvent.setup();
    const onSelectProfile = vi.fn();

    StorageService.saveProfile({
      id: 'p-pin',
      name: 'Carlos',
      avatar: 'C',
      pin: '4321',
      createdAt: '2026-10-09',
    });

    render(<ProfileGateView onSelectProfile={onSelectProfile} />);

    const profileCard = screen.getByText('Carlos');
    await user.click(profileCard);

    expect(screen.getByText(/ingresa tu pin/i)).toBeInTheDocument();

    const pinInput = screen.getByLabelText(/pin de acceso/i);
    await user.type(pinInput, '0000');

    const verifyBtn = screen.getByRole('button', { name: /desbloquear/i });
    await user.click(verifyBtn);

    expect(screen.getByText(/pin incorrecto/i)).toBeInTheDocument();
    expect(onSelectProfile).not.toHaveBeenCalled();

    await user.clear(pinInput);
    await user.type(pinInput, '4321');
    await user.click(verifyBtn);

    expect(onSelectProfile).toHaveBeenCalledTimes(1);
    expect(onSelectProfile.mock.calls[0][0].id).toBe('p-pin');
  });
});
