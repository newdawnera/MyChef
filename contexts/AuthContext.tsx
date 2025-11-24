// contexts/AuthContext.tsx
/**
 * Authentication Context with Session Management
 *
 * NAVIGATION FIX: Removed initialising state manipulation from auth methods
 * to allow proper navigation after signup/login.
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
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { SessionManager } from "../lib/sessionManager";
import { Alert } from "react-native";

interface AuthContextType {
  user: FirebaseUser | null;
  initialising: boolean;
  signUpWithEmail: (
    email: string,
    password: string,
    name: string
  ) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateActivity: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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

  // Track if we're in the middle of auth operations to skip session validation
  const isSigningUp = useRef(false);
  const isLoggingIn = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        console.log(
          "🔄 Auth state changed. User:",
          firebaseUser?.email || "null"
        );

        if (firebaseUser) {
          // CRITICAL: Check email verification status
          await firebaseUser.reload(); // Refresh user data

          if (!firebaseUser.emailVerified && !isSigningUp.current) {
            console.log("⚠️ Email not verified - blocking access");
            await signOut(auth);
            await SessionManager.clearSession();
            setUser(null);
            if (initialising) {
              setInitialising(false);
            }
            return;
          }

          // Check if this is a new signup in progress
          if (isSigningUp.current) {
            console.log(
              "🆕 New user signup detected - will sign out for verification"
            );
            // Don't set user yet - they need to verify email first
            isSigningUp.current = false;
          }
          // Check if this is a fresh login in progress
          else if (isLoggingIn.current) {
            console.log(
              "🔐 Fresh login detected - skipping session validation"
            );
            setUser(firebaseUser);
            await SessionManager.updateActivity();
            isLoggingIn.current = false;
          }
          // For app restarts / returning users, validate session
          else {
            console.log("🔄 Returning user - validating session");
            const sessionValid = await SessionManager.isSessionValid();

            if (sessionValid) {
              console.log("✅ Session valid - user authenticated");
              setUser(firebaseUser);
              await SessionManager.updateActivity();
            } else {
              console.log("⏰ Session expired - logging out user");
              await signOut(auth);
              await SessionManager.clearSession();
              setUser(null);
            }
          }
        } else {
          // No user - ensure session is cleared
          console.log("👤 No user - clearing session");
          await SessionManager.clearSession();
          setUser(null);
        }

        // Only set initialising to false on the FIRST auth check
        if (initialising) {
          console.log("✅ Initial auth check complete");
          setInitialising(false);
        }
      },
      (error) => {
        console.error("❌ Auth state change error:", error);
        setInitialising(false);
      }
    );

    return () => unsubscribe();
  }, [initialising]);

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ): Promise<void> => {
    // Set flag BEFORE creating user
    isSigningUp.current = true;

    try {
      console.log("📝 Creating Firebase user with name:", name);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("✅ Firebase user created:", user.uid);

      // Update Auth profile with displayName
      console.log("👤 Updating Auth profile with displayName...");
      await updateProfile(user, {
        displayName: name,
      });
      console.log("✅ Auth displayName updated");

      // Send email verification BEFORE creating Firestore doc
      console.log("📧 Sending email verification...");
      await sendEmailVerification(user);
      console.log("✅ Verification email sent to:", email);

      // Create Firestore user document with name field
      console.log("📄 Creating Firestore user document with name...");
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: user.email,
        photoURL: null,
        createdAt: serverTimestamp(),
        emailVerified: false,
      });
      console.log("✅ Firestore user document created with name:", name);

      // Sign out immediately - user must verify email first
      console.log("🚪 Signing out - user must verify email first");
      await signOut(auth);
      await SessionManager.clearSession();

      console.log("✅ Signup complete! User must verify email before login");

      // Don't set user state - they need to verify email first
    } catch (error: any) {
      // Reset flag on error
      isSigningUp.current = false;
      console.error("❌ Sign up error:", error.code, error.message);
      throw error;
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    // Set flag BEFORE logging in
    isLoggingIn.current = true;

    try {
      console.log("🔐 Signing in with Firebase...");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // CRITICAL: Check if email is verified
      await user.reload(); // Refresh user data

      if (!user.emailVerified) {
        console.log("⚠️ Email not verified - blocking login");
        isLoggingIn.current = false;
        await signOut(auth);

        // Show alert with resend option
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in. Check your inbox for the verification link.\n\nDidn't receive it?",
          [
            {
              text: "Resend Email",
              onPress: async () => {
                try {
                  // Re-authenticate to resend
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

      // Email is verified - proceed with login
      console.log("✅ Email verified - proceeding with login");

      // Update Firestore verification status
      await setDoc(
        doc(db, "users", user.uid),
        {
          emailVerified: true,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Create/update session immediately
      console.log("⏱️ Creating session...");
      await SessionManager.updateActivity();
      console.log("✅ Login successful!");

      // Don't set initialising here - let onAuthStateChanged handle it
      // The user state will be set by onAuthStateChanged, triggering navigation
    } catch (error: any) {
      // Reset flag on error
      isLoggingIn.current = false;
      console.error("❌ Sign in error:", error.code, error.message);
      throw error;
    }
    // Note: No finally block that sets initialising
  };

  const signOutUser = async (): Promise<void> => {
    try {
      console.log("👋 Signing out...");
      await SessionManager.clearSession();
      await signOut(auth);
      console.log("✅ Signed out successfully");
    } catch (error: any) {
      console.error("❌ Sign out error:", error.code, error.message);
      throw error;
    }
  };

  const updateActivity = async (): Promise<void> => {
    if (user) {
      await SessionManager.updateActivity();
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      console.log("📧 Sending password reset email to:", email);
      await sendPasswordResetEmail(auth, email);
      console.log("✅ Password reset email sent");
    } catch (error: any) {
      console.error("❌ Password reset error:", error.code, error.message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    initialising,
    signUpWithEmail,
    signInWithEmail,
    signOutUser,
    updateActivity,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
