import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingDeskPreview } from '../components/landing/LandingDeskPreview';

describe('LandingDeskPreview', () => {
  it('despliega las 3 columnas representativas de la mesa de trabajo', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByText(/la composición de tu mesa de trabajo/i)).toBeInTheDocument();
    expect(screen.getByText(/proceso terapéutico/i)).toBeInTheDocument();
    expect(screen.getByText(/ritmo semanal/i)).toBeInTheDocument();
    expect(screen.getByText(/tareas prioritarias/i)).toBeInTheDocument();
  });

  it('muestra el widget circular de 84% con rol accesible y tareas reales', () => {
    render(<LandingDeskPreview />);
    const progressWidget = screen.getByRole('progressbar', { name: /avance semanal/i });
    expect(progressWidget).toHaveAttribute('aria-valuenow', '84');
    expect(screen.getByText(/examen teórico clase b/i)).toBeInTheDocument();
    expect(screen.getByText(/postulación universidad 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/práctica en circuito cerrado/i)).toBeInTheDocument();
  });
});
