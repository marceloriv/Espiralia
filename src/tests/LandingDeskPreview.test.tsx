import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingDeskPreview } from '../components/landing/LandingDeskPreview';

describe('LandingDeskPreview', () => {
  it('despliega la cabecera de la mesa de trabajo con badge y titular editorial', () => {
    render(<LandingDeskPreview />);
    expect(screen.getByRole('heading', { level: 2, name: /la mesa de trabajo de un día/i })).toBeInTheDocument();
    // La insignia dice qué es la sección (un ejemplo), no repite el titular ni promete datos "en vivo".
    expect(screen.getByText(/ejemplo interactivo/i)).toBeInTheDocument();
  });

  it('despliega el pliego diario A4 con pila de hojas superpuestas y broche archivador metálico', () => {
    const { container } = render(<LandingDeskPreview />);
    expect(screen.getByText(/plan de foco • hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/repaso de estudio: 40 preguntas/i)).toBeInTheDocument();
    expect(screen.getByText(/marca las tareas del ejemplo/i)).toBeInTheDocument();

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

  // La "serenidad" era un porcentaje inventado (60 + avance); el ejemplo muestra solo el avance real de sus tareas.
  it('recalcula el avance del ejemplo y el contador de tareas al alternarlas', async () => {
    const user = userEvent.setup();
    render(<LandingDeskPreview />);

    expect(screen.getByText(/33% completado/i)).toBeInTheDocument();
    expect(screen.queryByText(/\d+% serenidad/i)).not.toBeInTheDocument();
    expect(screen.getByText(/1 de 3/i)).toBeInTheDocument();

    const secondTask = screen.getByRole('checkbox', { name: /postulación universitaria 2026/i });
    await user.click(secondTask);

    expect(screen.getByText(/67% completado/i)).toBeInTheDocument();
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
