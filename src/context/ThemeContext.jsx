import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // Default to dark
    });

    useEffect(() => {
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');

        // Apply theme class to document root
        if (isDarkTheme) {
            document.documentElement.classList.remove('light-theme');
            document.documentElement.classList.add('dark-theme');
        } else {
            document.documentElement.classList.remove('dark-theme');
            document.documentElement.classList.add('light-theme');
        }

        // Update body styles for immediate visual feedback
        document.body.style.background = isDarkTheme ? '#000000' : '#ffffff';
        document.body.style.color = isDarkTheme ? '#ffffff' : '#000000';

        // Update all elements with dark backgrounds
        const darkElements = document.querySelectorAll('[style*="background"]');
        darkElements.forEach(el => {
            const currentBg = el.style.background;
            if (currentBg.includes('#000000') || currentBg.includes('rgb(0, 0, 0)')) {
                el.style.background = isDarkTheme ? '#000000' : '#ffffff';
            }
            if (currentBg.includes('rgba(26, 26, 26')) {
                el.style.background = isDarkTheme ? 'rgba(26, 26, 26, 0.95)' : 'rgba(240, 240, 240, 0.95)';
            }
        });
    }, [isDarkTheme]);

    const toggleTheme = () => {
        setIsDarkTheme(prev => !prev);
    };

    const theme = {
        isDark: isDarkTheme,
        colors: {
            background: isDarkTheme ? '#000000' : '#ffffff',
            cardBackground: isDarkTheme ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            text: isDarkTheme ? '#ffffff' : '#000000',
            textSecondary: isDarkTheme ? '#a3a3a3' : '#666666',
            border: isDarkTheme ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)',
            accent: '#10b981',
            accentGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDarkTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
