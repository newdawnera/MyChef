// app/index.tsx
/**
 * Auth Router / Splash Screen with Session Management
 *
 * This is the entry point of the app. It checks the user's authentication state
 * and redirects them to the appropriate screen:
 * - Authenticated users with valid session → (tabs) (main app)
 * - Authenticated users with expired session → logout and redirect to onboarding
 * - New/unauthenticated users → onboarding
 *
 * ENHANCED WITH APP STATE MONITORING:
 * - Tracks when app moves to foreground/background
 * - Updates activity timestamp when app becomes active
 * - Ensures session timeout is checked on every app launch
 *
 * This pattern ensures protected routes and a smooth onboarding experience
 * while maintaining security through session management.
 */

import { useEffect, useRef } from "react";
import {
  View,
  ActivityIndicator,
  Text,
  AppState,
  AppStateStatus,
} from "react-native";
import { useRouter, SplashScreen } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { SessionManager } from "@/lib/sessionManager";
import { ChefHat } from "lucide-react-native";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const { user, initialising, updateActivity } = useAuth();
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  /**
   * Monitor app state changes (foreground/background)
   *
   * Updates activity timestamp when app becomes active.
   * This ensures the session timeout is reset whenever the user opens the app.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState: AppStateStatus) => {
        // App has come to foreground
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("App has come to the foreground");

          // Update activity timestamp if user is logged in
          if (user) {
            await updateActivity();

            // Optional: Check if session is still valid
            const sessionValid = await SessionManager.isSessionValid();
            if (!sessionValid) {
              console.log("Session expired while app was in background");
              // The AuthContext will handle the logout automatically
              // Just need to trigger a re-check
              router.replace("/onboarding");
            }
          }
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [user, updateActivity, router]);

  /**
   * Handle initial auth state and routing
   */
  useEffect(() => {
    // Wait for auth state to be determined
    if (initialising) {
      return;
    }

    // Hide the native splash screen once we know the auth state
    SplashScreen.hideAsync();

    // Redirect based on auth state
    if (user) {
      // User is authenticated → go to main app
      router.replace("/(tabs)");
    } else {
      // User is not authenticated → go to onboarding
      router.replace("/onboarding");
    }
  }, [user, initialising, router]);

  // Show a nice loading screen while checking auth state
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F8F9FA",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* App Logo */}
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <ChefHat size={40} color="#4CAF50" strokeWidth={1.5} />
      </View>

      {/* App Name */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: "700",
          color: "#1A1A1A",
          marginBottom: 32,
        }}
      >
        MyChef
      </Text>

      {/* Loading Indicator */}
      <ActivityIndicator size="large" color="#4CAF50" />

      <Text
        style={{
          marginTop: 16,
          fontSize: 14,
          color: "#6B7280",
        }}
      >
        {initialising ? "Checking session..." : "Loading..."}
      </Text>
    </View>
  );
}
