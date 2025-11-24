// contexts/RecipeContext.tsx
/**
 * Recipe Context for Global Recipe State (User-Specific)
 *
 * Manages:
 * - Recently viewed recipes (MRU list) - PER USER
 * - Saved/favorited recipes
 * - Recipe search history
 *
 * Persists to AsyncStorage with user-specific keys to prevent data leakage
 * between users on the same device
 */

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SpoonacularRecipe } from "@/types/recipe";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Storage key prefix - will be combined with user ID
const RECENT_RECIPES_KEY_PREFIX = "@mychef_recent_recipes";
const MAX_RECENT_RECIPES = 20; // Keep last 20 viewed recipes

// Helper: Get user-specific storage key
const getUserStorageKey = (userId: string | null) => {
  return userId
    ? `${RECENT_RECIPES_KEY_PREFIX}_${userId}`
    : RECENT_RECIPES_KEY_PREFIX;
};

interface RecentRecipeEntry {
  recipe: SpoonacularRecipe;
  viewedAt: number; // timestamp
}

interface RecipeContextType {
  // Recently viewed recipes
  recentRecipes: RecentRecipeEntry[];
  addRecentRecipe: (recipe: SpoonacularRecipe) => Promise<void>;
  clearRecentRecipes: () => Promise<void>;

  // Loading state
  loading: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

interface RecipeProviderProps {
  children: ReactNode;
}

export function RecipeProvider({ children }: RecipeProviderProps) {
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /**
   * Listen for auth state changes and reload recipes when user changes
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const newUserId = user?.uid || null;

      // If user changed, clear current recipes and reload for new user
      if (newUserId !== currentUserId) {
        console.log(
          "👤 User changed, reloading recipes for:",
          newUserId || "guest"
        );
        setCurrentUserId(newUserId);
        setRecentRecipes([]); // Clear old user's recipes from memory
        loadRecentRecipes(newUserId);
      }
    });

    return () => unsubscribe();
  }, [currentUserId]);

  /**
   * Initial load on mount
   */
  useEffect(() => {
    const userId = auth.currentUser?.uid || null;
    setCurrentUserId(userId);
    loadRecentRecipes(userId);
  }, []);

  /**
   * Load recent recipes from AsyncStorage (user-specific)
   */
  const loadRecentRecipes = async (userId: string | null = currentUserId) => {
    try {
      const storageKey = getUserStorageKey(userId);
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentRecipeEntry[];
        setRecentRecipes(parsed);
        console.log(
          `✅ Loaded ${parsed.length} recent recipes for user:`,
          userId || "guest"
        );
      } else {
        setRecentRecipes([]);
      }
    } catch (error) {
      console.error("Failed to load recent recipes:", error);
      setRecentRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save recent recipes to AsyncStorage (user-specific)
   */
  const saveRecentRecipes = async (recipes: RecentRecipeEntry[]) => {
    try {
      const storageKey = getUserStorageKey(currentUserId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(recipes));
      console.log(
        `✅ Saved ${recipes.length} recipes for user:`,
        currentUserId || "guest"
      );
    } catch (error) {
      console.error("Failed to save recent recipes:", error);
    }
  };

  /**
   * Add a recipe to recently viewed
   * Moves to top if already exists (MRU behavior)
   */
  const addRecentRecipe = async (recipe: SpoonacularRecipe) => {
    try {
      // Remove if already exists
      const filtered = recentRecipes.filter(
        (entry) => entry.recipe.id !== recipe.id
      );

      // Add to front
      const newEntry: RecentRecipeEntry = {
        recipe,
        viewedAt: Date.now(),
      };

      const updated = [newEntry, ...filtered].slice(0, MAX_RECENT_RECIPES);

      setRecentRecipes(updated);
      await saveRecentRecipes(updated);

      console.log("✅ Added recipe to recent:", recipe.title);
    } catch (error) {
      console.error("Failed to add recent recipe:", error);
    }
  };

  /**
   * Clear all recent recipes for current user
   */
  const clearRecentRecipes = async () => {
    try {
      setRecentRecipes([]);
      const storageKey = getUserStorageKey(currentUserId);
      await AsyncStorage.removeItem(storageKey);
      console.log(
        "✅ Cleared recent recipes for user:",
        currentUserId || "guest"
      );
    } catch (error) {
      console.error("Failed to clear recent recipes:", error);
    }
  };

  const value: RecipeContextType = {
    recentRecipes,
    addRecentRecipe,
    clearRecentRecipes,
    loading,
  };

  return (
    <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>
  );
}

/**
 * Hook to use recipe context
 */
export function useRecipeContext() {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error("useRecipeContext must be used within RecipeProvider");
  }
  return context;
}

export default RecipeContext;
