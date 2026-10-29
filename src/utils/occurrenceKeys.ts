/**
 * Claves de React para listas cuyos elementos no tienen id: el contenido más su número de aparición
 * ("Leer#1", "Leer#2"). A diferencia del índice, borrar un elemento no cambia la clave de los demás.
 */
export const occurrenceKeys = (values: string[]): string[] => {
  const seen = new Map<string, number>();
  return values.map(value => {
    const n = (seen.get(value) ?? 0) + 1;
    seen.set(value, n);
    return `${value}#${n}`;
  });
};
