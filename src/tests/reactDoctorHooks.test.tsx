import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import type { Profile } from '../types';

const initialProfile: Profile = {
  id: 'p-1',
  name: 'Original',
  avatar: 'O',
  createdAt: new Date().toISOString(),
};

const updatedProfile: Profile = {
  ...initialProfile,
  name: 'Modificado',
  avatar: 'M',
};

describe('AppLayout — prop mirroring fix', () => {
  it('actualiza el nombre renderizado cuando cambia la prop profile sin desfase de effect', () => {
    const { rerender } = render(
      <MemoryRouter>
        <AppLayout
          profile={initialProfile}
          currentView="dashboard"
          onViewChange={() => {}}
          onLockProfile={() => {}}
        >
          <div />
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Original')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <AppLayout
          profile={updatedProfile}
          currentView="dashboard"
          onViewChange={() => {}}
          onLockProfile={() => {}}
        >
          <div />
        </AppLayout>
      </MemoryRouter>
    );

    expect(screen.getByText('Modificado')).toBeInTheDocument();
  });
});
