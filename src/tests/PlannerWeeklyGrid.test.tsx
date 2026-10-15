import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlannerBlockCard } from '../components/planner/PlannerBlockCard';
import { PlannerDayColumn } from '../components/planner/PlannerDayColumn';
import type { PlannerBlock } from '../types';

describe('PlannerWeeklyGrid components', () => {
  it('renderiza tarjeta de bloque con franja, prioridad y permite alternar completado', async () => {
    const user = userEvent.setup();
    let toggled = false;
    const block: PlannerBlock = {
      id: 'b-1',
      profileId: 'p-1',
      period: 'semanal',
      timeSlot: 'mañana',
      title: 'Lectura matutina',
      priority: 'alta',
      completed: false,
      dayOfWeek: 1,
      time: '07:30',
    };

    render(
      <PlannerBlockCard
        block={block}
        onToggle={() => { toggled = true; }}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('Lectura matutina')).toBeInTheDocument();
    expect(screen.getByText('07:30')).toBeInTheDocument();
    expect(screen.getByText('Alta')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox', { name: /completar lectura matutina/i });
    await user.click(checkbox);
    expect(toggled).toBe(true);
  });

  it('PlannerDayColumn renderiza cabecera del día, contador de bloques y botón de agregar', async () => {
    const user = userEvent.setup();
    let addClicked = false;

    render(
      <PlannerDayColumn
        dayName="Lunes"
        dateLabel="19 Oct"
        blocks={[]}
        onAddBlock={() => { addClicked = true; }}
        onToggleBlock={() => {}}
        onDeleteBlock={() => {}}
      />
    );

    expect(screen.getByText('Lunes')).toBeInTheDocument();
    expect(screen.getByText('19 Oct')).toBeInTheDocument();
    expect(screen.getByText('0 Bloques')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /agregar bloque lunes/i });
    await user.click(addBtn);
    expect(addClicked).toBe(true);
  });
});
