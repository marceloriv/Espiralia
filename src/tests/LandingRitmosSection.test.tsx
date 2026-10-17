import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingRitmosSection } from '../components/landing/LandingRitmosSection';

describe('LandingRitmosSection', () => {
  it('renderiza la cabecera editorial de cadencia vital', () => {
    render(<LandingRitmosSection />);
    expect(screen.getByRole('heading', { level: 2, name: /una cadencia vital que respeta tus límites/i })).toBeInTheDocument();
    expect(screen.getAllByText(/cadencia vital/i).length).toBeGreaterThan(0);
  });

  it('despliega los 3 momentos cardinales de la jornada', () => {
    render(<LandingRitmosSection />);
    expect(screen.getByText(/01 • 07:30 - 09:00/i)).toBeInTheDocument();
    expect(screen.getByText(/enfoque profundo sin ruido/i)).toBeInTheDocument();

    expect(screen.getByText(/02 • 11:00 - 13:00/i)).toBeInTheDocument();
    expect(screen.getByText(/avance estratégico & gestión/i)).toBeInTheDocument();

    expect(screen.getByText(/03 • 20:00 - 20:30/i)).toBeInTheDocument();
    expect(screen.getByText(/ritual de vaciado & gratitud/i)).toBeInTheDocument();
  });
});
