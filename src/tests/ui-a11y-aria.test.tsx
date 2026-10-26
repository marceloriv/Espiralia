import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoView } from '../components/TodoView';

describe('TodoView — color picker de área (WCAG 4.1.2)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('cada botón de color tiene el atributo aria-pressed', async () => {
    const user = userEvent.setup();
    render(<TodoView profileId="p-test" />);

    const addAreaBtn = screen.getByRole('button', { name: /crear área/i });
    await user.click(addAreaBtn);

    const colorBtns = screen.getAllByRole('button', { name: /color #/i });
    expect(colorBtns.length).toBeGreaterThan(0);
    colorBtns.forEach(btn => {
      expect(btn).toHaveAttribute('aria-pressed');
    });
  });

  it('al seleccionar un color, aria-pressed cambia a true solo en ese botón', async () => {
    const user = userEvent.setup();
    render(<TodoView profileId="p-test" />);

    const addAreaBtn = screen.getByRole('button', { name: /crear área/i });
    await user.click(addAreaBtn);

    const colorBtns = screen.getAllByRole('button', { name: /color #/i });
    // Por defecto el primer color está activo
    expect(colorBtns[0]).toHaveAttribute('aria-pressed', 'true');
    expect(colorBtns[1]).toHaveAttribute('aria-pressed', 'false');

    // Clic en el segundo color
    await user.click(colorBtns[1]);

    expect(colorBtns[1]).toHaveAttribute('aria-pressed', 'true');
    expect(colorBtns[0]).toHaveAttribute('aria-pressed', 'false');
  });
});

import { AppLayout } from '../components/AppLayout';
import { MemoryRouter } from 'react-router-dom';
import fs from 'node:fs';
import path from 'node:path';

const mockProfile = { id: 'p-test', name: 'Test', avatar: 'T', createdAt: new Date().toISOString() };

describe('AppLayout — jerarquía de headings y mejoras de accesibilidad', () => {
  it('el título de la vista activa es un h2 (WCAG 1.3.1)', () => {
    render(
      <MemoryRouter>
        <AppLayout
          profile={mockProfile}
          currentView="dashboard"
          onViewChange={() => {}}
          onLockProfile={() => {}}
        >
          <div />
        </AppLayout>
      </MemoryRouter>
    );
    const h2 = screen.getByRole('heading', { level: 2, name: /dashboard/i });
    expect(h2).toBeInTheDocument();
  });

  it('html tiene scroll-behavior: smooth en index.css', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');
    expect(content).toMatch(/html\s*{[^}]*scroll-behavior:\s*smooth;/);
  });

  it('searchShortcut kbd tiene font-size >= 12px en AppLayout.module.css', () => {
    const cssPath = path.resolve(__dirname, '../components/AppLayout.module.css');
    const content = fs.readFileSync(cssPath, 'utf-8');
    const match = content.match(/\.searchShortcut\s*{[^}]*font-size:\s*(\d+)px/);
    expect(match).not.toBeNull();
    expect(parseInt(match![1], 10)).toBeGreaterThanOrEqual(12);
  });
});

