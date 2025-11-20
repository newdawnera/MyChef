// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: "light" | "dark";
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
}

interface ThemeColors {
  primary: string;
  background: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  success: string;
  error: string;
  warning: string;
  shadow: string;
}

const lightColors: ThemeColors = {
  primary: "#70AD47",
  background: "#F8F9FA",
  cardBg: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  border: "#E5E7EB",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  shadow: "#000000",
};

const darkColors: ThemeColors = {
  primary: "#70AD47",
  background: "#121212",
  cardBg: "#1E1E1E",
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textTertiary: "#808080",
  border: "#2A2A2A",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  shadow: "#000000",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedMode &&
        (savedMode === "light" ||
          savedMode === "dark" ||
          savedMode === "system")
      ) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  // Determine the actual theme based on mode and system preference
  const theme: "light" | "dark" =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const colors = theme === "dark" ? darkColors : lightColors;

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, colors }}>
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
