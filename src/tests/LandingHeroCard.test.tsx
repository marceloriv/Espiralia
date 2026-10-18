import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeroCard } from '../components/landing/LandingHeroCard';

describe('LandingHeroCard', () => {
  it('renderiza la nota adhesiva con aforismo caligráfico, cinta washi y clip dorado', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/aforismo matutino/i)).toBeInTheDocument();
    expect(screen.getByText(/№ 042/i)).toBeInTheDocument();
    expect(screen.getByText(/small steps every day lead to big results/i)).toBeInTheDocument();
    expect(screen.getByText(/tinta ferrogalorresistente/i)).toBeInTheDocument();
  });

  it('despliega la ficha de biorritmo sobre pliego rasgado con sello de imprenta y porcentaje', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/biorritmo hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/en foco/i)).toBeInTheDocument();
    expect(screen.getByText(/claridad mental/i)).toBeInTheDocument();
    expect(screen.getByText(/88%/i)).toBeInTheDocument();
  });

  it('despliega la carpeta dossier de expediente analógico con pestaña de archivo y clip metálico', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/exp\. 2026 \/ santuario/i)).toBeInTheDocument();
    expect(screen.getByText(/bóveda documental/i)).toBeInTheDocument();
    const dossier = screen.getByLabelText(/expediente analógico santuario/i);
    expect(dossier).toBeInTheDocument();
  });
});
