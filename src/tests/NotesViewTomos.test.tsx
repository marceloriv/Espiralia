import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesView } from '../components/NotesView';
import { StorageService } from '../services/storage';

describe('NotesView - Tomos y Carpetas', () => {
  const profileId = 'p-tomos-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza las 3 carpetas de Tomos y filtra notas sin pérdida de datos', async () => {
    const user = userEvent.setup();

    // Guardar 1 nota en Tomo 01 y 1 nota en Tomo 02
    StorageService.saveNote({
      id: 'note-t1',
      profileId,
      folderId: 'tomo-01',
      title: 'Nota de Diario Íntimo',
      content: 'Reflexión de autorregulación matutina.',
      isReflection: true,
      tags: ['terapia'],
      createdAt: '2026-10-17T10:00:00.000Z',
    });

    StorageService.saveNote({
      id: 'note-t2',
      profileId,
      folderId: 'tomo-02',
      title: 'Boceto de Taller y Prototipo',
      content: 'Lluvia de ideas para la interfaz de productividad.',
      isReflection: false,
      tags: ['ideas'],
      createdAt: '2026-10-17T11:00:00.000Z',
    });

    render(<NotesView profileId={profileId} />);

    // Por defecto inicia en Tomo 01
    expect(screen.getByText('Nota de Diario Íntimo')).toBeInTheDocument();
    expect(screen.queryByText('Boceto de Taller y Prototipo')).not.toBeInTheDocument();

    // Cambiar a Tomo 02: Ideas & Taller
    const tomo2Btn = screen.getByRole('button', { name: /ideas & taller/i });
    await user.click(tomo2Btn);

    // Debe mostrar la nota de Tomo 02 y ocultar la de Tomo 01
    expect(screen.getByText('Boceto de Taller y Prototipo')).toBeInTheDocument();
    expect(screen.queryByText('Nota de Diario Íntimo')).not.toBeInTheDocument();

    // Volver a Tomo 01
    const tomo1Btn = screen.getByRole('button', { name: /diario íntimo & terapia/i });
    await user.click(tomo1Btn);

    // Las notas de Tomo 01 reaparecen intactas
    expect(screen.getByText('Nota de Diario Íntimo')).toBeInTheDocument();
    expect(screen.queryByText('Boceto de Taller y Prototipo')).not.toBeInTheDocument();
  });

  it('asigna automáticamente el folderId del tomo activo al crear una nueva nota', async () => {
    const user = userEvent.setup();
    render(<NotesView profileId={profileId} />);

    // Cambiar al Tomo 03: Conaset
    const tomo3Btn = screen.getByRole('button', { name: /conaset & apuntes/i });
    await user.click(tomo3Btn);

    // Crear nueva nota
    const addBtn = screen.getByRole('button', { name: /\+ nueva nota/i });
    await user.click(addBtn);

    const titleInput = screen.getByLabelText(/título/i);
    await user.type(titleInput, 'Prioridad en Rotondas y Frenado');

    const contentInput = screen.getByLabelText(/contenido/i);
    await user.type(contentInput, '§ 1. Distancias en calzada mojada.');

    const saveBtn = screen.getByRole('button', { name: /guardar nota/i });
    await user.click(saveBtn);

    // Verifica que aparece en la vista actual (Tomo 03)
    expect(screen.getByText('Prioridad en Rotondas y Frenado')).toBeInTheDocument();

    // Verificar en StorageService que tiene folderId 'tomo-03'
    const storedNotes = StorageService.getNotes(profileId);
    const conasetNote = storedNotes.find(n => n.title === 'Prioridad en Rotondas y Frenado');
    expect(conasetNote).toBeDefined();
    expect(conasetNote?.folderId).toBe('tomo-03');

    // Cambiar a Tomo 01: la nota de Conaset no debe estar visible allí
    const tomo1Btn = screen.getByRole('button', { name: /diario íntimo & terapia/i });
    await user.click(tomo1Btn);
    expect(screen.queryByText('Prioridad en Rotondas y Frenado')).not.toBeInTheDocument();
  });
});
