import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StoredFile } from '../types';

// IndexedDB no existe en jsdom: se reemplaza fileStore por un almacén en memoria con la misma API.
const store = vi.hoisted(() => ({ files: [] as StoredFile[] }));
vi.mock('../services/fileStore', () => ({
  listFiles: vi.fn(async (profileId: string) => store.files.filter(f => f.profileId === profileId)),
  addFile: vi.fn(async (profileId: string, folderId: string, file: File) => {
    if (!file.name.endsWith('.pdf')) throw new Error('El archivo no es un PDF.');
    const meta = { id: `file-${store.files.length + 1}`, profileId, folderId, name: file.name, size: file.size, createdAt: '2026-10-28T12:00:00.000Z' };
    store.files.push(meta);
    return meta;
  }),
  deleteFile: vi.fn(async (_profileId: string, id: string) => {
    store.files = store.files.filter(f => f.id !== id);
  }),
  deleteFolderFiles: vi.fn(async (_profileId: string, folderId: string) => {
    store.files = store.files.filter(f => f.folderId !== folderId);
  }),
  getFileBlob: vi.fn(async () => new Blob(['%PDF-1.7'], { type: 'application/pdf' })),
}));

import { FoldersView } from '../components/FoldersView';
import { StorageService } from '../services/storage';
import { sileo } from 'sileo';

const profileId = 'p-pdf';

describe('FoldersView - PDF en carpetas', () => {
  beforeEach(() => {
    localStorage.clear();
    store.files = [];
    vi.restoreAllMocks();
    StorageService.saveFolder({ id: 'f-estudio', profileId, name: 'Estudio', createdAt: '2026-10-01' });
  });

  it('sube un PDF a la carpeta activa y lo lista con su tamaño y sus acciones', async () => {
    const user = userEvent.setup();
    render(<FoldersView profileId={profileId} />);

    const input = screen.getByLabelText(/elegir pdf para subir/i);
    await user.upload(input, new File(['%PDF-1.7 contenido'], 'apuntes.pdf', { type: 'application/pdf' }));

    const row = (await screen.findByText('apuntes.pdf')).closest('tr')!;
    expect(within(row).getByText(/^PDF · /)).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /abrir apuntes\.pdf/i })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /descargar apuntes\.pdf/i })).toBeInTheDocument();
    expect(store.files[0]).toMatchObject({ profileId, folderId: 'f-estudio', name: 'apuntes.pdf' });
  });

  it('avisa el motivo cuando el archivo no se puede subir y no lo lista', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const error = vi.spyOn(sileo, 'error');
    render(<FoldersView profileId={profileId} />);

    await user.upload(screen.getByLabelText(/elegir pdf para subir/i), new File(['hola'], 'nota.txt', { type: 'text/plain' }));

    expect(error).toHaveBeenCalledWith(expect.objectContaining({ title: 'No se subió "nota.txt"', description: 'El archivo no es un PDF.' }));
    expect(screen.queryByText('nota.txt')).not.toBeInTheDocument();
  });

  it('elimina un PDF solo tras confirmar', async () => {
    const user = userEvent.setup();
    store.files = [{ id: 'file-1', profileId, folderId: 'f-estudio', name: 'guia.pdf', size: 2048, createdAt: '2026-10-28T12:00:00.000Z' }];
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<FoldersView profileId={profileId} />);

    const borrar = await screen.findByRole('button', { name: /eliminar guia\.pdf/i });
    await user.click(borrar);
    expect(store.files).toHaveLength(1);

    confirm.mockReturnValue(true);
    await user.click(borrar);
    expect(store.files).toHaveLength(0);
    expect(await screen.findByText(/no contiene notas, enlaces ni pdf todavía/i)).toBeInTheDocument();
  });

  it('al borrar la carpeta avisa que sus PDF se borran con ella', async () => {
    const user = userEvent.setup();
    store.files = [{ id: 'file-1', profileId, folderId: 'f-estudio', name: 'guia.pdf', size: 2048, createdAt: '2026-10-28T12:00:00.000Z' }];
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<FoldersView profileId={profileId} />);
    await screen.findByText('guia.pdf');

    await user.click(screen.getByTitle('Eliminar Carpeta'));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Su PDF sí se borrará.'));
    await vi.waitFor(() => expect(store.files).toHaveLength(0));
  });
});
