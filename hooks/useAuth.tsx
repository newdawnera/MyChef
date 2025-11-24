// hooks/useAuth.tsx
/**
 * Authentication Hook - SAFE VERSION
 *
 * Handles:
 * - Email/Password authentication
 * - Google Sign-In (optional - won't crash if not configured)
 * - Password reset
 * - Session management
 * - Auto sign-in on app restart
 *
 * IMPORTANT: This version won't crash if Google Sign-In isn't set up yet!
 */

import { useState, useEffect, createContext, useContext } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { SessionManager } from "@/lib/sessionManager";

// Dynamically import Google Sign-In to avoid crashes
let GoogleSignin: any = null;
let googleConfigured = false;

// Try to import Google Sign-In (won't crash if not installed)
try {
  const GoogleSigninModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = GoogleSigninModule.GoogleSignin;
  console.log("✅ Google Sign-In module loaded");
} catch (error) {
  console.warn(
    "⚠️ Google Sign-In not installed. Google auth will be disabled."
  );
  console.warn(
    "To enable: npx expo install @react-native-google-signin/google-signin"
  );
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialising: boolean; // For splash screen
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updateActivity: () => Promise<void>; // Update session activity
  isGoogleSignInAvailable: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialising, setInitialising] = useState(true); // For splash screen
  const [isGoogleSignInAvailable, setIsGoogleSignInAvailable] = useState(false);

  // Initialize Google Sign-In (only if module is available)
  useEffect(() => {
    const configureGoogle = async () => {
      if (!GoogleSignin) {
        console.log(
          "ℹ️ Google Sign-In module not available - skipping configuration"
        );
        setIsGoogleSignInAvailable(false);
        return;
      }

      // Get Web Client ID from environment
      const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

      if (!GOOGLE_WEB_CLIENT_ID) {
        console.warn("⚠️ Google Web Client ID not configured");
        console.warn("Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file");
        setIsGoogleSignInAvailable(false);
        return;
      }

      try {
        await GoogleSignin.configure({
          webClientId: GOOGLE_WEB_CLIENT_ID,
          offlineAccess: true,
          scopes: ["profile", "email"],
        });

        googleConfigured = true;
        setIsGoogleSignInAvailable(true);
        console.log("✅ Google Sign-In configured successfully");
      } catch (error) {
        console.error("❌ Failed to configure Google Sign-In:", error);
        setIsGoogleSignInAvailable(false);
      }
    };

    configureGoogle();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if session is still valid
        const isValid = await SessionManager.isSessionValid();

        if (isValid) {
          // Session valid - keep user logged in
          setUser(firebaseUser);
          await SessionManager.updateActivity();
          console.log("✅ User authenticated:", firebaseUser.email);
        } else {
          // Session expired - sign out
          console.log("⏱️ Session expired, signing out");
          await signOut(auth);
          await SessionManager.clearSession();
          setUser(null);
        }
      } else {
        // No user - clear everything
        setUser(null);
        await SessionManager.clearSession();
      }

      setLoading(false);
      setInitialising(false); // Auth check complete
    });

    return unsubscribe;
  }, []);

  /**
   * Sign up with email and password
   */
  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ): Promise<void> => {
    try {
      console.log("📝 Creating account for:", email);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update user profile with name
      if (name) {
        await updateProfile(userCredential.user, {
          displayName: name,
        });
      }

      // Initialize session
      await SessionManager.updateActivity();

      console.log("✅ Account created successfully");
    } catch (error: any) {
      console.error("❌ Sign up error:", error.code);

      // Throw user-friendly error messages
      if (error.code === "auth/email-already-in-use") {
        throw new Error("This email is already registered");
      } else if (error.code === "auth/weak-password") {
        throw new Error("Password should be at least 6 characters");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      } else {
        throw new Error("Failed to create account. Please try again.");
      }
    }
  };

  /**
   * Sign in with email and password
   */
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    try {
      console.log("🔑 Signing in:", email);

      await signInWithEmailAndPassword(auth, email, password);

      // Initialize session
      await SessionManager.updateActivity();

      console.log("✅ Sign in successful");
    } catch (error: any) {
      console.error("❌ Sign in error:", error.code);

      // Throw user-friendly error messages
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        throw new Error("Invalid email or password");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      } else if (error.code === "auth/too-many-requests") {
        throw new Error("Too many attempts. Please try again later.");
      } else {
        throw new Error("Failed to sign in. Please try again.");
      }
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (): Promise<void> => {
    // Check if Google Sign-In is available
    if (!GoogleSignin || !googleConfigured) {
      throw new Error(
        "Google Sign-In is not available. Please install the package and configure it."
      );
    }

    try {
      console.log("🔵 Starting Google Sign-In...");

      // Check if Google Play Services are available (Android only)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Trigger Google Sign-In flow
      const userInfo = await GoogleSignin.signIn();

      console.log("🔵 Google user info received:", userInfo.user.email);

      // Get ID token from Google
      const { idToken } = userInfo;

      if (!idToken) {
        throw new Error("Failed to get ID token from Google");
      }

      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase with Google credential
      const userCredential = await signInWithCredential(auth, credential);

      console.log("✅ Google Sign-In successful:", userCredential.user.email);

      // Initialize session
      await SessionManager.updateActivity();
    } catch (error: any) {
      console.error("❌ Google Sign-In error:", error);

      // Handle specific Google Sign-In errors
      if (error.code === "SIGN_IN_CANCELLED") {
        throw new Error("Sign in was cancelled");
      } else if (error.code === "IN_PROGRESS") {
        throw new Error("Sign in is already in progress");
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        throw new Error("Google Play Services not available");
      } else if (error.message?.includes("DEVELOPER_ERROR")) {
        console.error(
          "⚠️ DEVELOPER_ERROR: Check your SHA-1 fingerprint and package name in Google Cloud Console"
        );
        throw new Error("Configuration error. Please contact support.");
      } else if (error.message?.includes("not available")) {
        throw new Error(error.message);
      } else {
        throw new Error("Google Sign-In failed. Please try again.");
      }
    }
  };

  /**
   * Sign out current user
   */
  const signOutUser = async (): Promise<void> => {
    try {
      console.log("👋 Signing out user");

      // Sign out from Google if available and signed in
      if (GoogleSignin) {
        try {
          const isGoogleSignedIn = await GoogleSignin.isSignedIn();
          if (isGoogleSignedIn) {
            await GoogleSignin.signOut();
            console.log("✅ Signed out from Google");
          }
        } catch (error) {
          console.warn("⚠️ Failed to sign out from Google:", error);
          // Continue with Firebase sign out even if Google sign out fails
        }
      }

      // Sign out from Firebase
      await signOut(auth);

      // Clear session
      await SessionManager.clearSession();

      console.log("✅ Sign out successful");
    } catch (error) {
      console.error("❌ Sign out error:", error);
      throw new Error("Failed to sign out. Please try again.");
    }
  };

  /**
   * Send password reset email
   */
  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      console.log("📧 Sending password reset email to:", email);

      await sendPasswordResetEmail(auth, email);

      console.log("✅ Password reset email sent");
    } catch (error: any) {
      console.error("❌ Password reset error:", error.code);

      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      } else {
        throw new Error("Failed to send reset email. Please try again.");
      }
    }
  };

  /**
   * Update session activity timestamp
   * Call this when user interacts with the app or app comes to foreground
   */
  const updateActivity = async (): Promise<void> => {
    try {
      await SessionManager.updateActivity();
      console.log("✅ Activity timestamp updated");
    } catch (error) {
      console.error("❌ Failed to update activity:", error);
    }
  };

  const value = {
    user,
    loading,
    initialising,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOutUser,
    sendPasswordReset,
    updateActivity,
    isGoogleSignInAvailable,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
