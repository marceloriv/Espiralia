import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingFolderCards } from '../components/landing/LandingFolderCards';

describe('LandingFolderCards', () => {
  it('renderiza las 3 fichas de archivador con solapas superiores y números monumentales de agua', () => {
    render(<LandingFolderCards />);

    expect(screen.getByRole('heading', { level: 3, name: /1\. estudios & foco práctico/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /2\. introspección & diario/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /3\. horizonte & universidad/i })).toBeInTheDocument();

    expect(screen.getByText(/01 \/ estudios/i)).toBeInTheDocument();
    expect(screen.getByText(/02 \/ diario/i)).toBeInTheDocument();
    expect(screen.getByText(/03 \/ horizonte/i)).toBeInTheDocument();

    expect(screen.getByText('01', { selector: '[data-watermark="01"]' })).toBeInTheDocument();
    expect(screen.getByText('02', { selector: '[data-watermark="02"]' })).toBeInTheDocument();
    expect(screen.getByText('03', { selector: '[data-watermark="03"]' })).toBeInTheDocument();
  });

  it('incluye elementos decorativos de papelería marcados con aria-hidden', () => {
    const { container } = render(<LandingFolderCards />);
    const clips = container.querySelectorAll('[data-papercraft="clip"]');
    const washiTapes = container.querySelectorAll('[data-papercraft="washi-tape"]');

    expect(clips.length).toBeGreaterThan(0);
    expect(washiTapes.length).toBeGreaterThan(0);
    clips.forEach(clip => expect(clip).toHaveAttribute('aria-hidden', 'true'));
    washiTapes.forEach(tape => expect(tape).toHaveAttribute('aria-hidden', 'true'));
  });

  it('despliega las métricas en recuadros estilo ficha técnica de imprenta', () => {
    render(<LandingFolderCards />);
    expect(screen.getByText(/banco oficial conaset • modo cronometrado/i)).toBeInTheDocument();
    expect(screen.getByText(/sin límites de caracteres • privacidad total/i)).toBeInTheDocument();
    expect(screen.getByText(/expediente de postulación y plazos/i)).toBeInTheDocument();
  });
});
