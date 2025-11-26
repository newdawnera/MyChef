// contexts/AuthContext.tsx
/**
 * Authentication Context - PRODUCTION READY
 *
 * Features:
 * - Email/Password authentication with verification
 * - Google Sign-In (fully functional)
 * - Session management with auto-expiry
 * - Firestore user profile sync
 * - Comprehensive error handling
 */

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { SessionManager } from "../lib/sessionManager";
import { Alert } from "react-native";

// Google Sign-In import (safe - won't crash if not installed)
let GoogleSignin: any = null;
let googleSigninConfigured = false;

try {
  const GoogleSigninModule = require("@react-native-google-signin/google-signin");
  GoogleSignin = GoogleSigninModule.GoogleSignin;
  console.log("✅ Google Sign-In module imported successfully");
} catch (error) {
  console.warn("⚠️ Google Sign-In module not installed");
  console.warn(
    "Install with: npx expo install @react-native-google-signin/google-signin"
  );
}

interface AuthContextType {
  user: FirebaseUser | null;
  initialising: boolean;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateActivity: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  isGoogleSignInAvailable: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [initialising, setInitialising] = useState<boolean>(true);
  const [isGoogleSignInAvailable, setIsGoogleSignInAvailable] = useState(false);

  // Track auth operation states
  const isSigningUp = useRef(false);
  const isLoggingIn = useRef(false);

  /**
   * Configure Google Sign-In on mount
   */
  useEffect(() => {
    const configureGoogleSignIn = async () => {
      if (!GoogleSignin) {
        console.log("ℹ️ Google Sign-In module not available");
        setIsGoogleSignInAvailable(false);
        return;
      }

      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

      if (!webClientId) {
        console.warn(
          "⚠️ EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not found in environment"
        );
        console.warn("Add it to your .env file to enable Google Sign-In");
        setIsGoogleSignInAvailable(false);
        return;
      }

      try {
        await GoogleSignin.configure({
          webClientId: webClientId,
          offlineAccess: true,
        });

        googleSigninConfigured = true;
        setIsGoogleSignInAvailable(true);
        console.log("✅ Google Sign-In configured successfully");
        console.log(
          "🔑 Using Web Client ID:",
          webClientId.substring(0, 20) + "..."
        );
      } catch (error) {
        console.error("❌ Failed to configure Google Sign-In:", error);
        setIsGoogleSignInAvailable(false);
      }
    };

    configureGoogleSignIn();
  }, []);

