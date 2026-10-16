import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Focus ring visible — reemplazo de outline:none (WCAG 2.4.7)', () => {
  const filesToCheck = [
    '../components/NotesView.module.css',
    '../components/ProfileGateView.module.css',
    '../components/TodoView.module.css',
    '../components/folders/FolderModal.module.css',
    '../components/notes/NoteModal.module.css',
    '../components/search/GlobalSearchModal.module.css',
    '../components/vault/VaultModal.module.css',
  ];

  it('ninguno de los archivos CSS de componentes contiene "outline: none" sin reemplazo', () => {
    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content, `Archivo ${relPath} no debe contener outline: none`).not.toMatch(/outline:\s*none\s*;/);
    }
  });

  it('los inputs y controles clave declaran focus-visible con outline', () => {
    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content, `Archivo ${relPath} debe contener :focus-visible`).toContain(':focus-visible');
    }
  });
});
