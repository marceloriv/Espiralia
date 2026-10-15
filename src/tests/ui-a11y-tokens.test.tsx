import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('CSS tokens — variables definidas en :root (index.css)', () => {
  const indexPath = path.resolve(__dirname, '../index.css');
  const indexCss = fs.readFileSync(indexPath, 'utf-8');

  it('--color-surface está definido en index.css', () => {
    expect(indexCss).toMatch(/--color-surface:\s*[^;]+;/);
  });

  it('--elevation-lg está definido en index.css', () => {
    expect(indexCss).toMatch(/--elevation-lg:\s*[^;]+;/);
  });

  it('--text-heading-sm está definido en index.css', () => {
    expect(indexCss).toMatch(/--text-heading-sm:\s*[^;]+;/);
  });

  it('QuickActionModal no referencia tokens huérfanos sin fallback', () => {
    const qamPath = path.resolve(__dirname, '../components/quickAction/QuickActionModal.module.css');
    const qamCss = fs.readFileSync(qamPath, 'utf-8');
    expect(qamCss).not.toContain('var(--elevation-lg)');
    expect(qamCss).not.toContain('var(--text-heading-sm)');
  });

  it('ProfileSettingsModal no referencia tokens huérfanos sin fallback', () => {
    const psmPath = path.resolve(__dirname, '../components/profile/ProfileSettingsModal.module.css');
    const psmCss = fs.readFileSync(psmPath, 'utf-8');
    expect(psmCss).not.toContain('var(--elevation-lg)');
    expect(psmCss).not.toContain('var(--text-heading-sm)');
  });
});
