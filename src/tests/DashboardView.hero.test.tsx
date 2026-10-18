import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  describe('Hábitos dinámicos en DashboardView', () => {
    it('renderiza los hábitos reales del perfil y permite alternar días', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);
      StorageService.saveHabit({
        id: 'h-real-1',
        profileId: mockProfile.id,
        name: 'Ejercicio diario 30 min',
        category: 'Salud',
        daysCompleted: [false, false, false, false, false, false, false],
      });

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      expect(screen.getByText('Ejercicio diario 30 min')).toBeInTheDocument();
      expect(screen.queryByText('Test CONASET')).not.toBeInTheDocument();

      const dayButton = screen.getByRole('button', { name: /Marcar L para Ejercicio diario 30 min/i });
      await user.click(dayButton);

      expect(StorageService.getHabits(mockProfile.id)[0].daysCompleted[0]).toBe(true);
    });

    it('abre HabitModal al pulsar + Hábito', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const { StorageService } = await import('../../src/services/storage');
      const user = userEvent.setup();
      localStorage.clear();
      StorageService.saveProfile(mockProfile);

      render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
      const addHabitBtn = screen.getByRole('button', { name: /añadir nuevo hábito/i });
      await user.click(addHabitBtn);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
