// hooks/usePreferences.ts
/**
 * Hook for managing user preferences
 *
 * Features:
 * - Cache-First Strategy: Loads instantly from local storage
 * - Smart Sync: Only fetches from Firestore once every 24 hours
 * - Optimistic Updates: Updates UI immediately while saving in background
 */

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import { UserPreferences, DEFAULT_PREFERENCES } from "@/types/preferences";

const PREFERENCES_STORAGE_KEY = "@mychef_preferences";
const PREFERENCES_LAST_SYNC_KEY = "@mychef_preferences_last_sync";
const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 Hours in milliseconds

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
    loadPreferences();
  }, [user]);

  /**
   * Load preferences: Cache First -> Then Sync if needed
   */
  const loadPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. CACHE FIRST: Try to load from AsyncStorage immediately
      const cachedData = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);

      if (cachedData) {
        const parsed = JSON.parse(cachedData) as UserPreferences;
        setPreferences(parsed);
        console.log("✅ Preferences loaded from Cache");
        // Stop loading immediately since we have data to show
        setLoading(false);
      } else {
        // No cache yet, use defaults
        setPreferences(DEFAULT_PREFERENCES);
      }

      // 2. SYNC CHECK: Only fetch from Firestore if needed
      if (user) {
        await checkAndSyncFirestore();
      } else {
        // If not logged in, we are done
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Failed to load preferences:", err);
      setError("Failed to load preferences");
      setLoading(false);
    }
  };

  /**
   * Helper: Check if 24h have passed and fetch from Firestore
   */
  const checkAndSyncFirestore = async () => {
    if (!user) return;

    try {
      const lastSyncTime = await AsyncStorage.getItem(
        PREFERENCES_LAST_SYNC_KEY
      );
      const now = Date.now();

      // Check if cache is missing or if 24 hours have passed
      const hasCache = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
      const shouldSync =
        !lastSyncTime ||
        now - parseInt(lastSyncTime, 10) > SYNC_INTERVAL_MS ||
        !hasCache;

      if (shouldSync) {
        console.log(
          "🔄 Syncing preferences from Firestore (Expired or Missing)..."
        );

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

          // Update State
          setPreferences(data);

          // Update Cache
          await AsyncStorage.setItem(
            PREFERENCES_STORAGE_KEY,
            JSON.stringify(data)
          );

          // Update Sync Timestamp
          await AsyncStorage.setItem(PREFERENCES_LAST_SYNC_KEY, now.toString());

          console.log("✅ Preferences synced from Firestore & Cached");
        } else {
          console.log("📝 No Firestore data found, keeping local defaults");
        }
      } else {
        console.log("⏩ Skipping Firestore sync (Cache is fresh)");
      }
    } catch (err) {
      console.error("Background sync failed:", err);
      // We don't set the main 'error' state here to avoid disrupting the user UI
      // since they are already seeing the cached version.
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save preferences to Firestore & Cache
   */
  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      setSaving(true);
      setError(null);

      // 1. Optimistic Update: Update State & Cache immediately
      setPreferences(newPreferences);
      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(newPreferences)
      );

      // 2. Background Update: Save to Firestore
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

        // 3. Update Sync Timestamp
        // (So we don't re-fetch the data we just saved on next launch)
        await AsyncStorage.setItem(
          PREFERENCES_LAST_SYNC_KEY,
          Date.now().toString()
        );

        console.log("✅ Preferences saved to Firestore & Cache");
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
    loadPreferences, // Expose if manual refresh is needed
    hasConfiguredPreferences,
    loading,
    saving,
    error,
  };
}

export default usePreferences;
