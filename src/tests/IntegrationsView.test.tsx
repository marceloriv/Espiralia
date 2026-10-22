import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IntegrationsView } from '../components/IntegrationsView';
import { StorageService } from '../services/storage';
import type { Profile } from '../types';

describe('IntegrationsView (Stitch screen)', () => {
  const profile: Profile = {
    id: 'p-int-1',
    name: 'Carolina',
    avatar: 'C',
    createdAt: '2026-10-10',
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza la cabecera editorial de Stitch y el banner de privacidad 100% client-side', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByRole('heading', { level: 1, name: /integraciones & enlace externo/i })).toBeInTheDocument();
    expect(screen.getByText(/módulo descentralizado/i)).toBeInTheDocument();
    expect(screen.getByText(/datos solo en este navegador/i)).toBeInTheDocument();
  });

  it('despliega las 3 opciones de la tarjeta Google Calendar & iCal (.ics)', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByText(/generar archivo de exportación/i)).toBeInTheDocument();
    expect(screen.getByText(/importar eventos hacia bóveda local/i)).toBeInTheDocument();
    expect(screen.getByText(/atajos directos "a un solo clic"/i)).toBeInTheDocument();
  });

  it('genera enlace seguro de descarga para archivo .ics', async () => {
    StorageService.saveEvent({
      id: 'ev-test',
      profileId: profile.id,
      title: 'Hito de prueba',
      date: '2026-10-25',
      category: 'estudio',
    });

    render(<IntegrationsView profile={profile} />);
    const downloadBtn = screen.getByRole('button', { name: /descargar archivo \.ics/i });
    expect(downloadBtn).toBeInTheDocument();
  });

  it('despliega atajos directos a Google Calendar Web con action=TEMPLATE seguros', () => {
    render(<IntegrationsView profile={profile} />);
    const gCalLinks = screen.getAllByRole('link', { name: /añadir a google/i });
    expect(gCalLinks.length).toBeGreaterThan(0);
    for (const link of gCalLinks) {
      expect(link).toHaveAttribute('href', expect.stringContaining('calendar.google.com/calendar/render?action=TEMPLATE'));
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  it('despliega la sección de Gmail & Plantillas con enlaces mailto precompilados', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByRole('heading', { name: /gmail & plantillas/i })).toBeInTheDocument();
    const mailtoLinks = screen.getAllByRole('link', { name: /abrir borrador en gmail|enviar recordatorio/i });
    expect(mailtoLinks.length).toBeGreaterThanOrEqual(2);
    expect(mailtoLinks[0]).toHaveAttribute('href', expect.stringContaining('mailto:'));
  });

  it('despliega la tarjeta de auditoría local con el estado del almacenamiento', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByRole('heading', { name: /registro de auditoría local/i })).toBeInTheDocument();
    expect(screen.getByText(/historial de sincronización en este navegador/i)).toBeInTheDocument();
  });

  it('renderiza la bóveda local con sello archivado, tarjeta rfc 5545, zona drop, plantillas gmail y auditoria', () => {
    render(<IntegrationsView profile={profile} />);

    expect(screen.getByRole('heading', { level: 1, name: /integraciones & enlace externo/i })).toBeInTheDocument();
    expect(screen.getByText(/archivado localmente/i)).toBeInTheDocument();
    expect(screen.getByText(/datos solo en este navegador/i)).toBeInTheDocument();
    expect(screen.getByText(/google calendar & ical \(\.ics\)/i)).toBeInTheDocument();
    expect(screen.getByText(/arrastra tu archivo/i)).toBeInTheDocument();
    expect(screen.getAllByText(/gmail & plantillas/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/registro de auditoría local/i)).toBeInTheDocument();
  });

  it('incluye medallón de sello de lacre rojo y ojales metálicos de archivo', () => {
    const { container } = render(<IntegrationsView profile={profile} />);

    const waxSeal = container.querySelector('[class*="waxSealMedallion"]');
    expect(waxSeal).toBeInTheDocument();
    expect(waxSeal).toHaveAttribute('aria-hidden', 'true');
    expect(waxSeal).toHaveTextContent('E');

    const grommets = container.querySelectorAll('[class*="grommetRivet"]');
    expect(grommets.length).toBeGreaterThanOrEqual(2);
    grommets.forEach(grommet => {
      expect(grommet).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
