// Texto negro o blanco, el que más contrasta con un fondo `#rrggbb` (luminancia relativa de WCAG). Con cualquier
// color uno de los dos llega al menos a 4.58:1. Negro y no la tinta del sistema (#141413): sobre el salvia
// #5a826d de la paleta de carpetas, ni la tinta (4.26:1) ni el blanco (4.33:1) llegan a 4.5:1.
export const textOnColor = (hex: string): '#000000' | '#ffffff' => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? '#ffffff' : '#000000';
};
