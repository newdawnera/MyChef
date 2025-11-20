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
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { SessionManager } from "../lib/sessionManager";

interface AuthContextType {
  user: FirebaseUser | null;
  initialising: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateActivity: () => Promise<void>;
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
          // Check if this is a new signup in progress
          if (isSigningUp.current) {
            console.log(
              "🆕 New user signup detected - skipping session validation"
            );
            setUser(firebaseUser);
            await SessionManager.updateActivity();
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
    password: string
  ): Promise<void> => {
    // Set flag BEFORE creating user
    isSigningUp.current = true;

    try {
      console.log("📝 Creating Firebase user...");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("✅ Firebase user created:", user.uid);

      // Create session immediately
      console.log("⏱️ Creating session...");
      await SessionManager.updateActivity();
      console.log("✅ Session created");

      // Create Firestore user document
      console.log("📄 Creating Firestore user document...");
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
      });
      console.log("✅ Firestore user document created");

      // Trigger welcome email
      console.log("📧 Triggering welcome email...");
      await setDoc(doc(db, "mail", `welcome-${user.uid}`), {
        to: user.email,
        template: {
          name: "welcomeEmail",
        },
      });
      console.log("✅ Welcome email queued");
      console.log("✅ Signup complete!");

      // Don't set initialising here - let onAuthStateChanged handle it
      // The user state will be set by onAuthStateChanged, triggering navigation
    } catch (error: any) {
      // Reset flag on error
      isSigningUp.current = false;
      console.error("❌ Sign up error:", error.code, error.message);
      throw error;
    }
    // Note: No finally block that sets initialising
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<void> => {
    // Set flag BEFORE logging in
    isLoggingIn.current = true;

    try {
      console.log("🔐 Signing in with Firebase...");
      await signInWithEmailAndPassword(auth, email, password);

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

  const value: AuthContextType = {
    user,
    initialising,
    signUpWithEmail,
    signInWithEmail,
    signOutUser,
    updateActivity,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