  /**
   * Listen for Firebase auth state changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        console.log(
          "🔄 Auth state changed:",
          firebaseUser ? firebaseUser.email : "No user"
        );

        if (firebaseUser) {
          // Refresh user data
          await firebaseUser.reload();

          // Check email verification (skip for Google Sign-In users)
          const signedInWithGoogle = firebaseUser.providerData.some(
            (provider) => provider.providerId === "google.com"
          );

          if (
            !firebaseUser.emailVerified &&
            !signedInWithGoogle &&
            !isSigningUp.current
          ) {
            console.log("⚠️ Email not verified - blocking access");
            await signOut(auth);
            await SessionManager.clearSession();
            setUser(null);
            if (initialising) {
              setInitialising(false);
            }
            return;
          }

          // Handle signup flow
          if (isSigningUp.current) {
            console.log("🆕 New user signup - awaiting verification");
            isSigningUp.current = false;
            // Don't set user - they need to verify email first
          }
          // Handle fresh login
          else if (isLoggingIn.current) {
            console.log("🔓 Fresh login - setting user");
            setUser(firebaseUser);
            await SessionManager.updateActivity();
            isLoggingIn.current = false;
          }
          // Handle returning user (app restart)
          else {
            console.log("🔄 Returning user - validating session");
            const sessionValid = await SessionManager.isSessionValid();

            if (sessionValid) {
              console.log("✅ Session valid - user authenticated");
              setUser(firebaseUser);
              await SessionManager.updateActivity();
            } else {
              console.log("⏰ Session expired - signing out");
              await signOut(auth);
              await SessionManager.clearSession();
              setUser(null);
            }
          }
        } else {
          // No user
          console.log("👤 No user - clearing session");
          await SessionManager.clearSession();
          setUser(null);
        }

        // Mark initialization complete
        if (initialising) {
          console.log("✅ Initial auth check complete");
          setInitialising(false);
        }
      },
      (error) => {
        console.error("❌ Auth state listener error:", error);
        setInitialising(false);
      }
    );

    return () => unsubscribe();
  }, [initialising]);

  /**
   * Sign up with email and password
   * FIXED: Robust name saving and merge strategy
   */
  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ): Promise<void> => {
    isSigningUp.current = true;

    try {
      console.log("📝 Creating user account...");

      // Validate inputs
      if (!name) throw new Error("Name is required");
      if (!email) throw new Error("Email is required");

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      console.log("✅ Firebase user created:", user.uid);

      // Update display name (Auth Profile)
      // Wrapped in try-catch so it doesn't block DB write if it fails
      try {
        await updateProfile(user, {
          displayName: name,
        });
        console.log("✅ Display name updated in Auth Profile");
      } catch (e) {
        console.warn(
          "⚠️ Failed to update auth display name (non-critical):",
          e
        );
      }

      // Send verification email
      try {
        await sendEmailVerification(user);
        console.log("✅ Verification email sent to:", email);
      } catch (e) {
        console.error("⚠️ Failed to send verification email:", e);
        // We continue so user is at least created in DB
      }

      // Create Firestore user document
      // FIX: Use 'merge: true' and explicit values to guarantee data integrity
      const userData = {
        name: name, // Explicitly use the passed name argument
        email: user.email || email, // Fallback to passed email if user object incomplete
        photoURL: null,
        emailVerified: false,
        createdAt: serverTimestamp(),
        authProvider: "email",
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      console.log("✅ Firestore user document created with Name:", name);

      // Sign out - user must verify email first
      await signOut(auth);
      await SessionManager.clearSession();

      console.log("✅ Signup complete - user must verify email");
    } catch (error: any) {
      isSigningUp.current = false;
      console.error("❌ Signup error:", error.code);
      throw error;
    }
  };

  /**
   * Sign in with email and password
   */
  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    isLoggingIn.current = true;

    try {
      console.log("🔐 Signing in with email...");

      // Sign in to Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Check email verification
      await user.reload();

      if (!user.emailVerified) {
        console.log("⚠️ Email not verified");
        isLoggingIn.current = false;
        await signOut(auth);

        // Show resend option
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox for the verification link.\n\nDidn't receive it?",
          [
            {
              text: "Resend Email",
              onPress: async () => {
                try {
                  const tempCred = await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                  );
                  await sendEmailVerification(tempCred.user);
                  await signOut(auth);
                  Alert.alert(
                    "✅ Email Sent",
                    "Verification email has been resent. Please check your inbox."
                  );
                } catch (error) {
                  console.error("Failed to resend verification:", error);
                  Alert.alert(
                    "Error",
                    "Failed to resend verification email. Please try again later."
                  );
                }
              },
            },
            { text: "OK", style: "cancel" },
          ]
        );

        throw new Error("Email not verified");
      }

      console.log("✅ Email verified - proceeding with login");

      // Update Firestore
      await setDoc(
        doc(db, "users", user.uid),
        {
          emailVerified: true,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Create session
      await SessionManager.updateActivity();
      console.log("✅ Login successful!");
    } catch (error: any) {
      isLoggingIn.current = false;
      console.error("❌ Login error:", error.code);
      throw error;
    }
  };

  /**
   * Sign in with Google - PRODUCTION READY
   */
  const signInWithGoogle = async (): Promise<void> => {
    // Validate availability
    if (!GoogleSignin || !googleSigninConfigured) {
      throw new Error("Google Sign-In is not properly configured");
    }

    isLoggingIn.current = true;

    try {
      console.log("🔵 Starting Google Sign-In flow...");

      // Check Play Services (Android)
      try {
        await GoogleSignin.hasPlayServices({
          showPlayServicesUpdateDialog: true,
        });
        console.log("✅ Google Play Services available");
      } catch (error: any) {
        console.error("❌ Google Play Services error:", error);
        throw new Error("PLAY_SERVICES_NOT_AVAILABLE");
      }

      // Start Google Sign-In
      console.log("🔵 Opening Google account picker...");
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo || !userInfo.idToken) {
        throw new Error("Failed to get user info from Google");
      }

      console.log("✅ Google account selected:", userInfo.user?.email);

      // Get ID token
      const { idToken } = userInfo;
      console.log("✅ ID token received");

      // Create Firebase credential
      const credential = GoogleAuthProvider.credential(idToken);
      console.log("✅ Firebase credential created");

      // Sign in to Firebase
      console.log("🔥 Signing in to Firebase...");
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      console.log("✅ Firebase sign-in successful:", user.email);

      // Check if user document exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // New Google user - create document
        console.log("🆕 Creating new user document...");
        await setDoc(userDocRef, {
          name: user.displayName || "User",
          email: user.email,
          photoURL: user.photoURL,
          emailVerified: true, // Google accounts are pre-verified
          createdAt: serverTimestamp(),
          authProvider: "google",
        });
        console.log("✅ User document created");
      } else {
        // Existing user - update last login
        console.log("🔄 Updating existing user document...");
        await setDoc(
          userDocRef,
          {
            lastLoginAt: serverTimestamp(),
            photoURL: user.photoURL, // Update photo URL if changed
          },
          { merge: true }
        );
        console.log("✅ User document updated");
      }

      // Create session
      await SessionManager.updateActivity();
      console.log("✅ Google Sign-In complete!");
    } catch (error: any) {
      isLoggingIn.current = false;
      console.error("❌ Google Sign-In error:", error);

      // Throw user-friendly errors
      if (error.code === "SIGN_IN_CANCELLED" || error.code === "-5") {
        throw new Error("Sign in was cancelled");
      } else if (error.code === "IN_PROGRESS") {
        throw new Error("A sign-in attempt is already in progress");
      } else if (error.message?.includes("PLAY_SERVICES_NOT_AVAILABLE")) {
        throw new Error("Google Play Services not available");
      } else if (error.message?.includes("DEVELOPER_ERROR")) {
        console.error("⚠️ DEVELOPER_ERROR - Check configuration:");
        console.error("1. SHA-1 fingerprint added to Firebase");
        console.error("2. Package name matches app.json");
        console.error("3. google-services.json is current");
        throw new Error("Configuration error. Please contact support.");
      } else if (error.code === "auth/network-request-failed") {
        throw new Error("Network error. Please check your connection.");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Google Sign-In failed. Please try again.");
      }
    }
  };

  /**
   * Sign out user (handles both email and Google)
   */
  const signOutUser = async (): Promise<void> => {
    try {
      console.log("👋 Signing out...");

      // Sign out from Google if signed in
      if (GoogleSignin && googleSigninConfigured) {
        try {
          const isSignedIn = await GoogleSignin.isSignedIn();
          if (isSignedIn) {
            await GoogleSignin.signOut();
            console.log("✅ Signed out from Google");
          }
        } catch (error) {
          console.warn("⚠️ Google sign-out error (non-critical):", error);
        }
      }

      // Clear session
      await SessionManager.clearSession();

      // Sign out from Firebase
      await signOut(auth);

      console.log("✅ Sign out complete");
    } catch (error: any) {
      console.error("❌ Sign out error:", error);
      throw error;
    }
  };

  /**
   * Update user activity timestamp
   */
  const updateActivity = async (): Promise<void> => {
    if (user) {
      await SessionManager.updateActivity();
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
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    initialising,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOutUser,
    updateActivity,
    sendPasswordReset,
    isGoogleSignInAvailable,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
