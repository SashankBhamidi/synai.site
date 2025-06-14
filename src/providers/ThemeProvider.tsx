
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: "dark" | "light";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get the theme from localStorage
    const savedTheme = localStorage.getItem("synthesis-theme") as Theme;
    if (savedTheme && ["dark", "light", "system"].includes(savedTheme)) {
      return savedTheme;
    }
    
    return "system"; // Default to system preference
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Update localStorage
    localStorage.setItem("synthesis-theme", theme);
    
    // Determine the actual theme to apply
    let actualTheme: "dark" | "light" = "dark";
    
    if (theme === "system") {
      // Use system preference
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        actualTheme = "dark";
      } else {
        actualTheme = "light";
      }
    } else {
      actualTheme = theme as "dark" | "light";
    }
    
    setResolvedTheme(actualTheme);
    
    // Apply the theme to the document
    if (actualTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  
  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const actualTheme = e.matches ? "dark" : "light";
      setResolvedTheme(actualTheme);
      
      if (actualTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      if (prevTheme === "light") return "dark";
      if (prevTheme === "dark") return "system";
      return "light";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
