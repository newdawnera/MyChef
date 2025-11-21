// hooks/usePreferences.ts
/**
 * Hook for managing user preferences
 *
 * Features:
 * - Load preferences from Firestore
 * - Save preferences to Firestore
 * - Local caching for offline access
 * - Default preferences for new users
 */

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/types/preferences";

const PREFERENCES_STORAGE_KEY = "@mychef_preferences";

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load preferences on mount and when user changes
   */
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      // Load from local storage if not logged in
      loadLocalPreferences();
    }
  }, [user]);

  /**
   * Load preferences from Firestore
   */
  const loadPreferences = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const prefsRef = doc(
        db,
        "users",
        user.uid,
        "preferences",
        "userPreferences"
      );
      const prefsSnap = await getDoc(prefsRef);

      if (prefsSnap.exists()) {
        const data = prefsSnap.data() as UserPreferences;
        setPreferences(data);

        // Cache locally
        await AsyncStorage.setItem(
          PREFERENCES_STORAGE_KEY,
          JSON.stringify(data)
        );

        console.log("✅ Preferences loaded from Firestore");
      } else {
        // No preferences yet, use defaults
        console.log("📝 No preferences found, using defaults");
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (err) {
      console.error("❌ Failed to load preferences:", err);
      setError("Failed to load preferences");

      // Try loading from local cache
      await loadLocalPreferences();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load preferences from local storage (offline fallback)
   */
  const loadLocalPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserPreferences;
        setPreferences(parsed);
        console.log("✅ Preferences loaded from local storage");
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (err) {
      console.error("❌ Failed to load local preferences:", err);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save preferences to Firestore
   */
  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      setSaving(true);
      setError(null);

      // Update local state immediately (optimistic update)
      setPreferences(newPreferences);

      // Save to local storage
      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(newPreferences)
      );

      // Save to Firestore if user is logged in
      if (user) {
        const prefsRef = doc(
          db,
          "users",
          user.uid,
          "preferences",
          "userPreferences"
        );
        await setDoc(
          prefsRef,
          {
            ...newPreferences,
            lastUpdated: serverTimestamp(),
          },
          { merge: true }
        );

        console.log("✅ Preferences saved to Firestore");
      } else {
        console.log("✅ Preferences saved locally (not logged in)");
      }
    } catch (err) {
      console.error("❌ Failed to save preferences:", err);
      setError("Failed to save preferences");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Update specific preference field
   */
  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const updated = {
      ...preferences,
      [key]: value,
    };
    await savePreferences(updated);
  };

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = async () => {
    await savePreferences(DEFAULT_PREFERENCES);
  };

  /**
   * Check if preferences are configured (not defaults)
   */
  const hasConfiguredPreferences = (): boolean => {
    return (
      preferences.selectedDiets.length > 0 ||
      preferences.selectedAllergies.length > 0 ||
      preferences.selectedCuisines.length > 0 ||
      preferences.selectedGoals.length > 0 ||
      preferences.avoidIngredients.length > 0
    );
  };

  return {
    preferences,
    setPreferences,
    savePreferences,
    updatePreference,
    resetPreferences,
    loadPreferences,
    hasConfiguredPreferences,
    loading,
    saving,
    error,
  };
}

export default usePreferences;
