import { describe, it, expect } from 'vitest';
import { occurrenceKeys } from '../utils/occurrenceKeys';

describe('occurrenceKeys', () => {
  // Técnica: partición de equivalencia (valores únicos, repetidos) y el caso que motiva la función: borrar uno.
  it('da claves únicas aunque el contenido se repita', () => {
    expect(occurrenceKeys(['Leer', 'Correr', 'Leer'])).toEqual(['Leer#1', 'Correr#1', 'Leer#2']);
  });

  it('borrar un elemento no cambia la clave de los demás', () => {
    const antes = occurrenceKeys(['Sin redes', 'Leer', 'Dormir temprano']);
    const despues = occurrenceKeys(['Sin redes', 'Dormir temprano']);
    expect(despues).toEqual([antes[0], antes[2]]);
  });

  it('lista vacía da lista vacía', () => {
    expect(occurrenceKeys([])).toEqual([]);
  });
});
