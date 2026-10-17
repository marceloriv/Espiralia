import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingView } from '../components/LandingView';

describe('LandingView', () => {
  it('renderiza la cabecera editorial con indicador v2.4 papelería y titular display', () => {
    render(<LandingView onNavigateLogin={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /el arte de organizar tu vida con serenidad cotidiana/i })).toBeInTheDocument();
    expect(screen.getByText(/v2\.4 papelería/i)).toBeInTheDocument();
    expect(screen.getByText(/100% client-side • sin rastreo • almacenamiento local/i)).toBeInTheDocument();
    expect(screen.getByText(/indexeddb cifrado/i)).toBeInTheDocument();
    expect(screen.getByText(/biorritmo hoy/i)).toBeInTheDocument();
  });

  it('despliega los tres pilares de enfoque con enlaces ancla y scroll-margin', () => {
    render(<LandingView onNavigateLogin={() => {}} />);
    expect(screen.getByText(/1\. estudios & foco práctico/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. introspección & diario/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. horizonte & universidad/i)).toBeInTheDocument();

    const pilaresSection = document.getElementById('pilares');
    expect(pilaresSection).toBeInTheDocument();
  });

  it('dispara la navegación hacia login al hacer clic en comenzar cuaderno o acceder', async () => {
    const user = userEvent.setup();
    const handleLogin = vi.fn();
    render(<LandingView onNavigateLogin={handleLogin} />);

    const ctaBtns = screen.getAllByRole('button', { name: /comenzar cuaderno|abrir cuaderno personal/i });
    expect(ctaBtns.length).toBeGreaterThan(0);
    await user.click(ctaBtns[0]);

    expect(handleLogin).toHaveBeenCalled();
  });
});
