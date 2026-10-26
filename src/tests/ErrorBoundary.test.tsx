import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Skill best-practices: un error de render no debe dejar la pantalla en blanco (AGENTS.md §10 A10).
const Bomba = (): never => {
  throw new Error('fallo de render');
};

describe('ErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('muestra el contenido cuando nada falla', () => {
    render(<ErrorBoundary><p>Todo bien</p></ErrorBoundary>);
    expect(screen.getByText('Todo bien')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('cambia la pantalla en blanco por un aviso en español que dice que los datos siguen guardados', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Bomba /></ErrorBoundary>);
    const aviso = screen.getByRole('alert');
    expect(aviso).toHaveTextContent(/algo salió mal/i);
    expect(aviso).toHaveTextContent(/siguen guardados en este navegador/i);
  });

  it('el botón Recargar llama a onReload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReload = vi.fn();
    const user = userEvent.setup();
    render(<ErrorBoundary onReload={onReload}><Bomba /></ErrorBoundary>);
    await user.click(screen.getByRole('button', { name: 'Recargar' }));
    expect(onReload).toHaveBeenCalledTimes(1);
  });
});
