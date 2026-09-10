import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  lightTheme,
  darkTheme,
  scaleTypography,
  TEXT_SCALE_FACTORS,
  type Theme,
} from '../styles/theme';
import { usePreferences } from './PreferencesContext';

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { prefs } = usePreferences();
  // Re-renders on OS appearance change, so 'System' tracks it live.
  const systemScheme = useColorScheme();

  const theme = useMemo(() => {
    const resolved =
      prefs.theme === 'System' ? (systemScheme === 'dark' ? 'Dark' : 'Light') : prefs.theme;
    const base = resolved === 'Dark' ? darkTheme : lightTheme;
    const factor = TEXT_SCALE_FACTORS[prefs.textScale] ?? 1;
    // At Medium hand back the exact base object so memoised makeStyles(t)
    // calls see the same reference they do today.
    if (factor === 1) return base;
    return { ...base, ...scaleTypography(factor), textScale: factor };
  }, [prefs.theme, systemScheme, prefs.textScale]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export type { Theme };
