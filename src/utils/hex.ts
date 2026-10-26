export const toHex = (bytes: ArrayBuffer | Uint8Array): string =>
  Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');

export const fromHex = (hex: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array((hex.match(/.{2}/g) ?? []).map(h => Number.parseInt(h, 16)));
