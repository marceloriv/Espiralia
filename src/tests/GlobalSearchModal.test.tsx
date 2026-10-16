import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalSearchModal } from '../components/search/GlobalSearchModal';
import { StorageService } from '../services/storage';

describe('GlobalSearchModal', () => {
  const profileId = 'p-modal-search';

  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile({ id: profileId, name: 'Usuario Prueba', avatar: 'U', createdAt: '2026-10-15' });
    StorageService.saveTodo({ id: 't-10', profileId, title: 'Comprar cuaderno de notas', priority: 'alta', status: 'pendiente', areaId: 'a-10', createdAt: '2026-10-15' });
    StorageService.saveNote({ id: 'n-10', profileId, title: 'Notas de diseño editorial', content: 'Estilo tipográfico Claude', createdAt: '2026-10-15', updatedAt: '2026-10-15' });
  });

  it('renderiza diálogo accesible con input de búsqueda cuando isOpen es true', () => {
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} onNavigate={vi.fn()} profileId={profileId} />);

    expect(screen.getByRole('dialog', { name: /búsqueda global/i })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: /buscar en toda la aplicación/i })).toBeInTheDocument();
    expect(screen.getByText(/escribe al menos 2 letras/i)).toBeInTheDocument();
  });

  it('no renderiza nada cuando isOpen es false', () => {
    render(<GlobalSearchModal isOpen={false} onClose={vi.fn()} onNavigate={vi.fn()} profileId={profileId} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('busca y muestra resultados agrupados al escribir en el input', async () => {
    const user = userEvent.setup();
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} onNavigate={vi.fn()} profileId={profileId} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'cuaderno');

    expect(screen.getByText('Comprar cuaderno de notas')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/se encontró 1 resultado|se encontraron 1 resultados/i);
  });

  it('permite seleccionar un resultado y dispara onNavigate a la vista adecuada', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} onNavigate={handleNavigate} profileId={profileId} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'editorial');

    const resultItem = screen.getByText('Notas de diseño editorial');
    await user.click(resultItem);

    expect(handleNavigate).toHaveBeenCalledWith('notes');
  });

  it('soporta navegación con flechas de teclado y selección con Enter', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} onNavigate={handleNavigate} profileId={profileId} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'notas');

    // Al haber resultados, flecha abajo selecciona el primer resultado
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(handleNavigate).toHaveBeenCalled();
  });

  it('muestra mensaje informativo cuando no hay coincidencias', async () => {
    const user = userEvent.setup();
    render(<GlobalSearchModal isOpen={true} onClose={vi.fn()} onNavigate={vi.fn()} profileId={profileId} />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'palabrainexistente123');

    expect(screen.getAllByText(/no se encontraron resultados para/i).length).toBeGreaterThan(0);
  });

  it('cierra el diálogo al presionar la tecla Escape', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<GlobalSearchModal isOpen={true} onClose={handleClose} onNavigate={vi.fn()} profileId={profileId} />);

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalled();
  });
});
