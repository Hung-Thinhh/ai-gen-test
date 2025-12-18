/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Initialize with default theme to avoid hydration mismatch and SSR errors
    const [theme, setThemeState] = useState<Theme>('dark');

    // Sync from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('duky-ai-theme') as Theme;
            if (stored === 'light' || stored === 'dark') {
                setThemeState(stored);
            }
        }
    }, []);

    useEffect(() => {
        // Remove both theme classes first
        document.documentElement.classList.remove('dark', 'light');
        document.body.classList.remove('dark', 'light');

        // Apply new theme class to both html and body
        document.documentElement.classList.add(theme);
        document.body.classList.add(theme);

        // Save to localStorage
        localStorage.setItem('duky-ai-theme', theme);

        console.log('Theme changed to:', theme); // Debug log
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const toggleTheme = () => {
        setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
