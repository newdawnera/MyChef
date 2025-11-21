// app/recipes/details.tsx - WITH RECENT RECIPES TRACKING
/**
 * This screen now:
 * 1. Fetches real recipe data from Spoonacular
 * 2. Adds recipe to recent recipes when viewed
 * 3. Shows full recipe details with nutrition
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  Flame,
  Users,
  ChefHat,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useRecentRecipes } from "@/hooks/useRecentRecipes";
import { getRecipeDetails } from "@/services/spoonacularServices";
import { SpoonacularRecipe, calculateDifficulty } from "@/types/recipe";

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, theme } = useTheme();
  const { bottom } = useSafeAreaInsets();

  // Get recipe context
  const { addRecentRecipe } = useRecentRecipes();

  // State
  const [recipe, setRecipe] = useState<SpoonacularRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"ingredients" | "instructions">(
    "ingredients"
  );

  // Get recipe ID from params
  const recipeId = parseInt(params.id as string);

  /**
   * Load recipe details on mount
   */
  useEffect(() => {
    if (recipeId) {
      loadRecipeDetails();
    }
  }, [recipeId]);

  /**
   * Load full recipe details from Spoonacular
   */
  const loadRecipeDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📄 Loading recipe details:", recipeId);

      const recipeData = await getRecipeDetails(recipeId);
      setRecipe(recipeData);

      // Add to recent recipes
      await addRecentRecipe(recipeData);

      console.log("✅ Recipe loaded:", recipeData.title);
    } catch (err) {
      console.error("❌ Failed to load recipe:", err);
      setError(err instanceof Error ? err.message : "Failed to load recipe");
      Alert.alert("Error", "Failed to load recipe details. Please try again.", [
        { text: "Go Back", onPress: () => router.back() },
        { text: "Retry", onPress: loadRecipeDetails },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle save/unsave recipe
   */
  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement save to Firestore
  };

  /**
   * Handle share recipe
   */
  const handleShare = () => {
    // TODO: Implement share functionality
    Alert.alert("Share", "Share functionality coming soon!");
  };

  // Loading State
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{ marginTop: 16, fontSize: 16, color: colors.textSecondary }}
          >
            Loading recipe...
          </Text>
        </View>
      </View>
    );
  }

  // Error State
  if (error || !recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ padding: 20 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.textPrimary,
                marginBottom: 8,
              }}
            >
              Recipe Not Found
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              {error || "Unable to load recipe details"}
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const difficulty = calculateDifficulty(recipe);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cardBg }}>
      <StatusBar barStyle="light-content" />

      {/* Hero Image */}
      <View style={{ height: 320, position: "relative" }}>
        <Image
          source={{ uri: recipe.image }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />

        {/* Header Actions */}
        <SafeAreaView
          edges={["top"]}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <ArrowLeft size={20} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={handleSave}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
            >
              <Heart
                size={20}
                color={isSaved ? "#FF6B6B" : "#1A1A1A"}
                fill={isSaved ? "#FF6B6B" : "none"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
            >
              <Share2 size={20} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Recipe Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: 12,
            }}
          >
            {recipe.title}
          </Text>

          {/* Meta Info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Clock size={18} color={colors.textSecondary} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {recipe.readyInMinutes} min
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Users size={18} color={colors.textSecondary} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {recipe.servings} servings
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <ChefHat size={18} color={colors.textSecondary} />
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {difficulty}
              </Text>
            </View>

            {recipe.healthScore && (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Flame size={18} color={colors.textSecondary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {Math.round(recipe.healthScore)}%
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {recipe.summary && (
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                lineHeight: 22,
                marginBottom: 24,
              }}
            >
              {recipe.summary.replace(/<[^>]*>/g, "")} {/* Remove HTML tags */}
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 20,
            marginBottom: 20,
            gap: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab("ingredients")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor:
                activeTab === "ingredients"
                  ? colors.primary
                  : colors.background,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color:
                  activeTab === "ingredients"
                    ? "#FFFFFF"
                    : colors.textSecondary,
              }}
            >
              Ingredients
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("instructions")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor:
                activeTab === "instructions"
                  ? colors.primary
                  : colors.background,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color:
                  activeTab === "instructions"
                    ? "#FFFFFF"
                    : colors.textSecondary,
              }}
            >
              Instructions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === "ingredients" ? (
          <View style={{ paddingHorizontal: 20 }}>
            {recipe.extendedIngredients &&
            recipe.extendedIngredients.length > 0 ? (
              recipe.extendedIngredients.map((ingredient, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.primary,
                      marginRight: 12,
                    }}
                  />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: colors.textPrimary,
                    }}
                  >
                    {ingredient.original}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                No ingredients available
              </Text>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            {recipe.analyzedInstructions &&
            recipe.analyzedInstructions.length > 0 &&
            recipe.analyzedInstructions[0].steps ? (
              recipe.analyzedInstructions[0].steps.map((step, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    marginBottom: 20,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.primary,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                    >
                      {step.number}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: colors.textPrimary,
                      lineHeight: 22,
                    }}
                  >
                    {step.step}
                  </Text>
                </View>
              ))
            ) : recipe.instructions ? (
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textPrimary,
                  lineHeight: 22,
                }}
              >
                {recipe.instructions.replace(/<[^>]*>/g, "")}
              </Text>
            ) : (
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                No instructions available
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
