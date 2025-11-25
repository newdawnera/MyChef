// contexts/SavedRecipesContext.tsx
/**
 * Saved Recipes Context with Firebase Sync & Caching
 *
 * Features:
 * - Save/unsave recipes (bookmark)
 * - Mark recipes as cooked
 * - Favorite recipes
 * - Offline-first with AsyncStorage cache
 * - Firebase sync when online
 * - Optimistic updates for instant UI feedback
 */

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { SpoonacularRecipe } from "@/types/recipe";

// Storage keys
const SAVED_RECIPES_KEY = "@mychef_saved_recipes";
const COOKED_RECIPES_KEY = "@mychef_cooked_recipes";
const FAVORITE_RECIPES_KEY = "@mychef_favorite_recipes";

export interface SavedRecipeEntry {
  recipe: SpoonacularRecipe;
  savedAt: number;
  isFavorite: boolean;
  isCooked: boolean;
  cookedAt?: number;
  notes?: string;
}

interface SavedRecipesContextType {
  // Data
  savedRecipes: SavedRecipeEntry[];
  loading: boolean;
  syncing: boolean;

  // Actions
  saveRecipe: (
    recipe: SpoonacularRecipe,
    favorite?: boolean,
    cooked?: boolean
  ) => Promise<void>;
  unsaveRecipe: (recipeId: number) => Promise<void>;
  toggleFavorite: (recipeId: number) => Promise<void>;
  markAsCooked: (recipeId: number, notes?: string) => Promise<void>;
  unmarkAsCooked: (recipeId: number) => Promise<void>;
  clearAllSaved: () => Promise<void>;

  // Queries
  isSaved: (recipeId: number) => boolean;
  isFavorite: (recipeId: number) => boolean;
  isCooked: (recipeId: number) => boolean;
  getSavedRecipe: (recipeId: number) => SavedRecipeEntry | undefined;

  // Filters
  getFavorites: () => SavedRecipeEntry[];
  getCookedRecipes: () => SavedRecipeEntry[];
  getUncookedRecipes: () => SavedRecipeEntry[];
}

const SavedRecipesContext = createContext<SavedRecipesContextType | undefined>(
  undefined
);

interface SavedRecipesProviderProps {
  children: ReactNode;
}

