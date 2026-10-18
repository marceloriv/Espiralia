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

  it('despliega el pliego diario A4 con pila de hojas superpuestas y broche archivador metálico', () => {
    const { container } = render(<LandingDeskPreview />);
    expect(screen.getByText(/plan de foco • hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/estudio licencia clase b/i)).toBeInTheDocument();
    expect(screen.getByText(/papel libre de ácido • 120 gsm/i)).toBeInTheDocument();

    const paperStack = container.querySelector('[data-papercraft="paper-stack"]');
    const binderClip = container.querySelector('[data-papercraft="binder-clip"]');
    expect(paperStack).toBeInTheDocument();
    expect(binderClip).toBeInTheDocument();
    expect(binderClip).toHaveAttribute('aria-hidden', 'true');
  });

  it('permite alternar el estado de completado en las tareas interactivas', async () => {
    const user = userEvent.setup();
    render(<LandingDeskPreview />);

    const secondTaskCheckbox = screen.getByRole('checkbox', { name: /postulación universitaria 2026/i });
    expect(secondTaskCheckbox).not.toBeChecked();

    await user.click(secondTaskCheckbox);
    expect(secondTaskCheckbox).toBeChecked();
  });

  it('aplica la clase de trazo caligráfico de tinta al completar una tarea de prioridad', async () => {
    const user = userEvent.setup();
    const { container } = render(<LandingDeskPreview />);

    const secondTaskCheckbox = screen.getByRole('checkbox', { name: /postulación universitaria 2026/i });
    expect(secondTaskCheckbox).not.toBeChecked();

    await user.click(secondTaskCheckbox);
    expect(secondTaskCheckbox).toBeChecked();

    const completedText = container.querySelector('[class*="priorityTextCompleted"]');
    expect(completedText).toBeInTheDocument();
  });

  it('recalcula la tasa de serenidad y actualiza el contador de módulos al alternar tareas', async () => {
    const user = userEvent.setup();
    render(<LandingDeskPreview />);

    // Inicialmente 1 tarea de 3 completada (73% Serenidad)
    expect(screen.getByText(/73% serenidad/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de 3/i)).toBeInTheDocument();

    const secondTask = screen.getByRole('checkbox', { name: /postulación universitaria 2026/i });
    await user.click(secondTask);

    // Con 2 de 3 completadas -> 87% Serenidad
    expect(screen.getByText(/87% serenidad/i)).toBeInTheDocument();
    expect(screen.getByText(/2 de 3/i)).toBeInTheDocument();

    const statusBadge = screen.getByRole('status');
    expect(statusBadge).toHaveAttribute('aria-live', 'polite');
  });

  it('despliega la tarjeta de estado vital y la nota táctil de captura rápida', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByText(/estado vital & ritmo/i)).toBeInTheDocument();
    expect(screen.getByText(/captura rápida/i)).toBeInTheDocument();
    expect(screen.getByText(/no confundir movimiento con progreso/i)).toBeInTheDocument();
  });
});
