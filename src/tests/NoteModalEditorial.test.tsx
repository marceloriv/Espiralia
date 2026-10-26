import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteModal } from '../components/notes/NoteModal';
import type { Note, Folder } from '../types';

describe('NoteModal - Modal Editorial Verjurado', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  const sampleFolders: Folder[] = [
    { id: 'f-1', profileId: 'p-1', name: 'Conaset', createdAt: '2026-10-17' },
    { id: 'f-2', profileId: 'p-1', name: 'Terapia', createdAt: '2026-10-17' },
  ];

  const sampleNote: Note = {
    id: 'note-100',
    profileId: 'p-1',
    title: 'Apunte Teórico Clase B',
    content: 'Texto de prueba inicial.',
    isReflection: false,
    folderId: 'f-1',
    tags: ['conaset', 'estudio'],
    createdAt: '2026-10-17T10:00:00.000Z',
    updatedAt: '2026-10-17T11:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    const { container } = render(
      <NoteModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza el modal con cinta decorativa visible y textura de cuaderno', () => {
    const { container } = render(
      <NoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialNote={sampleNote}
        folders={sampleFolders}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const ribbon = container.querySelector('[data-testid="bujo-ribbon"]');
    expect(ribbon).toBeInTheDocument();
    expect(ribbon).toHaveAttribute('aria-hidden', 'true');
    // Para notas con tag 'estudio' o 'conaset', la cinta adquiere tono verde editorial
    expect(ribbon).toHaveStyle({ backgroundColor: '#047857' });
  });

  it('contiene botones de ayuda rápida para sintaxis bujo (+ § Sección y + 🚗 Caja/Hito)', () => {
    render(
      <NoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByRole('button', { name: /\+ § Sección/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Caja\/Hito/i })).toBeInTheDocument();
  });

  it('al hacer clic en + § Sección, inserta automáticamente "\\n§ Nueva Sección\\n" al final del textarea', async () => {
    const user = userEvent.setup();
    render(
      <NoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const textarea = screen.getByLabelText(/contenido/i) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');

    const btnSection = screen.getByRole('button', { name: /\+ § Sección/i });
    await user.click(btnSection);

    expect(textarea.value).toContain('\n§ Nueva Sección\n');
  });

  it('al hacer clic en + § Sección, inserta en la posición actual del cursor si el textarea está enfocado', async () => {
    const user = userEvent.setup();
    render(
      <NoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialNote={{
          ...sampleNote,
          content: 'Inicio del texto. Fin del texto.',
        }}
      />
    );

    const textarea = screen.getByLabelText(/contenido/i) as HTMLTextAreaElement;
    textarea.focus();
    // Colocar cursor entre "Inicio del texto. " y "Fin del texto."
    const insertPos = 'Inicio del texto. '.length;
    textarea.setSelectionRange(insertPos, insertPos);

    const btnSection = screen.getByRole('button', { name: /\+ § Sección/i });
    await user.click(btnSection);

    expect(textarea.value).toBe('Inicio del texto. \n§ Nueva Sección\nFin del texto.');
  });

  it('al hacer clic en + Caja/Hito, inserta snippet bujo de caja/hito en el textarea', async () => {
    const user = userEvent.setup();
    render(
      <NoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const textarea = screen.getByLabelText(/contenido/i) as HTMLTextAreaElement;
    const btnBox = screen.getByRole('button', { name: /\+ Caja\/Hito/i });
    await user.click(btnBox);

    expect(textarea.value).toContain('[caja: Hito / Recuadro | Detalle]');
  });

  it('muestra contador dinámico de palabras en la barra inferior del modal', async () => {
    const user = userEvent.setup();
    render(
      <NoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const wordCounter = screen.getByTestId('note-word-count');
    expect(wordCounter).toHaveTextContent('0 palabras');

    const textarea = screen.getByLabelText(/contenido/i);
    await user.type(textarea, 'Respiración consciente y calma presente');

    expect(wordCounter).toHaveTextContent('5 palabras');
  });

  it('envía los datos correctamente con onSave al enviar el formulario', async () => {
    const user = userEvent.setup();
    render(
      <NoteModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        folders={sampleFolders}
      />
    );

    const titleInput = screen.getByLabelText(/^título/i);
    await user.type(titleInput, 'Mi Diario de Gratitud');

    const reflectionCheckbox = screen.getByRole('checkbox', {
      name: /marcar como reflexión de diario/i,
    });
    await user.click(reflectionCheckbox);

    const folderSelect = screen.getByLabelText(/carpeta temática/i);
    await user.selectOptions(folderSelect, 'f-2');

    const textarea = screen.getByLabelText(/contenido/i);
    await user.type(textarea, 'Hoy agradezco el silencio de la mañana.');

    const tagsInput = screen.getByLabelText(/etiquetas/i);
    await user.type(tagsInput, 'gratitud, calma, matutino');

    const submitBtn = screen.getByRole('button', { name: /guardar nota/i });
    await user.click(submitBtn);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith({
      title: 'Mi Diario de Gratitud',
      content: 'Hoy agradezco el silencio de la mañana.',
      isReflection: true,
      folderId: 'f-2',
      tags: ['gratitud', 'calma', 'matutino'],
    });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