export function SavedRecipesProvider({ children }: SavedRecipesProviderProps) {
  const { user } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number>(0);

  // 30-minute sync interval (in milliseconds)
  const SYNC_INTERVAL = 30 * 60 * 1000;

  /**
   * Load saved recipes on mount and when user changes
   */
  useEffect(() => {
    if (user) {
      loadSavedRecipes();
      const listener = setupFirestoreListener();

      // Set up 30-minute sync interval
      const syncInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastSync >= SYNC_INTERVAL) {
          console.log("ðŸ”„ 30-min sync interval triggered");
          loadSavedRecipes();
        }
      }, SYNC_INTERVAL);

      return () => {
        if (listener) listener();
        clearInterval(syncInterval);
      };
    } else {
      // Load from local storage for non-authenticated users
      loadFromLocalStorage();
    }
  }, [user]);

  /**
   * Load saved recipes from local storage (offline-first)
   */
  const loadFromLocalStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedRecipeEntry[];
        setSavedRecipes(parsed);
        console.log(`âœ… Loaded ${parsed.length} saved recipes from cache`);
      }
    } catch (error) {
      console.error("Failed to load saved recipes from cache:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load saved recipes from Firebase (with fallback to cache)
   */
  const loadSavedRecipes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log("ðŸ“¥ Loading saved recipes from Firebase...");

      // First, load from cache for instant display
      await loadFromLocalStorage();

      // Then fetch from Firebase
      const recipesRef = collection(db, `users/${user.uid}/savedRecipes`);
      const snapshot = await getDocs(recipesRef);

      const recipes: SavedRecipeEntry[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        recipes.push({
          recipe: data.recipe,
          savedAt: data.savedAt?.toMillis() || Date.now(),
          isFavorite: data.isFavorite || false,
          isCooked: data.isCooked || false,
          cookedAt: data.cookedAt?.toMillis(),
          notes: data.notes,
        });
      });

      setSavedRecipes(recipes);
      await saveToLocalStorage(recipes);
      setLastSync(Date.now()); // Track sync time

      console.log(`âœ… Loaded ${recipes.length} saved recipes from Firebase`);
    } catch (error) {
      console.error("Failed to load saved recipes from Firebase:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Setup real-time Firebase listener
   */
  const setupFirestoreListener = () => {
    if (!user) return;

    const recipesRef = collection(db, `users/${user.uid}/savedRecipes`);

    const unsubscribe = onSnapshot(
      recipesRef,
      (snapshot) => {
        const recipes: SavedRecipeEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          recipes.push({
            recipe: data.recipe,
            savedAt: data.savedAt?.toMillis() || Date.now(),
            isFavorite: data.isFavorite || false,
            isCooked: data.isCooked || false,
            cookedAt: data.cookedAt?.toMillis(),
            notes: data.notes,
          });
        });

        setSavedRecipes(recipes);
        saveToLocalStorage(recipes);
      },
      (error) => {
        console.error("Firebase listener error:", error);
      }
    );

    // Cleanup listener on unmount
    return unsubscribe;
  };

  /**
   * Save to local storage (cache)
   */
  const saveToLocalStorage = async (recipes: SavedRecipeEntry[]) => {
    try {
      await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error("Failed to save to cache:", error);
    }
  };

  /**
   * Save recipe to Firebase
   */
  const saveToFirebase = async (entry: SavedRecipeEntry) => {
    if (!user) return;

    try {
      const recipeRef = doc(
        db,
        `users/${user.uid}/savedRecipes`,
        entry.recipe.id.toString()
      );

      await setDoc(recipeRef, {
        recipe: entry.recipe,
        savedAt: Timestamp.fromMillis(entry.savedAt),
        isFavorite: entry.isFavorite,
        isCooked: entry.isCooked,
        cookedAt: entry.cookedAt ? Timestamp.fromMillis(entry.cookedAt) : null,
        notes: entry.notes || null,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to save to Firebase:", error);
      throw error;
    }
  };

  /**
   * Delete recipe from Firebase
   */
  const deleteFromFirebase = async (recipeId: number) => {
    if (!user) return;

    try {
      const recipeRef = doc(
        db,
        `users/${user.uid}/savedRecipes`,
        recipeId.toString()
      );
      await deleteDoc(recipeRef);
    } catch (error) {
      console.error("Failed to delete from Firebase:", error);
      throw error;
    }
  };

  /**
   * Save a recipe (optimistic update)
   */
  const saveRecipe = async (
    recipe: SpoonacularRecipe,
    favorite: boolean = false,
    cooked: boolean = false
  ) => {
    const entry: SavedRecipeEntry = {
      recipe,
      savedAt: Date.now(),
      isFavorite: favorite,
      isCooked: cooked,
      cookedAt: cooked ? Date.now() : undefined,
    };

    // Optimistic update
    setSavedRecipes((prev) => {
      const filtered = prev.filter((r) => r.recipe.id !== recipe.id);
      return [entry, ...filtered];
    });

    // Save to cache immediately
    const updated = [
      entry,
      ...savedRecipes.filter((r) => r.recipe.id !== recipe.id),
    ];
    await saveToLocalStorage(updated);

    // Sync to Firebase
    try {
      setSyncing(true);
      await saveToFirebase(entry);
      console.log("âœ… Recipe saved:", recipe.title);
    } catch (error) {
      console.error("Failed to sync save to Firebase:", error);
      // Revert optimistic update on error
      setSavedRecipes(savedRecipes);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Unsave a recipe (optimistic update)
   */
  const unsaveRecipe = async (recipeId: number) => {
    // Optimistic update
    const previousRecipes = savedRecipes;
    setSavedRecipes((prev) => prev.filter((r) => r.recipe.id !== recipeId));

    // Update cache
    const updated = savedRecipes.filter((r) => r.recipe.id !== recipeId);
    await saveToLocalStorage(updated);

    // Sync to Firebase
    try {
      setSyncing(true);
      await deleteFromFirebase(recipeId);
      console.log("âœ… Recipe unsaved");
    } catch (error) {
      console.error("Failed to sync unsave to Firebase:", error);
      // Revert optimistic update on error
      setSavedRecipes(previousRecipes);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Toggle favorite status (optimistic update)
   */
  const toggleFavorite = async (recipeId: number) => {
    const recipe = savedRecipes.find((r) => r.recipe.id === recipeId);
    if (!recipe) return;

    // Optimistic update
    const updated = savedRecipes.map((r) =>
      r.recipe.id === recipeId ? { ...r, isFavorite: !r.isFavorite } : r
    );
    setSavedRecipes(updated);
    await saveToLocalStorage(updated);

    // Sync to Firebase
    try {
      setSyncing(true);
      await saveToFirebase({ ...recipe, isFavorite: !recipe.isFavorite });
      console.log("âœ… Favorite toggled");
    } catch (error) {
      console.error("Failed to sync favorite toggle:", error);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Mark recipe as cooked (optimistic update)
   */
  const markAsCooked = async (recipeId: number, notes?: string) => {
    const recipe = savedRecipes.find((r) => r.recipe.id === recipeId);
    if (!recipe) return;

    // Optimistic update
    const updated = savedRecipes.map((r) =>
      r.recipe.id === recipeId
        ? { ...r, isCooked: true, cookedAt: Date.now(), notes }
        : r
    );
    setSavedRecipes(updated);
    await saveToLocalStorage(updated);

    // Sync to Firebase
    try {
      setSyncing(true);
      await saveToFirebase({
        ...recipe,
        isCooked: true,
        cookedAt: Date.now(),
        notes,
      });
      console.log("âœ… Recipe marked as cooked");
    } catch (error) {
      console.error("Failed to sync cooked status:", error);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Unmark recipe as cooked (optimistic update)
   */
  const unmarkAsCooked = async (recipeId: number) => {
    const recipe = savedRecipes.find((r) => r.recipe.id === recipeId);
    if (!recipe) return;

    // Optimistic update
    const updated = savedRecipes.map((r) =>
      r.recipe.id === recipeId
        ? { ...r, isCooked: false, cookedAt: undefined, notes: undefined }
        : r
    );
    setSavedRecipes(updated);
    await saveToLocalStorage(updated);

    // Sync to Firebase
    try {
      setSyncing(true);
      await saveToFirebase({
        ...recipe,
        isCooked: false,
        cookedAt: undefined,
        notes: undefined,
      });
      console.log("âœ… Recipe unmarked as cooked");
    } catch (error) {
      console.error("Failed to sync uncooked status:", error);
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Clear all saved recipes
   */
  const clearAllSaved = async () => {
    setSavedRecipes([]);
    await AsyncStorage.removeItem(SAVED_RECIPES_KEY);

    if (user) {
      try {
        const recipesRef = collection(db, `users/${user.uid}/savedRecipes`);
        const snapshot = await getDocs(recipesRef);
        const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log("âœ… All saved recipes cleared");
      } catch (error) {
        console.error("Failed to clear Firebase recipes:", error);
      }
    }
  };

  /**
   * Query helpers
   */
  const isSaved = (recipeId: number) => {
    return savedRecipes.some((r) => r.recipe.id === recipeId);
  };

  const isFavorite = (recipeId: number) => {
    return savedRecipes.some((r) => r.recipe.id === recipeId && r.isFavorite);
  };

  const isCooked = (recipeId: number) => {
    return savedRecipes.some((r) => r.recipe.id === recipeId && r.isCooked);
  };

  const getSavedRecipe = (recipeId: number) => {
    return savedRecipes.find((r) => r.recipe.id === recipeId);
  };

  /**
   * Filter helpers
   */
  const getFavorites = () => {
    return savedRecipes.filter((r) => r.isFavorite);
  };

  const getCookedRecipes = () => {
    return savedRecipes.filter((r) => r.isCooked);
  };

  const getUncookedRecipes = () => {
    return savedRecipes.filter((r) => !r.isCooked);
  };

  const value: SavedRecipesContextType = {
    savedRecipes,
    loading,
    syncing,
    saveRecipe,
    unsaveRecipe,
    toggleFavorite,
    markAsCooked,
    unmarkAsCooked,
    clearAllSaved,
    isSaved,
    isFavorite,
    isCooked,
    getSavedRecipe,
    getFavorites,
    getCookedRecipes,
    getUncookedRecipes,
  };

  return (
    <SavedRecipesContext.Provider value={value}>
      {children}
    </SavedRecipesContext.Provider>
  );
}

/**
 * Hook to use saved recipes context
 */
export function useSavedRecipes() {
  const context = useContext(SavedRecipesContext);
  if (!context) {
    throw new Error("useSavedRecipes must be used within SavedRecipesProvider");
  }
  return context;
}

export default SavedRecipesContext;
