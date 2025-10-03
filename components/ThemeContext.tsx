import React, { createContext, useState, useMemo, useContext } from 'react';

// Define the shape of the context's value
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// Create the context with a default value.
// The default value is only used when a component is not wrapped in the provider.
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light', // default theme
  toggleTheme: () => console.warn('ThemeProvider not found'),
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Provider component that will wrap the application
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Memoize the context value to prevent unnecessary re-renders of consumer components
  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);

  // Apply the theme class to the root element
  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};