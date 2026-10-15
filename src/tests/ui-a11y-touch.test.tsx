import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Touch targets >= 44px (WCAG 2.5.5 / 2.5.8 & HIG/Material)', () => {
  it('settingsButton y quickActionButton en AppLayout tienen min-height >= 44px', () => {
    const cssPath = path.resolve(__dirname, '../components/AppLayout.module.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    // settingsButton
    const settingsMatch = content.match(/\.settingsButton\s*{[^}]*min-height:\s*(\d+)px/);
    expect(settingsMatch, 'settingsButton debe tener min-height definido').not.toBeNull();
    const settingsHeight = parseInt(settingsMatch![1], 10);
    expect(settingsHeight).toBeGreaterThanOrEqual(44);

    // quickActionButton
    const quickMatch = content.match(/\.quickActionButton\s*{[^}]*min-height:\s*(\d+)px/);
    expect(quickMatch, 'quickActionButton debe tener min-height definido').not.toBeNull();
    const quickHeight = parseInt(quickMatch![1], 10);
    expect(quickHeight).toBeGreaterThanOrEqual(44);
  });

  it('btnCancelDate en TodoView tiene min-width y min-height >= 44px', () => {
    const cssPath = path.resolve(__dirname, '../components/TodoView.module.css');
    const content = fs.readFileSync(cssPath, 'utf-8');

    const widthMatch = content.match(/\.btnCancelDate\s*{[^}]*min-width:\s*(\d+)px/);
    const heightMatch = content.match(/\.btnCancelDate\s*{[^}]*min-height:\s*(\d+)px/);

    expect(widthMatch, 'btnCancelDate debe tener min-width definido').not.toBeNull();
    expect(heightMatch, 'btnCancelDate debe tener min-height definido').not.toBeNull();

    expect(parseInt(widthMatch![1], 10)).toBeGreaterThanOrEqual(44);
    expect(parseInt(heightMatch![1], 10)).toBeGreaterThanOrEqual(44);
  });
});
