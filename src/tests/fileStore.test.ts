import { describe, it, expect } from 'vitest';
import { MAX_FILE_BYTES, validatePdf, listFiles } from '../services/fileStore';

const pdf = (bytes: number) => new Blob(['%PDF-1.7\n', new Uint8Array(Math.max(0, bytes - 9))], { type: 'application/pdf' });

describe('fileStore.validatePdf (frontera de confianza de la subida)', () => {
  // Técnica: valores límite en el tamaño (0, 10 MB exactos, 10 MB + 1 byte) y partición por contenido (PDF real / disfrazado).
  it.each([
    ['vacío', new Blob([]), 'El archivo está vacío.'],
    ['10 MB exactos', pdf(MAX_FILE_BYTES), null],
    ['10 MB + 1 byte', pdf(MAX_FILE_BYTES + 1), 'El PDF supera el máximo de 10 MB.'],
    ['PDF pequeño', pdf(64), null],
    ['HTML con tipo PDF', new Blob(['<html>hola</html>'], { type: 'application/pdf' }), 'El archivo no es un PDF.'],
  ])('%s', async (_caso, blob, esperado) => {
    expect(await validatePdf(blob)).toBe(esperado);
  });
});

describe('fileStore sin IndexedDB', () => {
  it('rechaza con un mensaje legible en vez de romper la vista', async () => {
    // jsdom no trae IndexedDB: es el mismo caso que un navegador que lo bloquea.
    await expect(listFiles('p-sin-idb')).rejects.toThrow('Este navegador no permite guardar archivos.');
  });
});
