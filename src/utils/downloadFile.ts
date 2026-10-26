/** Descarga `content` como archivo desde el navegador, sin pasar por ningún servidor. */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
