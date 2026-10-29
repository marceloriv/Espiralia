import type { StoredFile } from '../types';

// PDFs de Carpetas en IndexedDB: localStorage admite unos 5 MB y un solo PDF lo llenaría.
// Se importa con import() desde fuera de Carpetas para no sumar peso a la carga inicial.

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_NAME_LENGTH = 200;
const PDF_MAGIC = '%PDF-';

const DB_NAME = 'espiralia_files';
const STORE = 'files';

interface FileRecord extends StoredFile {
  blob: Blob;
}

/** Entrada de un PDF dentro del respaldo de la Bóveda: el contenido va en base64. */
export interface FileBackup extends StoredFile {
  data: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('Este navegador no permite guardar archivos.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE, { keyPath: 'id' }).createIndex('profileId', 'profileId');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error('No se pudo abrir el almacén de archivos.'));
      };
    });
  }
  return dbPromise;
};

/** Ejecuta una operación y resuelve al terminar la transacción, para que una escritura no se dé por hecha antes de tiempo. */
const run = async <T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = op(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request ? request.result : (undefined as T));
    // Sin espacio, el navegador aborta la transacción con QuotaExceededError.
    const fail = () => {
      const error = tx.error ?? request?.error;
      reject(error?.name === 'QuotaExceededError' ? new Error('No queda espacio en el navegador para guardar el PDF.') : error ?? new Error('No se pudo guardar el archivo.'));
    };
    tx.onerror = fail;
    tx.onabort = fail;
  });
};

const newId = () => `file-${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

const cleanName = (name: string) => name.trim().slice(0, MAX_NAME_LENGTH) || 'documento.pdf';

const startsWithPdfMagic = async (blob: Blob): Promise<boolean> => {
  const head = new Uint8Array(await blob.slice(0, PDF_MAGIC.length).arrayBuffer());
  return String.fromCharCode(...head) === PDF_MAGIC;
};

/** Devuelve el motivo por el que el archivo no se puede subir, o null si es un PDF válido. */
export const validatePdf = async (file: Blob): Promise<string | null> => {
  if (file.size === 0) return 'El archivo está vacío.';
  if (file.size > MAX_FILE_BYTES) return 'El PDF supera el máximo de 10 MB.';
  // La extensión y el tipo MIME los decide quien sube el archivo; los primeros bytes no.
  if (!(await startsWithPdfMagic(file))) return 'El archivo no es un PDF.';
  return null;
};

export const listFiles = async (profileId: string): Promise<StoredFile[]> => {
  const records = await run<FileRecord[]>('readonly', store => store.index('profileId').getAll(profileId));
  return records
    .map((r): StoredFile => ({ id: r.id, profileId: r.profileId, folderId: r.folderId, name: r.name, size: r.size, createdAt: r.createdAt }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
};

/** Valida y guarda un PDF; lanza un Error con el motivo legible si no se puede. */
export const addFile = async (profileId: string, folderId: string | undefined, file: File): Promise<StoredFile> => {
  const problem = await validatePdf(file);
  if (problem) throw new Error(problem);
  const meta: StoredFile = { id: newId(), profileId, folderId, name: cleanName(file.name), size: file.size, createdAt: new Date().toISOString() };
  const blob = new Blob([file], { type: 'application/pdf' });
  await run('readwrite', store => store.put({ ...meta, blob }));
  return meta;
};

/** Contenido del PDF, solo si pertenece al perfil (aislamiento por profileId). */
export const getFileBlob = async (profileId: string, id: string): Promise<Blob | null> => {
  const record = await run<FileRecord | undefined>('readonly', store => store.get(id));
  return record && record.profileId === profileId ? record.blob : null;
};

export const deleteFile = async (profileId: string, id: string): Promise<void> => {
  const record = await run<FileRecord | undefined>('readonly', store => store.get(id));
  if (record?.profileId !== profileId) return;
  await run('readwrite', store => store.delete(id));
};

const deleteWhere = async (profileId: string, match: (file: StoredFile) => boolean): Promise<number> => {
  const ids = (await listFiles(profileId)).filter(match).map(f => f.id);
  if (ids.length > 0) await run('readwrite', store => { ids.forEach(id => store.delete(id)); });
  return ids.length;
};

export const deleteFolderFiles = (profileId: string, folderId: string) => deleteWhere(profileId, f => f.folderId === folderId);

export const deleteProfileFiles = (profileId: string) => deleteWhere(profileId, () => true);

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const base64ToBlob = (data: string): Blob => {
  const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
  return new Blob([bytes], { type: 'application/pdf' });
};

export const exportFiles = async (profileId: string): Promise<FileBackup[]> => {
  const records = await run<FileRecord[]>('readonly', store => store.index('profileId').getAll(profileId));
  return Promise.all(records.map(async ({ blob, ...meta }) => ({ ...meta, data: await blobToBase64(blob) })));
};

/**
 * Restaura los PDF de un respaldo en el perfil destino. El respaldo es entrada externa: cada archivo se valida
 * igual que una subida y los inválidos se omiten. Los ids se regeneran para no pisar archivos de otro perfil.
 */
export const importFiles = async (profileId: string, items: unknown, replaceExisting: boolean): Promise<number> => {
  if (replaceExisting) await deleteProfileFiles(profileId);
  if (!Array.isArray(items)) return 0;
  const records: FileRecord[] = [];
  for (const item of items as Partial<FileBackup>[]) {
    if (!item || typeof item.name !== 'string' || typeof item.data !== 'string') continue;
    let blob: Blob;
    try {
      blob = base64ToBlob(item.data);
    } catch {
      continue;
    }
    if (await validatePdf(blob)) continue;
    records.push({
      id: newId(),
      profileId,
      folderId: typeof item.folderId === 'string' ? item.folderId : undefined,
      name: cleanName(item.name),
      size: blob.size,
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      blob,
    });
  }
  if (records.length > 0) await run('readwrite', store => { records.forEach(r => store.put(r)); });
  return records.length;
};
