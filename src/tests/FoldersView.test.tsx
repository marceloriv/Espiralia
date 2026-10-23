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

    expect(screen.getAllByText('Test de Señales')[0]).toBeInTheDocument();
    const anchor = screen.getByRole('link', { name: /abrir test de señales/i });
    expect(anchor).toHaveAttribute('href', 'https://conaset.cl');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renderiza el fichero archival con solapas escalonadas y tabla de fichas viva', () => {
    render(<FoldersView profileId="p-test" />);

    expect(screen.getByRole('heading', { level: 1, name: /explorador de carpetas & vínculos/i })).toBeInTheDocument();
    expect(screen.getByText(/fichas & manuscritos en esta carpeta/i)).toBeInTheDocument();
    expect(screen.getByText(/captura veloz de enlace/i)).toBeInTheDocument();
    expect(screen.getByText(/almacenamiento local \(localstorage\)/i)).toBeInTheDocument();
  });

  it('pone la carpeta abierta, la captura y las tarjetas de enlace en Papel rosa, sin ornamentos ni relleno de ejemplo', async () => {
    const { StorageService } = await import('../services/storage');
    StorageService.saveLink({
      id: 'lnk-papel',
      profileId: 'p-test',
      title: 'Referencia',
      url: 'https://example.com',
      createdAt: new Date().toISOString(),
    });
    const { container } = render(<FoldersView profileId="p-test" />);

    expect(container.querySelectorAll('[data-tinte="rosa"]').length).toBeGreaterThanOrEqual(3);
    for (const ornamento of ['brassProngFastener', 'manilaCreaseLine', 'watermarkNum', 'hankoSeal', 'washiTape', 'pushpinBadge', 'washiCardStrip']) {
      expect(container.querySelector(`[class*="${ornamento}"]`), ornamento).toBeNull();
    }
    for (const texto of [/estante 04-a/i, /solapa científica/i, /hoja 1 de 2/i, /carpeta manila/i, /modif\. 12 mar/i, /descargar fichero zip/i, /oficiales \(0\)/i, /versión 2\.4\.0/i, /metadatos automáticos/i]) {
      expect(screen.queryByText(texto), String(texto)).not.toBeInTheDocument();
    }
  });

  it('renderiza las carpetas del fichero con estructura de carpeta plana moderna (solapa trasera, hojas y bolsillo frontal)', () => {
    render(<FoldersView profileId="p-test-flat" />);

    const sheets = screen.getAllByTestId('folder-flat-sheets');
    expect(sheets.length).toBeGreaterThanOrEqual(4);

    const activeTab = screen.getByRole('tab', { name: /proyectos & estudio/i });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(activeTab.querySelector('[data-front-flap="true"]')).toBeInTheDocument();
  });

  describe('Tabla de Fichas & Manuscritos Viva', () => {
    it('lista notas y enlaces reales de la carpeta activa y elimina mock de conaset', async () => {
      const { StorageService } = await import('../services/storage');
      const { within } = await import('@testing-library/react');
      const user = userEvent.setup();

      const folderId = 'folder-investigacion';
      StorageService.saveFolder({
        id: folderId,
        profileId,
        name: 'Investigación & Ensayos',
        color: '#8b5cf6',
        createdAt: '2026-10-17',
      });

      StorageService.saveNote({
        id: 'note-inv-1',
        profileId,
        folderId,
        title: 'Borrador Ensayo Fenomenología',
        content: 'Exploración de la percepción y el espacio vivido.',
        tags: ['filosofía'],
        createdAt: '2026-10-17',
        updatedAt: '2026-10-17',
      });

      StorageService.saveLink({
        id: 'link-inv-1',
        profileId,
        folderId,
        title: 'Stanford Encyclopedia of Philosophy',
        url: 'https://plato.stanford.edu',
        createdAt: '2026-10-17',
      });

      render(<FoldersView profileId={profileId} />);

      const table = screen.getByRole('table');
      expect(within(table).getByText('Borrador Ensayo Fenomenología')).toBeInTheDocument();
      expect(within(table).getByText('Stanford Encyclopedia of Philosophy')).toBeInTheDocument();
      expect(screen.queryByText(/Libro del Nuevo Conductor Clase B 2025\.pdf/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Resumen Mnemotécnico: Velocidades/i)).not.toBeInTheDocument();

      // Abrir NoteModal al pulsar Ver Ficha de la nota
      const viewNoteBtn = screen.getByRole('button', { name: /ver ficha borrador ensayo fenomenología/i });
      await user.click(viewNoteBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Borrador Ensayo Fenomenología')).toBeInTheDocument();
    });

    it('muestra estado vacío amable cuando la carpeta no tiene elementos', async () => {
      const { StorageService } = await import('../services/storage');
      const folderId = 'folder-vacia';
      StorageService.saveFolder({
        id: folderId,
        profileId,
        name: 'Carpeta Vacía',
        color: '#f59e0b',
        createdAt: '2026-10-17',
      });

      render(<FoldersView profileId={profileId} />);

      expect(screen.getByText(/esta carpeta no contiene notas ni enlaces vinculados todavía/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ nueva nota/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\+ nuevo enlace/i })).toBeInTheDocument();
    });
  });

  describe('Marcadores Destacados Vivos', () => {
    it('muestra enlaces reales de storage en la cuadrícula de marcadores y elimina mock conaset/demre', async () => {
      const { StorageService } = await import('../services/storage');
      StorageService.saveLink({
        id: 'link-real-1',
        profileId,
        title: 'Documentación Oficial MDN Web',
        url: 'https://developer.mozilla.org',
        description: 'Referencia viva de APIs web, JavaScript y estándares abiertos.',
        createdAt: '2026-10-17',
      });

      render(<FoldersView profileId={profileId} />);

      expect(screen.getByText('Documentación Oficial MDN Web')).toBeInTheDocument();
      expect(screen.getByText(/developer\.mozilla\.org/i)).toBeInTheDocument();
      expect(screen.queryByText(/Simulador Oficial de Examen Teórico CONASET/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Portal DEMRE • Modelo de Pruebas & Claves PAES/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Guías de Meditación Somática & Audio-anclaje/i)).not.toBeInTheDocument();
    });

    it('muestra estado vacío y botón para guardar enlace cuando no hay marcadores', () => {
      render(<FoldersView profileId={profileId} />);

      expect(screen.getByText(/sin marcadores guardados todavía/i)).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /\+ guardar enlace/i }).length).toBeGreaterThanOrEqual(2);
    });
  });
});

