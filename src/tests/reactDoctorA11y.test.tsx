import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoldersView } from '../components/FoldersView';
import { GoalsDrawer } from '../components/planner/GoalsDrawer';
import { StorageService } from '../services/storage';

describe('React Doctor A11y & HTML validation', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.saveFolder({
      id: 'f-1',
      profileId: 'p-test',
      name: 'Estudios',
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
    });
  });

  it('FoldersView no anida botones interactivos dentro de otro elemento button', () => {
    const { container } = render(<FoldersView profileId="p-test" />);
    // Ningún botón debe ser descendiente de un elemento con role="button" o etiqueta <button>
    const nestedButtons = container.querySelectorAll('button button, [role="button"] button');
    expect(nestedButtons.length).toBe(0);
  });

  it('GoalsDrawer tiene nombre accesible en el botón + de sub-tareas', async () => {
    const user = userEvent.setup();
    render(
      <GoalsDrawer
        isOpen={true}
        onClose={() => {}}
        profileId="p-test"
      />
    );
    await user.click(screen.getByRole('button', { name: /\+ nueva meta/i }));
    const addSubTaskBtn = screen.getByRole('button', { name: /agregar sub-tarea/i });
    expect(addSubTaskBtn).toBeInTheDocument();
  });
});
