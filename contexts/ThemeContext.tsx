import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

export type Theme = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  primary: string;
  secondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  premium: string;
};

const lightTheme: ThemeColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F0F0',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  primary: '#E63946',
  secondary: '#2A7DE1',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FFD700',
  error: '#FF6B6B',
  premium: '#FFD700',
};

const darkTheme: ThemeColors = {
  background: '#1A1A1A',
  surface: '#2A2A2A',
  surfaceSecondary: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',
  primary: '#E63946',
  secondary: '#2A7DE1',
  border: '#333333',
  success: '#4CAF50',
  warning: '#FFD700',
  error: '#FF6B6B',
  premium: '#FFD700',
};

type ThemeContextType = {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@armwrestling_theme';

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(key, value);
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await storage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await storage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors = theme === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
