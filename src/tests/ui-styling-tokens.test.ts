import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Token Normalization (H2, H5)', () => {
  it('declares alias tokens in src/index.css :root', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const css = fs.readFileSync(cssPath, 'utf-8');

    expect(css).toMatch(/--font-headline:\s*var\(--font-primary\);/);
    expect(css).toMatch(/--color-accent:\s*var\(--color-primary\);/);
    expect(css).toMatch(/--color-ink-muted:\s*var\(--color-muted\);/);
    expect(css).toMatch(/--color-surface:\s*var\(--color-surface-soft\);/);
  });
});
