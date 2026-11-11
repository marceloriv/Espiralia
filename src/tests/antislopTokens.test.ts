import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Antislop UI design tokens contract', () => {
  it('define tokens de elevación y foco en index.css', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    expect(content).toContain('--shadow-sm');
    expect(content).toContain('--shadow-md');
    expect(content).toContain('--shadow-lg');
    expect(content).toContain('--focus-ring');
  });

  it('no contiene archivo huérfano App.css', () => {
    const appCssPath = path.resolve(__dirname, '../App.css');
    expect(fs.existsSync(appCssPath)).toBe(false);
  });

  it('componentes principales consumen tokens de elevación en vez de sombras arbitrarias', () => {
    const modules = [
      '../components/AppLayout.module.css',
      '../components/ProfileGateView.module.css',
      '../components/PlannerView.module.css',
      '../components/TodoView.module.css',
    ];

    for (const relPath of modules) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).not.toMatch(/box-shadow:\s*0\s+\d+px\s+\d+px\s+rgba/);
    }
  });

  it('Esqueleto.module.css respeta prefers-reduced-motion', () => {
    const cssPath = path.resolve(__dirname, '../components/common/Esqueleto.module.css');
    const content = fs.readFileSync(cssPath, 'utf-8');
    expect(content).toContain('prefers-reduced-motion');
  });
});
