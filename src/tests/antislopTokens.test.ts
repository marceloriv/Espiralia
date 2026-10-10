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
});
