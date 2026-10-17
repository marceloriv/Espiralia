import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeroCard } from '../components/landing/LandingHeroCard';

describe('LandingHeroCard', () => {
  it('renderiza la nota adhesiva amarilla con aforismo caligráfico y clip dorado', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/aforismo matutino/i)).toBeInTheDocument();
    expect(screen.getByText(/№ 042/i)).toBeInTheDocument();
    expect(screen.getByText(/small steps every day lead to big results/i)).toBeInTheDocument();
    expect(screen.getByText(/tinta ferrogalorresistente/i)).toBeInTheDocument();
  });

  it('despliega la ficha de biorritmo con sello de imprenta en foco y porcentaje', () => {
    render(<LandingHeroCard />);
    expect(screen.getByText(/biorritmo hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/en foco/i)).toBeInTheDocument();
    expect(screen.getByText(/claridad mental/i)).toBeInTheDocument();
    expect(screen.getByText(/88%/i)).toBeInTheDocument();
  });
});
