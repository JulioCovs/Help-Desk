/**
 * Normaliza datos de hooks/React Query: API o caché pueden devolver no-array.
 * `?? []` solo cubre null/undefined; esto también evita `.filter`/`.map` sobre objetos.
 */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}
