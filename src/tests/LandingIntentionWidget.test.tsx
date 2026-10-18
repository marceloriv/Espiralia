import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingIntentionWidget } from '../components/landing/LandingIntentionWidget';

describe('LandingIntentionWidget', () => {
  it('renderiza por defecto la intención de calma mental con sus 3 pasos y región aria-live', () => {
    render(<LandingIntentionWidget />);
    expect(screen.getByRole('heading', { level: 2, name: /elige tu intención para hoy/i })).toBeInTheDocument();
    expect(screen.getByText(/no tienes que resolver toda tu vida hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/01\. pausa/i)).toBeInTheDocument();
    expect(screen.getByText(/02\. descarga/i)).toBeInTheDocument();
    expect(screen.getByText(/03\. un solo paso/i)).toBeInTheDocument();

    const liveRegion = screen.getByRole('region', { name: /panel de intención activa/i });
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('permite cambiar a foco implacable y actualiza la cita y los pasos con aria-pressed', async () => {
    const user = userEvent.setup();
    render(<LandingIntentionWidget />);

    const focoBtn = screen.getByRole('button', { name: /enfoque profundo/i });
    expect(focoBtn).toHaveAttribute('aria-pressed', 'false');

    await user.click(focoBtn);
    expect(focoBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/la concentración profunda es el acto de amor más grande/i)).toBeInTheDocument();
    expect(screen.getByText(/01\. mesa limpia/i)).toBeInTheDocument();
    expect(screen.getByText(/02\. bloque continuo/i)).toBeInTheDocument();
    expect(screen.getByText(/03\. cierre nítido/i)).toBeInTheDocument();
  });

  it('los botones de intención cumplen con un tamaño táctil accesible', () => {
    render(<LandingIntentionWidget />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(4);
    for (const btn of buttons) {
      expect(btn).toHaveClass(/intentionBtn/);
    }
  });
});
