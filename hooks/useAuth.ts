/**
 * useAuth Hook
 *
 * A convenience hook to access the authentication context.
 * Provides type-safe access to auth state and methods.
 *
 * USAGE:
 * ```
 * const { user, signInWithEmail, signOutUser } = useAuth();
 *
 * if (user) {
 *   // User is authenticated
 * }
 * ```
 *
 * This hook will throw an error if used outside of AuthProvider,
 * which helps catch mistakes during development.
 */

import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export function useAuth() {
  const context = useContext(AuthContext);

  // Check if the hook is being used within AuthProvider
  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider. " +
        "Make sure your component is wrapped with <AuthProvider>."
    );
  }

  return context;
}
