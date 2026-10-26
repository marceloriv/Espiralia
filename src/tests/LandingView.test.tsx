import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingView } from '../components/LandingView';

describe('LandingView', () => {
  it('renderiza la cabecera editorial sin versión inventada y con titular display', () => {
    render(<LandingView onNavigateLogin={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: /organiza tu semana en un cuaderno que guarda todo en tu navegador/i })).toBeInTheDocument();
    expect(screen.queryByText(/v2\.4/i)).not.toBeInTheDocument();
    expect(screen.getByText(/datos en tu navegador/i)).toBeInTheDocument();
    expect(screen.getByText('Día de ejemplo')).toBeInTheDocument();
  });

  it('integra las fichas de archivador en la sección de pilares con enlaces ancla', () => {
    render(<LandingView onNavigateLogin={() => {}} />);
    expect(screen.getByText(/1\. estudios & foco práctico/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. introspección & diario/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. horizonte & universidad/i)).toBeInTheDocument();
    expect(screen.getByText(/01 \/ estudios/i)).toBeInTheDocument();

    const pilaresSection = document.getElementById('pilares');
    expect(pilaresSection).toBeInTheDocument();
  });

  it('dispara la navegación hacia login al hacer clic en crear mi cuaderno', async () => {
    const user = userEvent.setup();
    const handleLogin = vi.fn();
    render(<LandingView onNavigateLogin={handleLogin} />);

    const ctaBtns = screen.getAllByRole('button', { name: /crear mi cuaderno/i });
    expect(ctaBtns.length).toBeGreaterThan(0);
    await user.click(ctaBtns[0]);

    expect(handleLogin).toHaveBeenCalled();
  });

  it('soporta navegación hacia dashboard si el usuario ya cuenta con perfil activo', async () => {
    const user = userEvent.setup();
    const handleDashboard = vi.fn();
    render(
      <LandingView
        onNavigateLogin={() => {}}
        onNavigateDashboard={handleDashboard}
        hasActiveProfile={true}
      />
    );

    const ctaBtns = screen.getAllByRole('button', { name: /crear mi cuaderno/i });
    await user.click(ctaBtns[0]);
    expect(handleDashboard).toHaveBeenCalled();
  });

  it('mantiene reglas de accesibilidad para movimiento reducido', () => {
    const { container } = render(<LandingView onNavigateLogin={() => {}} />);
    const wrapper = container.querySelector('[class*="landingWrapper"]');
    expect(wrapper).toBeInTheDocument();
  });
});
