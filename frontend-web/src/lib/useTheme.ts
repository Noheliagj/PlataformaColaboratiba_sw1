import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, type Theme } from './theme';

/** Estado del tema (oscuro por defecto) sincronizado con <html data-theme> + localStorage. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggle];
}
