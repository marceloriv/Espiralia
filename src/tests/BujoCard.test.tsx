import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BujoCard } from '../components/notes/BujoCard';
import type { Note, Folder } from '../types';

describe('BujoCard', () => {
  const mockNote: Note = {
    id: 'note-1',
    profileId: 'p-1',
    title: 'Descompresión Mental',
    content: 'Hoy decidí caminar por el parque sin auriculares. La calma fue restauradora.',
    isReflection: true,
    tags: ['terapia', 'calma'],
    createdAt: '2026-10-17T12:00:00.000Z',
    updatedAt: '2026-10-17T15:30:00.000Z',
  };

  const mockFolder: Folder = {
    id: 'f-1',
    profileId: 'p-1',
    name: 'Diario Personal',
    color: '#8E1EA2',
    createdAt: '2026-10-17T10:00:00.000Z',
  };

  it('renderiza tarjeta con cinta marcapáginas visible y atributos aria-hidden', () => {
    const { container } = render(
      <BujoCard
        note={mockNote}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const ribbon = container.querySelector('[data-testid="bujo-ribbon"]');
    expect(ribbon).toBeInTheDocument();
    expect(ribbon).toHaveAttribute('aria-hidden', 'true');
  });

  it('muestra encabezado estilizado con símbolo § y título de la nota', () => {
    render(
      <BujoCard
        note={mockNote}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('§')).toBeInTheDocument();
    expect(screen.getByText('Descompresión Mental')).toBeInTheDocument();
  });

  it('muestra badge de palabras y fecha formateada en locale es-CL', () => {
    render(
      <BujoCard
        note={mockNote}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/12\s+palabras/i)).toBeInTheDocument();
    const expectedDate = new Date(mockNote.updatedAt).toLocaleDateString('es-CL');
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('muestra el nombre de la carpeta y etiquetas si se proveen', () => {
    render(
      <BujoCard
        note={mockNote}
        folder={mockFolder}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Diario Personal')).toBeInTheDocument();
    expect(screen.getByText('#terapia')).toBeInTheDocument();
    expect(screen.getByText('#calma')).toBeInTheDocument();
  });

  it('al hacer clic en la tarjeta o presionar Enter, llama a onSelect(note)', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    const { container } = render(
      <BujoCard
        note={mockNote}
        onSelect={handleSelect}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const card = container.querySelector('article');
    expect(card).toBeInTheDocument();

    await user.click(card!);
    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockNote);

    card!.focus();
    await user.keyboard('{Enter}');
    expect(handleSelect).toHaveBeenCalledTimes(2);
    expect(handleSelect).toHaveBeenLastCalledWith(mockNote);
  });

  it('al hacer clic en botón de editar, invoca onEdit(note); en eliminar, invoca onDelete(note)', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <BujoCard
        note={mockNote}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    const editBtn = screen.getByRole('button', { name: /editar/i });
    const deleteBtn = screen.getByRole('button', { name: /eliminar/i });

    await user.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
    expect(handleEdit).toHaveBeenCalledWith(mockNote);
    expect(handleSelect).not.toHaveBeenCalled();

    await user.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleDelete).toHaveBeenCalledWith(mockNote);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('aplica clase cardActive si isActive es true', () => {
    const { container, rerender } = render(
      <BujoCard
        note={mockNote}
        isActive={false}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const card = container.querySelector('article')!;
    expect(card.className).not.toMatch(/cardActive/);

    rerender(
      <BujoCard
        note={mockNote}
        isActive={true}
        onSelect={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(card.className).toMatch(/cardActive/);
  });
});
