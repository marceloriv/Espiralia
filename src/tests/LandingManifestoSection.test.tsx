import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingManifestoSection } from '../components/landing/LandingManifestoSection';

describe('LandingManifestoSection', () => {
  it('renderiza la cita display del manifiesto en pliego oscuro', () => {
    render(<LandingManifestoSection onAction={() => {}} />);
    expect(
      screen.getByText(/tu tiempo te pertenece: cada hora es el espacio donde decides qué construir\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /manifiesto de soberanía personal/i })).toBeInTheDocument();
  });

  it('despliega los 3 pilares del certificado de soberanía local-first', () => {
    render(<LandingManifestoSection onAction={() => {}} />);
    expect(screen.getByText(/tus datos se quedan en tu navegador/i)).toBeInTheDocument();
    expect(screen.getByText(/100% client-side/i)).toBeInTheDocument();
    expect(screen.getByText(/datos locales/i)).toBeInTheDocument();
    expect(screen.getByText(/agenda exportable/i)).toBeInTheDocument();
  });

  it('incluye el banner de cierre con CTA primario y sin plantillas imprimibles', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(<LandingManifestoSection onAction={handleAction} />);

    expect(screen.getByText(/tu cuaderno te espera/i)).toBeInTheDocument();
    expect(screen.queryByText(/plantillas imprimibles/i)).not.toBeInTheDocument();

    const ctaButton = screen.getByRole('button', { name: /crear mi cuaderno/i });
    await user.click(ctaButton);
    expect(handleAction).toHaveBeenCalled();
  });
});
