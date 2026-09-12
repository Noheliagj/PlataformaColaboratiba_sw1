export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'ui-theme';

/** El tema oscuro es el predeterminado: sin valor guardado, se asume 'dark'. */
export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Aplica el tema al documento (ver overrides de índice en index.css) y lo persiste. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage no disponible (modo privado, etc.): el tema no persiste entre sesiones.
  }
}
