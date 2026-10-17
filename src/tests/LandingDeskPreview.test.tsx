import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingDeskPreview } from '../components/landing/LandingDeskPreview';

describe('LandingDeskPreview', () => {
  it('despliega la cabecera de la mesa de trabajo con badge y titular editorial', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByRole('heading', { level: 2, name: /la mesa de trabajo: tu centro de control silencioso/i })).toBeInTheDocument();
    expect(screen.getByText(/mesa de trabajo en vivo/i)).toBeInTheDocument();
  });

  it('despliega el pliego diario A4 con prioridades, cronograma horario y nota de papel', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByText(/plan de foco • hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/estudio licencia clase b/i)).toBeInTheDocument();
    expect(screen.getByText(/postulación universitaria 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/sesión de diario/i)).toBeInTheDocument();
    expect(screen.getByText(/07:30 - 09:00/i)).toBeInTheDocument();
    expect(screen.getByText(/bloque alpha: revisión teórica conaset/i)).toBeInTheDocument();
    expect(screen.getByText(/papel libre de ácido • 120 gsm/i)).toBeInTheDocument();
  });

  it('permite alternar el estado de completado en las tareas interactivas', async () => {
    const user = userEvent.setup();
    render(<LandingDeskPreview />);

    const secondTaskCheckbox = screen.getByRole('checkbox', { name: /postulación universitaria 2026/i });
    expect(secondTaskCheckbox).not.toBeChecked();

    await user.click(secondTaskCheckbox);
    expect(secondTaskCheckbox).toBeChecked();
  });

  it('despliega la tarjeta de estado vital y la nota táctil con chincheta', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByText(/estado vital & ritmo/i)).toBeInTheDocument();
    expect(screen.getByText(/horas de foco silencioso/i)).toBeInTheDocument();
    expect(screen.getByText(/serenidad mental/i)).toBeInTheDocument();
    expect(screen.getByText(/captura rápida/i)).toBeInTheDocument();
    expect(screen.getByText(/no confundir movimiento con progreso/i)).toBeInTheDocument();
  });
});
