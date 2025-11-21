// hooks/useRecentRecipes.ts
/**
 * Convenience hook for accessing recent recipes
 * Wrapper around useRecipeContext
 */

import { useRecipeContext } from "@/contexts/RecipeContext";

export function useRecentRecipes() {
  return useRecipeContext();
}

export default useRecentRecipes;
