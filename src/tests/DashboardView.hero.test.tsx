import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardView } from '../../src/components/DashboardView';
import type { Profile } from '../../src/types';
import fs from 'fs';
import path from 'path';

const mockProfile: Profile = {
  id: 'p-test',
  name: 'Test User',
} as any;

describe('DashboardView critical CSS & Hero Content', () => {
  it('includes inline critical CSS for hero in index.html', () => {
    render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
    const indexPath = path.resolve(__dirname, '../../index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');
    const hasHeroCSS = /\.hero/.test(html) && /\.heroTitle/.test(html);
    expect(hasHeroCSS).toBe(true);
  });

  it('despliega el aforismo motivacional oficial en el hero', () => {
    render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
    expect(screen.getByText(/El orden no es una restricción, es el espacio donde florecen tus ideas y tu calma/i)).toBeInTheDocument();
  });

  it('despliega los 4 accesos instantáneos requeridos en A un solo clic', () => {
    render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
    expect(screen.getByRole('button', { name: /nueva tarea/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nuevo evento/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reflexión/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enlace/i })).toBeInTheDocument();
  });
});
