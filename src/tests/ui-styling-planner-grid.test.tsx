import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Planner Weekly Grid Responsive Polish (H7)', () => {
  it('PlannerView gridArea enforces horizontal scroll and minimum column widths', () => {
    const cssPath = path.resolve(__dirname, '../components/PlannerView.module.css');
    const css = fs.readFileSync(cssPath, 'utf-8');
    expect(css).toMatch(/\.gridArea\s*\{[^}]*overflow-x:\s*auto/);
    expect(css).toMatch(/\.weeklyGrid\s*\{[^}]*min-width:\s*min-content/);

    const colCssPath = path.resolve(__dirname, '../components/planner/PlannerDayColumn.module.css');
    const colCss = fs.readFileSync(colCssPath, 'utf-8');
    expect(colCss).toMatch(/\.dayColumn\s*\{[^}]*min-width:\s*(?:1[3-9]\d)px/);
  });
});
