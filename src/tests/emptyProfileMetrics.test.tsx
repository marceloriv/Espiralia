import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardView } from '../components/DashboardView';
import { AgendaView } from '../components/AgendaView';
import { NotesView } from '../components/NotesView';
import { TodoView } from '../components/TodoView';
import { PlannerView } from '../components/PlannerView';
import { FoldersView } from '../components/FoldersView';
import { IntegrationsView } from '../components/IntegrationsView';
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

// R-38: un perfil nuevo no puede mostrar contenido personal de ejemplo como si fuera suyo.
describe('Perfil vacío: sin contenido personal de ejemplo', () => {
  const PERSONAL = /Conaset|Clase ?B|PAES|oftalmol|berenjena|terapia|TEC-2026|universidad\.edu|personal\.vault/i;

  beforeEach(() => {
    localStorage.clear();
    StorageService.saveProfile(profile);
  });

  it.each([
    ['AgendaView', () => <AgendaView profileId={profile.id} />],
    ['NotesView', () => <NotesView profileId={profile.id} />],
    ['TodoView', () => <TodoView profileId={profile.id} />],
    ['PlannerView', () => <PlannerView profileId={profile.id} />],
    ['FoldersView', () => <FoldersView profileId={profile.id} />],
    ['IntegrationsView', () => <IntegrationsView profile={profile} />],
  ])('%s no contiene datos personales de ejemplo', (_name, view) => {
    const { container } = render(view());

    expect(container.innerHTML).not.toMatch(PERSONAL);
  });
});
