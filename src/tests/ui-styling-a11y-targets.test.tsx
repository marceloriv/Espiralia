import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Ergonomics and Touch Targets (H3, H4)', () => {
  it('VaultModal close button has min 44x44px touch target', () => {
    const cssPath = path.resolve(__dirname, '../components/vault/VaultModal.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.closeBtn\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.closeBtn\s*\{[^}]*min-width:\s*44px/);
  });

  it('DashboardView areaActionBtn has min-height 44px', () => {
    const cssPath = path.resolve(__dirname, '../components/DashboardView.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.areaActionBtn\s*\{[^}]*min-height:\s*44px/);
  });

  it('AppLayout quickActionButton hover state uses high contrast primary fill', () => {
    const cssPath = path.resolve(__dirname, '../components/AppLayout.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.quickActionButton:hover\s*\{[^}]*color:\s*var\(--color-on-primary\)/);
  });
});
