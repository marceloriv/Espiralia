import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesView } from '../components/NotesView';
import { StorageService } from '../services/storage';

describe('NotesView', () => {
  const profileId = 'p-notes-view';

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza la vista y permite crear una nueva reflexión terapéutica', async () => {
    const user = userEvent.setup();
    render(<NotesView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 2, name: /notas & reflexiones/i })).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /\+ nueva nota/i });
    await user.click(addBtn);

    const titleInput = screen.getByLabelText(/título/i);
    await user.type(titleInput, 'Reflexión Semanal');

    const contentInput = screen.getByLabelText(/contenido/i);
    await user.type(contentInput, 'Hoy logré identificar patrones de ansiedad y aplicar técnicas de respiración.');

    const isReflectionCheckbox = screen.getByLabelText(/marcar como reflexión de diario/i);
    await user.click(isReflectionCheckbox);

    const saveBtn = screen.getByRole('button', { name: /guardar nota/i });
    await user.click(saveBtn);

    expect(screen.getByText('Reflexión Semanal')).toBeInTheDocument();
    expect(screen.getByText(/patrones de ansiedad/i)).toBeInTheDocument();
  });

  it('permite alternar entre pestañas y filtrar notas', async () => {
    const user = userEvent.setup();
    StorageService.saveNote({
      id: 'n-1',
      profileId,
      title: 'Nota rápida de compras',
      content: 'Comprar lápices y libreta',
      isReflection: false,
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    });
    StorageService.saveNote({
      id: 'n-2',
      profileId,
      title: 'Reflexión profunda',
      content: 'Metacognición sobre el estudio',
      isReflection: true,
      createdAt: '2026-10-14',
      updatedAt: '2026-10-14',
    });

    render(<NotesView profileId={profileId} />);

    expect(screen.getByText('Nota rápida de compras')).toBeInTheDocument();
    expect(screen.getByText('Reflexión profunda')).toBeInTheDocument();

    const reflectionsTab = screen.getByRole('button', { name: /reflexiones & diario/i });
    await user.click(reflectionsTab);

    expect(screen.queryByText('Nota rápida de compras')).not.toBeInTheDocument();
    expect(screen.getByText('Reflexión profunda')).toBeInTheDocument();
  });
});
