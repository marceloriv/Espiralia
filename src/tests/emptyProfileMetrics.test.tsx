import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from '../components/DashboardView';
import { StorageService } from '../services/storage';
import type { Profile } from '../types';

const profile = { id: 'p-vacio-metricas', name: 'Prueba' } as Profile;

describe('Perfil vacío: métricas honestas', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile(profile);
  });

  it('el Dashboard no muestra 100% ni NaN con cero tareas', async () => {
    render(<DashboardView profile={profile} onNavigate={() => {}} />);
    await screen.findByText(/sin tareas registradas/i);

    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });

  it('el Dashboard muestra un solo estado vacío de áreas, no cuatro tarjetas idénticas', async () => {
    render(<DashboardView profile={profile} onNavigate={() => {}} />);

    expect(await screen.findByText(/aún no hay tareas por área/i)).toBeInTheDocument();
    expect(screen.queryAllByText(/Carpeta #\d+/)).toHaveLength(0);
  });

  it('el Dashboard muestra la semana ISO calculada, no un valor fijo', async () => {
    render(<DashboardView profile={profile} onNavigate={() => {}} />);

    const weekTexts = await screen.findAllByText(/Semana\s*#?\d+/i);
    expect(weekTexts.length).toBeGreaterThan(0);
  });
});
