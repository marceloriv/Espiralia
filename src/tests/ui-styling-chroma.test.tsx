import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Chroma & Elevation Harmonization (H1, H6)', () => {
  it('NotesView uses primary brand color and design token shadows', () => {
    const cssPath = path.resolve(__dirname, '../components/NotesView.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.btnAdd\s*\{[^}]*background:\s*var\(--color-primary\)/);
    expect(css).toMatch(/\.card\s*\{[^}]*box-shadow:\s*var\(--shadow-sm\)/);
  });

  it('FoldersView uses primary brand color on add buttons', () => {
    const cssPath = path.resolve(__dirname, '../components/FoldersView.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.btnAdd\s*\{[^}]*background:\s*var\(--color-primary\)/);
  });

  it('VaultModal uses shadow-lg design token and primary brand color', () => {
    const cssPath = path.resolve(__dirname, '../components/vault/VaultModal.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.modalBox\s*\{[^}]*box-shadow:\s*var\(--shadow-lg\)/);
    // El relleno primario ya no se declara aquí: lo da el primitivo btnPrimario de common/Dialogo.module.css.
    expect(css).toMatch(/\.btnPrimary\s*\{[^}]*composes:\s*btnPrimario/);
    const primitivo = fs.readFileSync(path.resolve(__dirname, '../components/common/Dialogo.module.css'), 'utf-8');
    expect(primitivo).toMatch(/\.btnPrimario\s*\{[^}]*background:\s*var\(--color-primary\)/);
  });
});
