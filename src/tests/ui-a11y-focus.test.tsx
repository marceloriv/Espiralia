import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Focus ring visible — reemplazo de outline:none (WCAG 2.4.7)', () => {
  const filesToCheck = [
    '../components/NotesView.module.css',
    '../components/ProfileGateView.module.css',
    '../components/TodoView.module.css',
    '../components/folders/FolderModal.module.css',
    '../components/notes/NoteModal.module.css',
    '../components/search/GlobalSearchModal.module.css',
    '../components/vault/VaultModal.module.css',
  ];

  it('ninguno de los archivos CSS de componentes contiene "outline: none" sin reemplazo', () => {
    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content, `Archivo ${relPath} no debe contener outline: none`).not.toMatch(/outline:\s*none\s*;/);
    }
  });

  it('los inputs y controles clave declaran focus-visible con outline', () => {
    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content, `Archivo ${relPath} debe contener :focus-visible`).toContain(':focus-visible');
    }
  });
});

// R-32: quitar el outline exige un indicador de foco equivalente (anillo box-shadow u outline propio), no solo un cambio de color de borde.
describe('Todo outline:none tiene un indicador de foco de reemplazo', () => {
  const componentsDir = path.resolve(__dirname, '../components');
  const walkCss = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walkCss(full) : full.endsWith('.module.css') ? [full] : [];
    });

  const parseRules = (css: string) =>
    [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({
      selectors: m[1].split(',').map(s => s.trim()),
      body: m[2],
    }));

  // El \S final evita que \s* retroceda y deje pasar "none" o "0".
  const hasRing = (body: string) => /box-shadow:\s*(?!none)\S/.test(body) || /outline:\s*(?!none|0\b)\S/.test(body);

  it.each(walkCss(componentsDir).map(f => [path.relative(componentsDir, f), f]))('%s', (_rel, file) => {
    const rules = parseRules(fs.readFileSync(file, 'utf-8'));
    const providers = rules.filter(r => hasRing(r.body));
    const offenders: string[] = [];

    for (const rule of rules.filter(r => /outline:\s*(none|0)\s*;?/.test(r.body))) {
      for (const sel of rule.selectors) {
        const isFocusSelector = /:focus/.test(sel);
        const ok = isFocusSelector
          ? hasRing(rule.body)
          : providers.some(p => p.selectors.some(ps => ps === `${sel}:focus-visible` || ps === `${sel}:focus`));
        if (!ok) offenders.push(sel);
      }
    }

    expect(offenders).toEqual([]);
  });
});
