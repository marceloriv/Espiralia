export type IDBStoreName = 'notes' | 'folders' | 'links';

const DB_NAME = 'espiralia_db';
const DB_VERSION = 1;
const STORES: IDBStoreName[] = ['notes', 'folders', 'links'];

// Fallback in-memory map backed by localStorage when available
const fallbackCache: Map<string, Map<string, any>> = new Map();

function getFallbackMap(storeName: string): Map<string, any> {
  if (!fallbackCache.has(storeName)) {
    const map = new Map<string, any>();
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`idb_fallback_${storeName}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && item.id) {
                map.set(item.id, item);
              }
            }
          }
        }
      } catch {
        // Ignorar error de lectura local
      }
    }
    fallbackCache.set(storeName, map);
  }
  return fallbackCache.get(storeName)!;
}

function persistFallback(storeName: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      const map = fallbackCache.get(storeName);
      if (map) {
        const items = Array.from(map.values());
        localStorage.setItem(`idb_fallback_${storeName}`, JSON.stringify(items));
      }
    } catch {
      // Ignorar error de persistencia en fallback
    }
  }
}

export class EspiraliaIDB {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window && !!window.indexedDB;
  }

  private static async getDB(): Promise<IDBDatabase> {
    if (!this.isAvailable()) {
      throw new Error('IndexedDB no disponible en este entorno');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const request = window.indexedDB.open(DB_NAME, DB_VERSION);

          request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            for (const store of STORES) {
              if (!db.objectStoreNames.contains(store)) {
                const objectStore = db.createObjectStore(store, { keyPath: 'id' });
                objectStore.createIndex('profileId', 'profileId', { unique: false });
              }
            }
          };

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            this.dbPromise = null;
            reject(request.error);
          };
        } catch (err) {
          this.dbPromise = null;
          reject(err);
        }
      });
    }

    return this.dbPromise;
  }

  public static async getAll<T>(storeName: IDBStoreName | string, profileId?: string): Promise<T[]> {
    if (!this.isAvailable()) {
      const map = getFallbackMap(storeName);
      const items = Array.from(map.values()) as T[];
      if (profileId) {
        return items.filter((item: any) => item.profileId === profileId);
      }
      return items;
    }

    try {
      const db = await this.getDB();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);

        if (profileId && store.indexNames.contains('profileId')) {
          const index = store.index('profileId');
          const request = index.getAll(profileId);
          request.onsuccess = () => resolve(request.result as T[]);
          request.onerror = () => reject(request.error);
        } else {
          const request = store.getAll();
          request.onsuccess = () => {
            const result = request.result as T[];
            if (profileId) {
              resolve(result.filter((item: any) => item.profileId === profileId));
            } else {
              resolve(result);
            }
          };
          request.onerror = () => reject(request.error);
        }
      });
    } catch {
      // Si falla IDB por restricciones de sandbox o modo incógnito, recurrir a fallback
      const map = getFallbackMap(storeName);
      const items = Array.from(map.values()) as T[];
      if (profileId) {
        return items.filter((item: any) => item.profileId === profileId);
      }
      return items;
    }
  }

  public static async getById<T>(storeName: IDBStoreName | string, id: string): Promise<T | null> {
    if (!this.isAvailable()) {
      const map = getFallbackMap(storeName);
      return (map.get(id) as T) || null;
    }

    try {
      const db = await this.getDB();
      return new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve((request.result as T) || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      const map = getFallbackMap(storeName);
      return (map.get(id) as T) || null;
    }
  }

  public static async put<T extends { id: string; profileId?: string }>(
    storeName: IDBStoreName | string,
    item: T
  ): Promise<void> {
    // Siempre mantener espejo en fallback para coherencia inmediata
    const map = getFallbackMap(storeName);
    map.set(item.id, item);
    persistFallback(storeName);

    if (!this.isAvailable()) {
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // Persistencia ya asegurada en fallback
    }
  }

  public static async delete(storeName: IDBStoreName | string, id: string): Promise<void> {
    const map = getFallbackMap(storeName);
    map.delete(id);
    persistFallback(storeName);

    if (!this.isAvailable()) {
      return;
    }

    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch {
      // Eliminación ya ejecutada en fallback
    }
  }

  public static async clearProfile(profileId: string): Promise<void> {
    for (const store of STORES) {
      const map = getFallbackMap(store);
      for (const [id, item] of Array.from(map.entries())) {
        if (item && item.profileId === profileId) {
          map.delete(id);
        }
      }
      persistFallback(store);
    }

    if (!this.isAvailable()) {
      return;
    }

    try {
      const db = await this.getDB();
      for (const store of STORES) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(store, 'readwrite');
          const objectStore = tx.objectStore(store);
          if (objectStore.indexNames.contains('profileId')) {
            const index = objectStore.index('profileId');
            const request = index.openCursor(IDBKeyRange.only(profileId));
            request.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
              if (cursor) {
                cursor.delete();
                cursor.continue();
              } else {
                resolve();
              }
            };
            request.onerror = () => reject(request.error);
          } else {
            resolve();
          }
        });
      }
    } catch {
      // Ignorar fallo en purga de IDB nativo si falló la conexión
    }
  }
}
