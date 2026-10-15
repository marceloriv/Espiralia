import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoldersView } from '../components/FoldersView';

describe('FoldersView', () => {
  const profileId = 'p-folders-view';

  beforeEach(() => {
    localStorage.clear();
  });

  it('permite crear una carpeta temática y registrar un vínculo web válido', async () => {
    const user = userEvent.setup();
    render(<FoldersView profileId={profileId} />);

    expect(screen.getByRole('heading', { level: 2, name: /carpetas & vínculos/i })).toBeInTheDocument();

    const addFolderBtn = screen.getByRole('button', { name: /\+ nueva carpeta/i });
    await user.click(addFolderBtn);

    const folderNameInput = screen.getByLabelText(/nombre de la carpeta/i);
    await user.type(folderNameInput, 'Conducción Clase B');

    const saveFolderBtn = screen.getByRole('button', { name: /guardar carpeta/i });
    await user.click(saveFolderBtn);

    expect(screen.getAllByText('Conducción Clase B')[0]).toBeInTheDocument();

    // Agregar vínculo dentro de la carpeta
    const addLinkBtn = screen.getByRole('button', { name: /\+ agregar vínculo/i });
    await user.click(addLinkBtn);

    const titleInput = screen.getByLabelText(/título del enlace/i);
    await user.type(titleInput, 'Test de Señales');

    const urlInput = screen.getByLabelText(/dirección url/i);
    await user.type(urlInput, 'https://conaset.cl');

    const saveLinkBtn = screen.getByRole('button', { name: /guardar vínculo/i });
    await user.click(saveLinkBtn);

    expect(screen.getByText('Test de Señales')).toBeInTheDocument();
    const anchor = screen.getByRole('link', { name: /abrir test de señales/i });
    expect(anchor).toHaveAttribute('href', 'https://conaset.cl');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
