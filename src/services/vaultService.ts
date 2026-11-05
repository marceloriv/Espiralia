import type { Profile } from '../types';
import { StorageService } from './storage';
import type { ProfileBackup } from './vaultCrypto';

export class VaultService {
  /** Nombre del archivo de respaldo: `espiralia-<nombre>-<fecha>.<ext>`; la bóveda del cuaderno importa el mismo formato. */
  public static backupFilename(profileName: string, ext: 'json' | 'vault'): string {
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = profileName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `espiralia-${safeName}-${dateStr}.${ext}`;
  }

  /**
   * Exporta todos los datos asociados al profileId en un ProfileBackup estandarizado.
   */
  public static exportProfile(profileId: string): ProfileBackup {
    const profiles = StorageService.getProfiles();
    const profile = profiles.find((p) => p.id === profileId) || {
      id: profileId,
      name: 'Perfil Espiralia',
      avatar: 'E',
      createdAt: new Date().toISOString(),
    };

    return {
      version: 1,
      createdAt: new Date().toISOString(),
      profile,
      events: StorageService.getEvents(profileId),
      planner: StorageService.getPlanner(profileId),
      goals: StorageService.getGoals(profileId),
      todos: StorageService.getTodos(profileId),
      areas: StorageService.getAreas(profileId),
      notes: StorageService.getNotes(profileId),
      folders: StorageService.getFolders(profileId),
      links: StorageService.getLinks(profileId),
      // Hábitos tal como están guardados: con su semana y sus marcas, sin la vista de la semana en curso.
      habits: StorageService.getDomain(profileId, 'habits', []),
      distractions: StorageService.getDistractions(profileId),
      dailyEnergy: StorageService.getDomain(profileId, 'daily_energy', {}),
      moods: StorageService.getMoods(profileId),
      dailyFocus: StorageService.getDomain(profileId, 'daily_focus', {}),
    };
  }

  /** exportProfile más los PDF de Carpetas, que viven en IndexedDB y se leen de forma asíncrona. */
  public static async exportProfileWithFiles(profileId: string): Promise<ProfileBackup> {
    const { exportFiles } = await import('./fileStore');
    return { ...this.exportProfile(profileId), files: await exportFiles(profileId) };
  }

  /** Restaura los PDF del respaldo en el perfil ya restaurado; en sobrescritura reemplaza los que tenía. Devuelve cuántos guardó. */
  public static async restoreFiles(backup: ProfileBackup, profileId: string, mode: 'overwrite' | 'new_profile'): Promise<number> {
    const { importFiles } = await import('./fileStore');
    return importFiles(profileId, backup.files, mode === 'overwrite');
  }

  /**
   * Valida estrictamente que el objeto recibido cumpla con el esquema ProfileBackup.
   */
  public static validateBackup(data: unknown): data is ProfileBackup {
    if (!data || typeof data !== 'object') return false;
    const candidate = data as Record<string, unknown>;

    if (candidate.version !== 1) return false;
    if (typeof candidate.createdAt !== 'string') return false;

    if (!candidate.profile || typeof candidate.profile !== 'object') return false;
    const profile = candidate.profile as Record<string, unknown>;
    if (typeof profile.id !== 'string' || typeof profile.name !== 'string') return false;

    if (!Array.isArray(candidate.events)) return false;
    if (!Array.isArray(candidate.planner)) return false;
    if (!Array.isArray(candidate.goals)) return false;
    if (!Array.isArray(candidate.todos)) return false;
    if (!Array.isArray(candidate.areas)) return false;
    if (!Array.isArray(candidate.notes)) return false;
    if (!Array.isArray(candidate.folders)) return false;
    if (!Array.isArray(candidate.links)) return false;
    if (candidate.files !== undefined && !Array.isArray(candidate.files)) return false;
    for (const lista of ['habits', 'distractions', 'moods']) {
      if (candidate[lista] !== undefined && !Array.isArray(candidate[lista])) return false;
    }
    for (const mapa of ['dailyEnergy', 'dailyFocus']) {
      const valor = candidate[mapa];
      if (valor !== undefined && (typeof valor !== 'object' || valor === null || Array.isArray(valor))) return false;
    }

    return true;
  }

  /**
   * Restaura un ProfileBackup en el almacenamiento local.
   * - overwrite: reemplaza los datos del profileId destino (o del backup) manteniendo el id.
   * - new_profile: genera un nuevo profileId y clona los datos aisladamente.
   */
  public static restoreProfile(
    backup: ProfileBackup,
    mode: 'overwrite' | 'new_profile',
    targetProfileId?: string
  ): { profile: Profile; counts: Record<string, number> } {
    if (!this.validateBackup(backup)) {
      throw new Error('El archivo de respaldo no tiene un formato válido');
    }

    const destProfileId =
      mode === 'new_profile'
        ? `p-${Date.now()}`
        : targetProfileId || backup.profile.id;

    const restoredProfile: Profile = {
      ...backup.profile,
      id: destProfileId,
      createdAt: mode === 'new_profile' ? new Date().toISOString() : backup.profile.createdAt,
    };

    StorageService.saveProfile(restoredProfile);

    // Cada colección del respaldo reemplaza la del perfil destino. Las que un respaldo antiguo no trae no se tocan.
    const conPerfil = <T extends { profileId: string }>(items: T[]): T[] =>
      items.map((item) => ({ ...item, profileId: destProfileId }));
    const dominios: Array<[string, unknown]> = [
      ['events', conPerfil(backup.events)],
      ['planner', conPerfil(backup.planner)],
      ['goals', conPerfil(backup.goals)],
      ['todos', conPerfil(backup.todos)],
      ['areas', conPerfil(backup.areas)],
      ['notes', conPerfil(backup.notes)],
      ['folders', conPerfil(backup.folders)],
      ['links', conPerfil(backup.links)],
    ];
    if (backup.habits) dominios.push(['habits', conPerfil(backup.habits)]);
    if (backup.moods) dominios.push(['moods', conPerfil(backup.moods)]);
    if (backup.distractions) dominios.push(['distractions', backup.distractions]);
    if (backup.dailyEnergy) dominios.push(['daily_energy', backup.dailyEnergy]);
    if (backup.dailyFocus) dominios.push(['daily_focus', backup.dailyFocus]);
    for (const [dominio, valor] of dominios) {
      StorageService.replaceDomain(destProfileId, dominio, valor);
    }

    return {
      profile: restoredProfile,
      counts: {
        events: backup.events.length,
        planner: backup.planner.length,
        goals: backup.goals.length,
        todos: backup.todos.length,
        areas: backup.areas.length,
        notes: backup.notes.length,
        folders: backup.folders.length,
        links: backup.links.length,
      },
    };
  }
}
