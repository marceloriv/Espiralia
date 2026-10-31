// Aplica el tema elegido antes del primer pintado, para que no parpadee el tema claro al cargar con el oscuro guardado
// (DESIGN.md §7.4). Va como archivo y no en línea porque el CSP de index.html solo admite scripts del mismo origen.
// Sin elección guardada no hace nada: manda la preferencia del sistema (prefers-color-scheme en src/index.css).
try {
  var guardado = localStorage.getItem('espiralia_theme');
  if (guardado === 'dark' || guardado === 'light') {
    document.documentElement.setAttribute('data-theme', guardado);
  }
} catch (e) {
  // localStorage bloqueado: se queda con la preferencia del sistema.
}
