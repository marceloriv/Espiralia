import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { currentTheme, switchTheme } from '../../utils/theme';
import type { Theme } from '../../utils/theme';
import styles from './ThemeToggle.module.css';

/** Conmutador claro/oscuro (DESIGN.md §7.4). El efecto circular nace donde se pulsa. */
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    switchTheme(next, { x: box.left + box.width / 2, y: box.top + box.height / 2 }, () => setTheme(next));
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={handleClick}
      aria-label={next === 'dark' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
    >
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
};
