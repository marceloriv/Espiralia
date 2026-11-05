import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeroCard } from '../components/landing/LandingHeroCard';

describe('LandingHeroCard', () => {
  it('renderiza la nota adhesiva con aforismo caligráfico, cinta washi y clip dorado', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/aforismo matutino/i)).toBeInTheDocument();
    expect(screen.queryByText(/№ 042/i)).not.toBeInTheDocument();
    expect(screen.getByText(/cada página escrita con calma sostiene el día que viene/i)).toBeInTheDocument();
    expect(screen.getByText('Ejemplo')).toBeInTheDocument();
  });

  it('despliega la ficha de día de ejemplo sobre pliego rasgado sin porcentajes inventados', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText('Día de ejemplo')).toBeInTheDocument();
    expect(screen.getByText(/en foco/i)).toBeInTheDocument();
    expect(screen.queryByText(/claridad mental/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/88%/i)).not.toBeInTheDocument();
  });

  // DESIGN.md §0.6: el rótulo de ficha lleva un dato real; no hay número de expediente ni "Bóveda Documental".
  it('despliega la carpeta dossier rotulada como ejemplo, sin expediente ni bóveda inventados', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText('EJEMPLO')).toBeInTheDocument();
    expect(screen.queryByText(/exp\. 2026/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bóveda documental/i)).not.toBeInTheDocument();
    const dossier = screen.getByLabelText(/expediente analógico de ejemplo/i);
    expect(dossier).toBeInTheDocument();
  });

  it('contiene la estructura de bodegón analógico con capas táctiles interactivas', () => {
    const { container } = render(<LandingHeroCard />);
    const vignetteContainer = container.querySelector('[class*="heroVignetteContainer"]');
    expect(vignetteContainer).toBeInTheDocument();
    expect(vignetteContainer).toHaveAttribute('data-interactive-stack', 'true');
  });
});
