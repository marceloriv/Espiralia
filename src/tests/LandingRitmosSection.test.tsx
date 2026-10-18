import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingRitmosSection } from '../components/landing/LandingRitmosSection';

describe('LandingRitmosSection', () => {
  it('despliega los tres momentos de cadencia vital con horarios e iconos representativos', () => {
    render(<LandingRitmosSection />);
    expect(screen.getByRole('heading', { level: 2, name: /una cadencia vital que respeta tus límites/i })).toBeInTheDocument();
    expect(screen.getByText(/01 • 07:30 - 09:00/i)).toBeInTheDocument();
    expect(screen.getByText(/02 • 11:00 - 13:00/i)).toBeInTheDocument();
    expect(screen.getByText(/03 • 20:00 - 20:30/i)).toBeInTheDocument();
  });

  it('renderiza los boletos con sellos de boleto perforado y cintas washi tape', () => {
    const { container } = render(<LandingRitmosSection />);
    const ticketStubs = container.querySelectorAll('[data-papercraft="ticket-stub"]');
    expect(ticketStubs.length).toBe(3);

    const washiTapes = container.querySelectorAll('[data-papercraft="washi-tape"]');
    expect(washiTapes.length).toBe(3);
  });

  it('incluye las métricas de serenidad en cada momento de la jornada', () => {
    render(<LandingRitmosSection />);
    expect(screen.getByText(/1 sola prioridad crítica • modo sin notificaciones/i)).toBeInTheDocument();
    expect(screen.getByText(/checklist visible • cierre antes del mediodía/i)).toBeInTheDocument();
    expect(screen.getByText(/cero pantallas tras el cierre • calma mental/i)).toBeInTheDocument();
  });
});
