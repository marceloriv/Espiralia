import { describe, it, expect } from 'vitest';
import { Chart as ChartJS } from 'chart.js';
import { ensureChartRegistered } from '../components/charts/chartSetup';

describe('chartSetup', () => {
  it('registra los controladores y elementos necesarios de Chart.js', () => {
    ensureChartRegistered();
    const registry = ChartJS.registry;
    expect(registry.getController('doughnut')).toBeDefined();
    expect(registry.getController('bar')).toBeDefined();
    expect(registry.getElement('arc')).toBeDefined();
    expect(registry.getElement('bar')).toBeDefined();
  });
});
