import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { sileo } from 'sileo';
import { ProfileSettingsModal } from '../components/profile/ProfileSettingsModal';
import { StorageService } from '../services/storage';
import { hashPin } from '../services/pinHash';
import type { Profile } from '../types';

describe('ProfileSettingsModal', () => {
  const baseProfile: Profile = {
    id: 'p-settings',
    name: 'Valentina',
    avatar: 'V',
    createdAt: '2026-10-10',
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('no renderiza nada si isOpen es false', () => {
    render(
      <ProfileSettingsModal
        isOpen={false}
        onClose={vi.fn()}
        profile={baseProfile}
        onProfileUpdated={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra estado de acceso libre y permite fijar un PIN de 4 digitos', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const onProfileUpdated = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    StorageService.saveProfile(baseProfile);

    render(
      <ProfileSettingsModal
        isOpen={true}
        onClose={onClose}
        profile={baseProfile}
        onProfileUpdated={onProfileUpdated}
      />
    );

    expect(screen.getByText(/acceso libre/i)).toBeInTheDocument();

    const newPinInput = screen.getByLabelText(/^nuevo pin/i);
    const confirmPinInput = screen.getByLabelText(/confirmar nuevo pin/i);

    await user.type(newPinInput, '1234');
    await user.type(confirmPinInput, '1234');

    const saveBtn = screen.getByRole('button', { name: /fijar pin/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(successSpy).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringMatching(/pin configurado/i) }));
      expect(onProfileUpdated).toHaveBeenCalledWith(expect.objectContaining({ pinHash: expect.any(String) }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('valida que el PIN tenga entre 4 y 6 digitos', async () => {
    const errorSpy = vi.spyOn(sileo, 'error');
    const user = userEvent.setup();

    render(
      <ProfileSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        profile={baseProfile}
        onProfileUpdated={vi.fn()}
      />
    );

    const newPinInput = screen.getByLabelText(/^nuevo pin/i);
    const confirmPinInput = screen.getByLabelText(/confirmar nuevo pin/i);

    await user.type(newPinInput, '12');
    await user.type(confirmPinInput, '12');

    const saveBtn = screen.getByRole('button', { name: /fijar pin/i });
    await user.click(saveBtn);

    expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringMatching(/4 y 6 dígitos/i) }));
  });

  it('permite quitar el PIN verificando el PIN actual', async () => {
    const successSpy = vi.spyOn(sileo, 'success');
    const onProfileUpdated = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    const { pinHash, pinSalt } = await hashPin('4321');
    const protectedProfile: Profile = {
      ...baseProfile,
      pinHash,
      pinSalt,
    };
    StorageService.saveProfile(protectedProfile);

    render(
      <ProfileSettingsModal
        isOpen={true}
        onClose={onClose}
        profile={protectedProfile}
        onProfileUpdated={onProfileUpdated}
      />
    );

    expect(screen.getByText(/protegido con pin/i)).toBeInTheDocument();

    const currentPinInput = screen.getByLabelText(/pin actual para confirmar/i);
    await user.type(currentPinInput, '4321');

    const removeBtn = screen.getByRole('button', { name: /quitar pin/i });
    await user.click(removeBtn);

    await waitFor(() => {
      expect(successSpy).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringMatching(/pin eliminado/i) }));
      expect(onProfileUpdated).toHaveBeenCalledWith(expect.objectContaining({ pinHash: undefined, pinSalt: undefined }));
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('renderiza el modal envuelto en contenedor de papel rasgado con cinta washi tape decorativa', () => {
    render(
      <ProfileSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        profile={baseProfile}
        onProfileUpdated={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const modalWrap = dialog.closest('div[class*="modalWrap"]');
    expect(modalWrap).toBeInTheDocument();

    const washiTape = modalWrap?.querySelector('div[class*="washiTape"]');
    expect(washiTape).toBeInTheDocument();
    expect(washiTape).toHaveAttribute('aria-hidden', 'true');
  });

  it('cierra el modal cuando el usuario hace clic fuera de la hoja de papel rasgado (backdrop)', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    const { container } = render(
      <ProfileSettingsModal
        isOpen={true}
        onClose={onClose}
        profile={baseProfile}
        onProfileUpdated={vi.fn()}
      />
    );

    const backdrop = container.querySelector('div[class*="backdrop"]');
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  describe('eliminar perfil', () => {
    const botonEliminar = () => screen.getByRole('button', { name: /eliminar perfil y sus datos/i });
    const campoNombre = () => screen.getByLabelText(/escribe el nombre del perfil/i);

    it('el botón de eliminar está desactivado hasta escribir el nombre exacto del perfil', async () => {
      const user = userEvent.setup();
      render(
        <ProfileSettingsModal isOpen={true} onClose={vi.fn()} profile={baseProfile} onProfileUpdated={vi.fn()} />
      );

      expect(botonEliminar()).toBeDisabled();

      await user.type(campoNombre(), ' Valentina ');
      expect(botonEliminar()).toBeEnabled();

      await user.clear(campoNombre());
      await user.type(campoNombre(), 'valentina');
      expect(botonEliminar()).toBeDisabled();
    });

    it('elimina un perfil sin PIN y avisa al padre', async () => {
      const successSpy = vi.spyOn(sileo, 'success');
      const onProfileDeleted = vi.fn();
      const onClose = vi.fn();
      const user = userEvent.setup();
      StorageService.saveProfile(baseProfile);

      render(
        <ProfileSettingsModal
          isOpen={true}
          onClose={onClose}
          profile={baseProfile}
          onProfileUpdated={vi.fn()}
          onProfileDeleted={onProfileDeleted}
        />
      );

      await user.type(campoNombre(), 'Valentina');
      await user.click(botonEliminar());

      await waitFor(() => {
        expect(successSpy).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringMatching(/perfil eliminado/i) }));
        expect(onProfileDeleted).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalled();
      });
      expect(StorageService.getProfiles()).toHaveLength(0);
    });

    it('con PIN erróneo muestra el error y conserva el perfil', async () => {
      const errorSpy = vi.spyOn(sileo, 'error');
      const onProfileDeleted = vi.fn();
      const user = userEvent.setup();
      const { pinHash, pinSalt } = await hashPin('4321');
      const protectedProfile: Profile = { ...baseProfile, pinHash, pinSalt };
      StorageService.saveProfile(protectedProfile);

      render(
        <ProfileSettingsModal
          isOpen={true}
          onClose={vi.fn()}
          profile={protectedProfile}
          onProfileUpdated={vi.fn()}
          onProfileDeleted={onProfileDeleted}
        />
      );

      await user.type(campoNombre(), 'Valentina');
      await user.type(screen.getByLabelText(/pin actual para eliminar/i), '0000');
      await user.click(botonEliminar());

      await waitFor(() => {
        expect(errorSpy).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringMatching(/pin actual es incorrecto/i) }));
      });
      expect(StorageService.getProfiles()).toHaveLength(1);
      expect(onProfileDeleted).not.toHaveBeenCalled();
    });

    it('un perfil sin PIN no muestra el campo de PIN en la sección de eliminar', () => {
      render(
        <ProfileSettingsModal isOpen={true} onClose={vi.fn()} profile={baseProfile} onProfileUpdated={vi.fn()} />
      );

      expect(screen.queryByLabelText(/pin actual para eliminar/i)).not.toBeInTheDocument();
    });
  });
});


