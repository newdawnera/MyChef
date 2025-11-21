// contexts/RecipeContext.tsx
/**
 * Recipe Context for Global Recipe State
 *
 * Manages:
 * - Recently viewed recipes (MRU list)
 * - Saved/favorited recipes
 * - Recipe search history
 *
 * Persists to AsyncStorage for offline access
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

// Storage keys
const RECENT_RECIPES_KEY = "@mychef_recent_recipes";
const MAX_RECENT_RECIPES = 20; // Keep last 20 viewed recipes

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

  /**
   * Load recent recipes from storage on mount
   */
  useEffect(() => {
    loadRecentRecipes();
  }, []);

  /**
   * Load recent recipes from AsyncStorage
   */
  const loadRecentRecipes = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_RECIPES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentRecipeEntry[];
        setRecentRecipes(parsed);
      }
    } catch (error) {
      console.error("Failed to load recent recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save recent recipes to AsyncStorage
   */
  const saveRecentRecipes = async (recipes: RecentRecipeEntry[]) => {
    try {
      await AsyncStorage.setItem(RECENT_RECIPES_KEY, JSON.stringify(recipes));
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
   * Clear all recent recipes
   */
  const clearRecentRecipes = async () => {
    try {
      setRecentRecipes([]);
      await AsyncStorage.removeItem(RECENT_RECIPES_KEY);
      console.log("✅ Cleared recent recipes");
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
