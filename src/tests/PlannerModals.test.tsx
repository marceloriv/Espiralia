import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlannerBlockModal } from '../components/planner/PlannerBlockModal';

describe('PlannerBlockModal', () => {
  it('permite crear un bloque para un día específico con franja y prioridad', async () => {
    const user = userEvent.setup();
    const handleSave = vi.fn();

    render(
      <PlannerBlockModal
        isOpen={true}
        initialDay={2} // Martes
        onClose={() => {}}
        onSave={handleSave}
      />
    );

    const titleInput = screen.getByLabelText(/título del bloque/i);
    await user.type(titleInput, 'Estudio de Conducción');

    const timeInput = screen.getByLabelText(/hora \(opcional\)/i);
    await user.type(timeInput, '10:00');

    const submitBtn = screen.getByRole('button', { name: /guardar bloque/i });
    await user.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Estudio de Conducción',
        dayOfWeek: 2,
        time: '10:00',
      })
    );
  });
});
