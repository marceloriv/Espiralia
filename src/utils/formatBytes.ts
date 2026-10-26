/** Tamaño legible: KB redondeado por debajo de 1 MB, MB con un decimal desde 1 MB. */
export const formatBytes = (bytes: number): string => {
  const MB = 1024 * 1024;
  return bytes >= MB ? `${(bytes / MB).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
};
