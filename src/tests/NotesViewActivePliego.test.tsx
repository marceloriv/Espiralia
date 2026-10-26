import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesView } from '../components/NotesView';
import { StorageService } from '../services/storage';

describe('NotesView - Pliego Bujo Superior Activo', () => {
  const profileId = 'p-bujo-active-test';

  beforeEach(() => {
    localStorage.clear();
  });

  it('1. renderiza el pliego terapeutico por defecto si no hay notas de usuario guardadas', () => {
    render(<NotesView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 1, name: /diario de autoobservación & desahogo/i })).toBeInTheDocument();
    expect(screen.getByText(/tu primera entrada/i)).toBeInTheDocument();
    expect(screen.queryByText(/avance conaset/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/pliego activo de trabajo/i)).not.toBeInTheDocument();
  });

  it('2. permite editar y guardar el pliego superior con "Guardar Pliego", sincronizando titulo, secciones § y palabras', async () => {
    const user = userEvent.setup();
    render(<NotesView profileId={profileId} />);

    const editBtn = screen.getByRole('button', { name: /editar pliego/i });
    await user.click(editBtn);

    const titleInput = screen.getByLabelText(/editar título del pliego/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Mi Viaje Interior');

    const contentInput = screen.getByLabelText(/editar contenido del pliego/i);
    await user.clear(contentInput);
    await user.type(
      contentInput,
      '§ 1. Apertura del Viaje\nObservando la mente en quietud y presencia.\n[[caja: 🌿 Hito de Serenidad | 100% | Respiración diafragmática lograda]'
    );

    const savePliegoBtn = screen.getByRole('button', { name: /guardar pliego/i });
    await user.click(savePliegoBtn);

    // Persiste en StorageService
    const storedNotes = StorageService.getNotes(profileId);
    expect(storedNotes.length).toBeGreaterThanOrEqual(1);
    const activeSaved = storedNotes.find((n) => n.title === 'Mi Viaje Interior');
    expect(activeSaved).toBeDefined();

    // Pliego superior se sincroniza
    expect(screen.getByRole('heading', { name: /apertura del viaje/i })).toBeInTheDocument();
    expect(screen.getAllByText(/observando la mente en quietud y presencia/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/hito de serenidad/i)[0]).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getAllByText(/respiración diafragmática lograda/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/palabras escritas/i)).toBeInTheDocument();
  });

  it('3. al hacer clic en una tarjeta BujoCard de la grilla inferior, el pliego superior muestra esa nota con badge "Pliego Activo de Trabajo"', async () => {
    const user = userEvent.setup();
    StorageService.saveNote({
      id: 'note-investigacion',
      profileId,
      title: 'Bitácora de Investigación',
      content: '§ 1. Estado del Arte\nExplorando microfrontends y arquitectura limpia.',
      isReflection: false,
      tags: ['estudio'],
      createdAt: '2026-10-17T10:00:00.000Z',
      updatedAt: '2026-10-17T10:00:00.000Z',
    });
    StorageService.saveNote({
      id: 'note-estoico',
      profileId,
      title: 'Diario Estoico',
      content: '§ 1. Dicotomía del Control\nSolo controlo mis juicios y acciones cotidianas.',
      isReflection: true,
      tags: ['reflexion'],
      createdAt: '2026-10-17T11:00:00.000Z',
      updatedAt: '2026-10-17T11:00:00.000Z',
    });

    render(<NotesView profileId={profileId} />);

    // Inicialmente no hay badge de nota de usuario activa
    expect(screen.queryByText('Pliego Activo de Trabajo')).not.toBeInTheDocument();

    // Seleccionamos la tarjeta Bitácora de Investigación
    const cardInvestigacion = screen.getByRole('heading', { name: /bitácora de investigación/i });
    await user.click(cardInvestigacion);

    // Pliego superior se actualiza
    expect(screen.getByText('Pliego Activo de Trabajo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /estado del arte/i })).toBeInTheDocument();
    expect(screen.getAllByText(/explorando microfrontends y arquitectura limpia/i)[0]).toBeInTheDocument();

    // Seleccionamos Diario Estoico
    const cardEstoico = screen.getByRole('heading', { name: /diario estoico/i });
    await user.click(cardEstoico);

    expect(screen.getByText('Pliego Activo de Trabajo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /dicotomía del control/i })).toBeInTheDocument();
    expect(screen.getAllByText(/solo controlo mis juicios y acciones cotidianas/i)[0]).toBeInTheDocument();
  });

  it('4. permite editar una nota activa existente desde el pliego y persistir los cambios a través de StorageService.saveNote', async () => {
    const user = userEvent.setup();
    StorageService.saveNote({
      id: 'note-proceso',
      profileId,
      title: 'Nota en Proceso',
      content: '§ 1. Borrador\nTexto antes de la edición.',
      isReflection: false,
      createdAt: '2026-10-17T12:00:00.000Z',
      updatedAt: '2026-10-17T12:00:00.000Z',
    });

    render(<NotesView profileId={profileId} />);

    const card = screen.getByRole('heading', { name: /nota en proceso/i });
    await user.click(card);

    expect(screen.getAllByText(/texto antes de la edición/i)[0]).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /editar pliego/i });
    await user.click(editBtn);

    const textarea = screen.getByLabelText(/editar contenido del pliego/i);
    await user.clear(textarea);
    await user.type(textarea, '§ 1. Versión Pulida\nTexto refinado y persistido con éxito.');

    const saveBtn = screen.getByRole('button', { name: /guardar pliego/i });
    await user.click(saveBtn);

    // Verificamos persistencia
    const stored = StorageService.getNotes(profileId).find((n) => n.id === 'note-proceso');
    expect(stored?.content).toContain('Texto refinado y persistido con éxito');

    // Verificamos render en pliego
    expect(screen.getByRole('heading', { name: /versión pulida/i })).toBeInTheDocument();
    expect(screen.getAllByText(/texto refinado y persistido con éxito/i)[0]).toBeInTheDocument();
  });

  it('5. resuelve el color cromático de la cinta marcapáginas en el pliego superior según los tags de la nota activa', async () => {
    const user = userEvent.setup();
    StorageService.saveNote({
      id: 'note-study',
      profileId,
      title: 'Manual de Conducción',
      content: 'Reglas de tránsito clase B.',
      isReflection: false,
      tags: ['conaset'],
      createdAt: '2026-10-17T10:00:00.000Z',
      updatedAt: '2026-10-17T10:00:00.000Z',
    });
    StorageService.saveNote({
      id: 'note-idea',
      profileId,
      title: 'Proyecto Espiralia',
      content: 'Diseño editorial analógico.',
      isReflection: false,
      tags: ['idea'],
      createdAt: '2026-10-17T10:00:00.000Z',
      updatedAt: '2026-10-17T10:00:00.000Z',
    });

    render(<NotesView profileId={profileId} />);

    const studyCard = screen.getByRole('heading', { name: /manual de conducción/i });
    await user.click(studyCard);

    const ribbon = screen.getByTestId('pliego-ribbon');
    // Color de estudio: #047857 -> rgb(4, 120, 87)
    expect(ribbon).toHaveStyle({ backgroundColor: '#047857' });

    const ideaCard = screen.getByRole('heading', { name: /proyecto espiralia/i });
    await user.click(ideaCard);

    // Color de ideas: #d97706 -> rgb(217, 119, 6)
    expect(ribbon).toHaveStyle({ backgroundColor: '#d97706' });
  });

  it('el pliego superior abierto usa las anillas del Pliego, no un mecanismo propio', () => {
    const { container } = render(<NotesView profileId={profileId} />);

    expect(screen.queryByTestId('binder-mechanism')).toBeNull();
    expect(screen.queryAllByTestId('binder-punch-hole')).toHaveLength(0);
    expect(container.querySelector('[class*="folioContainer"] svg')).not.toBeNull();
  });
});
