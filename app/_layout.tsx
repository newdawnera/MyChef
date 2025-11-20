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
        {/* Prefernces Screen: Must hide header */}
        <Stack.Screen
          name="preferences/index"
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
// Provider hierarchy: SafeArea → GestureHandler → Auth → Theme → Navigation
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          {/* 2. Wrap the app in UserProvider here */}
          <UserProvider>
            <ThemeProvider>
              <RootLayoutNav />
            </ThemeProvider>
          </UserProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
