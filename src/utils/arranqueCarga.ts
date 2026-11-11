// Estado de la ventana de carga de arranque (DESIGN.md §7.8). La primera espera tras abrir la app o tras cambiar de perfil
// se cubre con la ventana a pantalla completa; las siguientes esperas, dentro de la app, usan el esqueleto de la vista.
let pendiente = true;

export const esArranque = (): boolean => pendiente;
export const terminarArranque = (): void => {
  pendiente = false;
};
export const reiniciarArranque = (): void => {
  pendiente = true;
};
