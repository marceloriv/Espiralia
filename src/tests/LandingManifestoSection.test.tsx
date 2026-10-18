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
    expect(screen.getByText(/manifiesto de soberanía personal/i)).toBeInTheDocument();
  });

  it('despliega los 3 pilares del certificado de soberanía local-first', () => {
    render(<LandingManifestoSection onAction={() => {}} />);
    expect(screen.getByText(/soberanía digital certificada/i)).toBeInTheDocument();
    expect(screen.getByText(/100% client-side/i)).toBeInTheDocument();
    expect(screen.getByText(/bóveda cifrada/i)).toBeInTheDocument();
    expect(screen.getByText(/interoperabilidad total/i)).toBeInTheDocument();
  });

  it('incluye el banner de cierre con CTA primario y plantilla imprimible', async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();
    render(<LandingManifestoSection onAction={handleAction} />);

    expect(screen.getByText(/tu cuaderno te espera/i)).toBeInTheDocument();
    expect(screen.getByText(/descargar plantillas imprimibles \(pdf\)/i)).toBeInTheDocument();

    const ctaButton = screen.getByRole('button', { name: /comenzar cuaderno/i });
    await user.click(ctaButton);
    expect(handleAction).toHaveBeenCalled();
  });
});
