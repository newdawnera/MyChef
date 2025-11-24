// hooks/useSavedRecipes.ts
/**
 * Saved Recipes Hook with Firebase Sync
 *
 * Features:
 * - Save/unsave recipes
 * - Sync with Firebase
 * - Local caching for offline access
 * - Real-time updates
 * - Optimistic UI updates
 */

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import { SpoonacularRecipe } from "@/types/recipe";
import { savedRecipesCache } from "@/utils/cacheManager";
import { OfflineQueue } from "@/utils/offlineQueue";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_RECIPES_STORAGE_KEY = "@mychef_saved_recipes";

export interface SavedRecipe {
  recipe: SpoonacularRecipe;
  savedAt: Date;
}

export function useSavedRecipes() {
  const { user } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<Map<number, SavedRecipe>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load saved recipes on mount
   */
  useEffect(() => {
    if (!user) {
      setSavedRecipes(new Map());
      setLoading(false);
      return;
    }

    loadSavedRecipes();

    // Set up real-time sync
    const unsubscribe = setupRealtimeSync();

    return () => unsubscribe();
  }, [user?.uid]);

  /**
   * Load saved recipes from cache/Firebase
   */
  const loadSavedRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Try cache first
      const cached = await savedRecipesCache.get(user.uid);
      if (cached) {
        console.log("✅ Loaded saved recipes from cache");
        const recipesMap = new Map(
          Object.entries(cached).map(([id, data]) => [
            parseInt(id),
            data as SavedRecipe,
          ])
        );
        setSavedRecipes(recipesMap);
        setLoading(false);
        return;
      }

      // Try local storage
      const localData = await AsyncStorage.getItem(
        `${SAVED_RECIPES_STORAGE_KEY}_${user.uid}`
      );
      if (localData) {
        const parsed = JSON.parse(localData);
        const recipesMap = new Map(
          Object.entries(parsed).map(([id, data]) => [
            parseInt(id),
            data as SavedRecipe,
          ])
        );
        setSavedRecipes(recipesMap);
        console.log("✅ Loaded saved recipes from local storage");
      }

      // Fetch from Firebase
      console.log("🔄 Fetching saved recipes from Firebase");
      const recipesRef = collection(db, "users", user.uid, "savedRecipes");
      const q = query(recipesRef, orderBy("savedAt", "desc"));
      const snapshot = await getDocs(q);

      const recipes = new Map<number, SavedRecipe>();
      snapshot.forEach((doc) => {
        const data = doc.data();
        recipes.set(parseInt(doc.id), {
          recipe: data.recipe as SpoonacularRecipe,
          savedAt: data.savedAt?.toDate() || new Date(),
        });
      });

      setSavedRecipes(recipes);

      // Update caches
      const recipesObj = Object.fromEntries(recipes);
      await savedRecipesCache.set(user.uid, recipesObj);
      await AsyncStorage.setItem(
        `${SAVED_RECIPES_STORAGE_KEY}_${user.uid}`,
        JSON.stringify(recipesObj)
      );

      console.log(`✅ Loaded ${recipes.size} saved recipes from Firebase`);
    } catch (err) {
      console.error("Failed to load saved recipes:", err);
      setError("Failed to load saved recipes");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set up real-time sync from Firebase
   */
  const setupRealtimeSync = () => {
    if (!user) return () => {};

    const recipesRef = collection(db, "users", user.uid, "savedRecipes");
    const q = query(recipesRef, orderBy("savedAt", "desc"));

    return onSnapshot(
      q,
      (snapshot) => {
        const recipes = new Map<number, SavedRecipe>();
        snapshot.forEach((doc) => {
          const data = doc.data();
          recipes.set(parseInt(doc.id), {
            recipe: data.recipe as SpoonacularRecipe,
            savedAt: data.savedAt?.toDate() || new Date(),
          });
        });

        console.log(`🔄 Real-time update: ${recipes.size} saved recipes`);
        setSavedRecipes(recipes);

        // Update caches
        const recipesObj = Object.fromEntries(recipes);
        savedRecipesCache.set(user.uid, recipesObj);
        AsyncStorage.setItem(
          `${SAVED_RECIPES_STORAGE_KEY}_${user.uid}`,
          JSON.stringify(recipesObj)
        );
      },
      (err) => {
        console.error("Real-time sync error:", err);
      }
    );
  };

  /**
   * Save a recipe
   */
  const saveRecipe = useCallback(
    async (recipe: SpoonacularRecipe) => {
      if (!user) {
        setError("Please sign in to save recipes");
        return;
      }

      try {
        // Optimistic update
        const newSavedRecipe: SavedRecipe = {
          recipe,
          savedAt: new Date(),
        };

        const newSavedRecipes = new Map(savedRecipes);
        newSavedRecipes.set(recipe.id, newSavedRecipe);
        setSavedRecipes(newSavedRecipes);

        // Update local cache
        const recipesObj = Object.fromEntries(newSavedRecipes);
        await AsyncStorage.setItem(
          `${SAVED_RECIPES_STORAGE_KEY}_${user.uid}`,
          JSON.stringify(recipesObj)
        );

        console.log(`💾 Saving recipe: ${recipe.title}`);

        // Try to save to Firebase
        try {
          const docRef = doc(
            db,
            "users",
            user.uid,
            "savedRecipes",
            recipe.id.toString()
          );
          await setDoc(docRef, {
            recipe,
            savedAt: new Date(),
          });

          console.log("✅ Recipe saved to Firebase");
        } catch (firebaseError) {
          // If offline, queue for later
          console.warn(
            "Failed to save to Firebase, queuing for later:",
            firebaseError
          );

          await OfflineQueue.add({
            type: "SAVE_RECIPE",
            userId: user.uid,
            data: { recipeId: recipe.id.toString(), recipe },
          });
        }
      } catch (err) {
        console.error("Failed to save recipe:", err);
        setError("Failed to save recipe");

        // Revert optimistic update
        await loadSavedRecipes();
      }
    },
    [user, savedRecipes]
  );

  /**
   * Unsave a recipe
   */
  const unsaveRecipe = useCallback(
    async (recipeId: number) => {
      if (!user) {
        setError("Please sign in to unsave recipes");
        return;
      }

      try {
        // Optimistic update
        const newSavedRecipes = new Map(savedRecipes);
        newSavedRecipes.delete(recipeId);
        setSavedRecipes(newSavedRecipes);

        // Update local cache
        const recipesObj = Object.fromEntries(newSavedRecipes);
        await AsyncStorage.setItem(
          `${SAVED_RECIPES_STORAGE_KEY}_${user.uid}`,
          JSON.stringify(recipesObj)
        );

        console.log(`🗑️ Unsaving recipe: ${recipeId}`);

        // Try to delete from Firebase
        try {
          const docRef = doc(
            db,
            "users",
            user.uid,
            "savedRecipes",
            recipeId.toString()
          );
          await deleteDoc(docRef);

          console.log("✅ Recipe unsaved from Firebase");
        } catch (firebaseError) {
          // If offline, queue for later
          console.warn(
            "Failed to unsave from Firebase, queuing for later:",
            firebaseError
          );

          await OfflineQueue.add({
            type: "UNSAVE_RECIPE",
            userId: user.uid,
            data: { recipeId: recipeId.toString() },
          });
        }
      } catch (err) {
        console.error("Failed to unsave recipe:", err);
        setError("Failed to unsave recipe");

        // Revert optimistic update
        await loadSavedRecipes();
      }
    },
    [user, savedRecipes]
  );

  /**
   * Toggle save status
   */
  const toggleSaveRecipe = useCallback(
    async (recipe: SpoonacularRecipe) => {
      if (isSaved(recipe.id)) {
        await unsaveRecipe(recipe.id);
      } else {
        await saveRecipe(recipe);
      }
    },
    [savedRecipes, saveRecipe, unsaveRecipe]
  );

  /**
   * Check if recipe is saved
   */
  const isSaved = useCallback(
    (recipeId: number): boolean => {
      return savedRecipes.has(recipeId);
    },
    [savedRecipes]
  );

  /**
   * Get all saved recipes as array
   */
  const getSavedRecipesArray = useCallback((): SavedRecipe[] => {
    return Array.from(savedRecipes.values()).sort(
      (a, b) => b.savedAt.getTime() - a.savedAt.getTime()
    );
  }, [savedRecipes]);

  /**
   * Clear all saved recipes (with confirmation)
   */
  const clearAllSavedRecipes = useCallback(async () => {
    if (!user) return;

    try {
      // Clear locally first (optimistic)
      setSavedRecipes(new Map());
      await AsyncStorage.removeItem(`${SAVED_RECIPES_STORAGE_KEY}_${user.uid}`);
      await savedRecipesCache.delete(user.uid);

      // Clear from Firebase
      const recipesRef = collection(db, "users", user.uid, "savedRecipes");
      const snapshot = await getDocs(recipesRef);

      const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      console.log("✅ Cleared all saved recipes");
    } catch (err) {
      console.error("Failed to clear saved recipes:", err);
      setError("Failed to clear saved recipes");
    }
  }, [user]);

  return {
    savedRecipes: getSavedRecipesArray(),
    savedRecipesCount: savedRecipes.size,
    loading,
    error,
    saveRecipe,
    unsaveRecipe,
    toggleSaveRecipe,
    isSaved,
    clearAllSavedRecipes,
  };
}

export default useSavedRecipes;
