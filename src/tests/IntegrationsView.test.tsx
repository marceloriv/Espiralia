import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    StorageService.saveEvent({ id: 'e-atajo', profileId: profile.id, title: 'Evento de prueba', date: '2099-01-01', startTime: '10:00' });
    render(<IntegrationsView profile={profile} />);
    const gCalLinks = screen.getAllByRole('link', { name: /añadir a google/i });
    expect(gCalLinks.length).toBeGreaterThan(0);
    for (const link of gCalLinks) {
      expect(link).toHaveAttribute('href', expect.stringContaining('calendar.google.com/calendar/render?action=TEMPLATE'));
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  it('despliega la sección de correo con un enlace mailto honesto', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByRole('heading', { name: /correo & plantillas/i })).toBeInTheDocument();
    const mailtoLinks = screen.getAllByRole('link', { name: /redactar recordatorio/i });
    expect(mailtoLinks).toHaveLength(1);
    expect(mailtoLinks[0]).toHaveAttribute('href', expect.stringContaining('mailto:'));
  });

  it('ofrece la copia completa en JSON y no inventa historial de auditoría', () => {
    render(<IntegrationsView profile={profile} />);
    expect(screen.getByRole('heading', { name: /copia completa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descargar copia completa \(\.json\)/i })).toBeInTheDocument();
    expect(screen.queryByText(/registro de auditoría local/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hoy, 09:41/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/agenda_2026\.ics/i)).not.toBeInTheDocument();
  });

  it('pone las tarjetas en Papel turquesa y quita ornamentos, índice muerto y controles sin efecto', () => {
    const { container } = render(<IntegrationsView profile={profile} />);

    expect(container.querySelectorAll('[data-tinte="turquesa"]').length).toBe(3);
    for (const ornamento of ['waxSealMedallion', 'grommetRivet', 'topWashiTape', 'botanicalWatermark', 'hankoStamp', 'leftSidebar']) {
      expect(container.querySelector(`[class*="${ornamento}"]`), ornamento).toBeNull();
    }
    expect(screen.queryByRole('navigation', { name: /navegación de integraciones/i })).toBeNull();
    expect(screen.queryByLabelText(/rango temporal/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /auditoría de tráfico/i })).toBeNull();
    expect(screen.queryByText(/zero-cloud/i)).not.toBeInTheDocument();
  });

  it('renderiza la bóveda local con tarjeta rfc 5545, zona drop y tarjetas de correo y copia', () => {
    render(<IntegrationsView profile={profile} />);

    expect(screen.getByRole('heading', { level: 1, name: /integraciones & enlace externo/i })).toBeInTheDocument();
    expect(screen.getByText(/datos solo en este navegador/i)).toBeInTheDocument();
    expect(screen.getByText(/google calendar & ical \(\.ics\)/i)).toBeInTheDocument();
    expect(screen.getByText(/arrastra tu archivo/i)).toBeInTheDocument();
  });

  it('la copia completa descarga el mismo ProfileBackup (version 1) que Bóveda Offline puede restaurar', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    vi.spyOn(URL, 'createObjectURL').mockImplementation((b: Blob | MediaSource) => {
      blobs.push(b as Blob);
      return 'blob:copia';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    StorageService.saveEvent({ id: 'ev-copia', profileId: profile.id, title: 'Hito', date: '2026-10-25' });

    render(<IntegrationsView profile={profile} />);
    await user.click(screen.getByRole('button', { name: /descargar copia completa \(\.json\)/i }));

    const backup = JSON.parse(await blobs[0].text());
    expect(backup.version).toBe(1);
    expect(backup.profile.id).toBe(profile.id);
    expect(backup.events[0].title).toBe('Hito');
    vi.restoreAllMocks();
  });

  it('el borrador de correo no inventa texto', () => {
    render(<IntegrationsView profile={profile} />);
    const link = screen.getByRole('link', { name: /redactar recordatorio/i });
    expect(link.getAttribute('href')).toBe('mailto:?subject=Recordatorio%20de%20Espiralia');
  });
});
