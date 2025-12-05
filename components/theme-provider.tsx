"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "blue" | "pink";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme") as Theme;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;

    setTheme(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove("dark", "blue", "pink");
      if (theme !== "light") {
        root.classList.add(theme);
      }
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const themes: Theme[] = ["light", "dark", "blue", "pink"];

  const toggleTheme = () => {
    setTheme((prev) => themes[(themes.indexOf(prev) + 1) % themes.length]);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Provide default values if context is not available
    return {
      theme: "light" as const,
      toggleTheme: () => {},
    };
  }
  return context;
}
