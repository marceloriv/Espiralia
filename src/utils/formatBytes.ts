/** Tamaño legible: KB redondeado por debajo de 1 MB (mínimo 1 KB si no está vacío), MB con un decimal desde 1 MB. */
export const formatBytes = (bytes: number): string => {
  const MB = 1024 * 1024;
  // Un PDF de pocos bytes no debe leerse como "0 KB", que parece un archivo vacío.
  return bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${bytes > 0 ? Math.max(1, Math.round(bytes / 1024)) : 0} KB`;
};
