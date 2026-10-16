import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DashboardView } from '../../src/components/DashboardView';
import type { Profile } from '../../src/types';
import fs from 'fs';
import path from 'path';

const mockProfile: Profile = {
  id: 'p-test',
  name: 'Test User',
} as any;

describe('DashboardView critical CSS', () => {
  it('includes inline critical CSS for hero in index.html', () => {
    render(<DashboardView profile={mockProfile} onNavigate={() => {}} />);
    const indexPath = path.resolve(__dirname, '../../index.html');
    const html = fs.readFileSync(indexPath, 'utf-8');
    const hasHeroCSS = /\.hero/.test(html) && /\.heroTitle/.test(html);
    expect(hasHeroCSS).toBe(true);
  });
});
