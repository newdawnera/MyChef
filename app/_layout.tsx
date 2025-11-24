// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Import your custom theme provider
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
// Import the new auth provider
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { RecipeProvider } from "@/contexts/RecipeContext";
import { SavedRecipesProvider } from "@/contexts/SavedRecipesContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Inner component that uses the theme
function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <NavigationThemeProvider
      value={theme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Onboarding Screen: Must hide header */}
        <Stack.Screen
          name="onboarding/index"
          options={{
            headerShown: false, // <-- Ensures no header bar is shown
          }}
        />

        {/* Login/Signup Screen: Must hide header */}
        <Stack.Screen
          name="login/index"
          options={{
            headerShown: false, // <-- Ensures no header bar is shown
          }}
        />
        {/* Preferences Screen: Must hide header */}
        <Stack.Screen
          name="preferences/index"
          options={{
            headerShown: false, // <-- Ensures no header bar is shown
          }}
        />
        {/* Category Screen: Must hide header */}
        <Stack.Screen
          name="categories/index"
          options={{
            headerShown: false, // <-- Ensures no header bar is shown
          }}
        />
        {/* Category Screen: Must hide header */}
        <Stack.Screen
          name="categories/[category]"
          options={{
            headerShown: false, // <-- Ensures no header bar is shown
          }}
        />
        <Stack.Screen
          name="privacy/index"
          options={{
            headerShown: false, // <-- Ensures no header bar is shown
          }}
        />
        <Stack.Screen
          name="recipes/details"
          options={{
            headerShown: false, // <-- Ensures no header bar is shown
          }}
        />
        <Stack.Screen
          name="recipes/suggestions"
          options={{
            headerShown: false, // <-- Ensures no header bar is shown
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
    </NavigationThemeProvider>
  );
}

// Root component that wraps everything
// CORRECT Provider hierarchy:
// SafeArea → GestureHandler → Auth → User → SavedRecipes → Recipe → Theme → Navigation
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* 1. AuthProvider MUST be at the top (other providers need it) */}
        <AuthProvider>
          {/* 2. UserProvider (needs auth) */}
          <UserProvider>
            {/* 3. SavedRecipesProvider (needs auth and user) */}
            <SavedRecipesProvider>
              {/* 4. RecipeProvider */}
              <RecipeProvider>
                {/* 5. ThemeProvider */}
                <ThemeProvider>
                  <RootLayoutNav />
                </ThemeProvider>
              </RecipeProvider>
            </SavedRecipesProvider>
          </UserProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
