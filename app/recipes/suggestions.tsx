// app/recipes/suggestions.tsx - FIXED CRASH ON 0 VALUES
/**
 * AI Suggestions Screen - INTELLIGENT RECIPE GENERATION
 *
 * NEW FEATURES:
 * 1. Progressive variation strategy (similar → related → different)
 * 2. Recipe tracking (avoid showing duplicates)
 * 3. Confidence score display
 * 4. Conflict resolution badges
 * 5. Detailed key points display
 * 6. Smart reset strategy
 */

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Clock,
  Flame,
  Users,
  Sparkles,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { usePreferences } from "@/hooks/usePreferences";
import {
  analyzeRecipeRequest,
  RecipeAnalysisResponse,
} from "@/services/groqServices";
import {
  groqToSpoonacularParams,
  searchRecipes,
} from "@/services/spoonacularServices";
import { SpoonacularRecipe, calculateDifficulty } from "@/types/recipe";

export default function AiSuggestionScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const params = useLocalSearchParams();

  // Get preferences
  const { preferences } = usePreferences();

  // State
  const [isGenerating, setIsGenerating] = useState(true);
  const [recipes, setRecipes] = useState<SpoonacularRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [groqAnalysis, setGroqAnalysis] =
    useState<RecipeAnalysisResponse | null>(null);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [shownRecipeIds, setShownRecipeIds] = useState<Set<number>>(new Set());
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);

  // Extract params
  const searchText = (params.searchText as string) || "";
  const imagesParam = params.images as string;
  const images = imagesParam ? JSON.parse(imagesParam) : [];

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Generate recipes on mount
   */
  useEffect(() => {
    generateRecipes();
  }, []);

  /**
   * Loading animation
   */
  useEffect(() => {
    if (!isGenerating) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    pulse.start();
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, [isGenerating]);

  /**
   * ENHANCED: Main recipe generation with progressive variation
   */
  const generateRecipes = async (isNewGeneration = false) => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log("🤖 Starting enhanced recipe generation...");
      console.log("Regeneration count:", regenerationCount);
      console.log("Shown recipes:", shownRecipeIds.size);

      // Step 1: Analyze with Groq (only on first load or every 3rd regeneration)
      let analysis = groqAnalysis;

      if (!groqAnalysis || (isNewGeneration && regenerationCount % 3 === 0)) {
        console.log("🔄 Running fresh Groq analysis...");
        analysis = await analyzeRecipeRequest({
          searchText,
          images,
          preferences,
        });
        setGroqAnalysis(analysis);
        console.log("✅ Groq analysis complete");
        console.log("Confidence:", analysis.confidence);
        console.log("Conflicts:", analysis.conflicts.hasConflicts);
      } else {
        console.log("♻️ Using cached Groq analysis");
      }

      // Step 2: Progressive variation strategy
      const spoonacularParams = applyProgressiveVariation(
        analysis!,
        regenerationCount,
        isNewGeneration
      );

      console.log("🔍 Searching with params:", spoonacularParams);

      // Step 3: Search recipes
      const results = await searchRecipes(spoonacularParams);

      console.log(`✅ Found ${results.results.length} recipes`);

      // Step 4: Filter out already shown recipes (if we have enough)
      let filteredRecipes = results.results as SpoonacularRecipe[];

      if (shownRecipeIds.size > 0 && filteredRecipes.length > 10) {
        const newRecipes = filteredRecipes.filter(
          (r) => !shownRecipeIds.has(r.id)
        );

        if (newRecipes.length >= 5) {
          console.log(
            `📊 Filtered out ${
              filteredRecipes.length - newRecipes.length
            } already shown recipes`
          );
          filteredRecipes = newRecipes;
        } else {
          console.log("⚠️ Not enough new recipes, showing all");
        }
      }

      // Step 5: Update state
      setRecipes(filteredRecipes);

      // Track shown recipes
      const newShownIds = new Set(shownRecipeIds);
      filteredRecipes.forEach((r) => newShownIds.add(r.id));
      setShownRecipeIds(newShownIds);

      if (isNewGeneration) {
        setRegenerationCount((prev) => prev + 1);
      }

      // Fade in
      setTimeout(() => {
        setIsGenerating(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 500);
    } catch (err) {
      console.error("❌ Recipe generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate recipes"
      );
      setIsGenerating(false);

      Alert.alert(
        "Generation Failed",
        "Failed to generate recipes. Please try again.",
        [
          { text: "Go Back", onPress: () => router.back() },
          { text: "Retry", onPress: () => generateRecipes(false) },
        ]
      );
    }
  };

  /**
   * PROGRESSIVE VARIATION STRATEGY
   */
  const applyProgressiveVariation = (
    analysis: RecipeAnalysisResponse,
    count: number,
    isNew: boolean
  ): any => {
    const baseParams = groqToSpoonacularParams(analysis);

    if (!isNew) {
      // Initial load - use exact search
      return baseParams;
    }

    // Progressive variation based on regeneration count
    const strategy = count % 4;

    switch (strategy) {
      case 0:
        // Strategy 1: Similar (next page of same search)
        console.log("📊 Strategy 1: Similar recipes (offset pagination)");
        return {
          ...baseParams,
          offset: currentOffset + 20,
        };

      case 1:
        // Strategy 2: Related (same cuisine, different ingredients)
        console.log("📊 Strategy 2: Related recipes (same cuisine, broaden)");
        return {
          ...baseParams,
          sort: "popularity",
          includeIngredients: undefined, // Remove specific ingredients
          maxReadyTime: undefined, // Remove time constraint
          offset: 0,
        };

      case 2:
        // Strategy 3: Different (related cuisine, same dietary)
        console.log("📊 Strategy 3: Different recipes (related cuisine)");
        const currentCuisine = analysis.extractedKeyPoints.cuisine.requested;
        const alternatives = analysis.extractedKeyPoints.cuisine.alternatives;

        return {
          ...baseParams,
          cuisine: alternatives.length > 0 ? alternatives[0] : undefined,
          query: baseParams.query?.split(" ").slice(0, 1).join(" "), // Simplify query
          sort: "meta-score",
          includeIngredients: undefined,
          offset: 0,
        };

      case 3:
      default:
        // Strategy 4: Surprise (random with dietary constraints)
        console.log("📊 Strategy 4: Surprise recipes (random)");
        return {
          number: 20,
          addRecipeInformation: true,
          sort: "random",
          // Keep ONLY critical filters
          diet: baseParams.diet,
          intolerances: baseParams.intolerances,
          excludeIngredients: baseParams.excludeIngredients,
          offset: 0,
        };
    }
  };

  /**
   * Handle regenerate
   */
  const handleRegenerate = () => {
    setRecipes([]);
    fadeAnim.setValue(0);
    generateRecipes(true);
  };

  /**
   * Handle recipe press
   */
  const handleRecipePress = (recipe: SpoonacularRecipe) => {
    router.push(`/recipes/details?id=${recipe.id}`);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Loading State
  if (isGenerating) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />

        <View
          style={{
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: colors.cardBg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.textPrimary,
            }}
          >
            AI Suggestions
          </Text>
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 20,
          }}
        >
          <Animated.View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${colors.primary}15`,
              marginBottom: 32,
              transform: [{ scale: scaleAnim }, { rotate: spin }],
            }}
          >
            <Sparkles size={60} color={colors.primary} strokeWidth={1.5} />
          </Animated.View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: colors.textPrimary,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            {regenerationCount === 0
              ? "Analyzing Your Request..."
              : "Finding New Recipes..."}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: "center",
              maxWidth: "85%",
              lineHeight: 22,
            }}
          >
            {regenerationCount === 0
              ? "AI is analyzing your preferences and creating personalized recipes"
              : `Finding fresh suggestions (Strategy ${
                  (regenerationCount % 4) + 1
                }/4)`}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <View
          style={{
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: colors.cardBg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "600",
              color: colors.textPrimary,
            }}
          >
            AI Suggestions
          </Text>
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
            Generation Failed
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={() => generateRecipes(false)}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Success State
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          backgroundColor: colors.cardBg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.background,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: colors.textPrimary,
              }}
            >
              AI Suggestions
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAnalysisDetails(!showAnalysisDetails)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Info size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Analysis Summary */}
        {groqAnalysis && (
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 12,
              padding: 12,
              marginTop: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <CheckCircle2
                  size={16}
                  color={
                    groqAnalysis.confidence > 0.7
                      ? "#10B981"
                      : groqAnalysis.confidence > 0.4
                      ? "#F59E0B"
                      : "#EF4444"
                  }
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textPrimary,
                  }}
                >
                  Match Quality:{" "}
                  {groqAnalysis.confidence > 0.7
                    ? "Excellent"
                    : groqAnalysis.confidence > 0.4
                    ? "Good"
                    : "Fair"}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
              >
                {recipes.length} recipes
              </Text>
            </View>

            {/* Conflicts Badge */}
            {groqAnalysis.conflicts.hasConflicts && (
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  borderRadius: 8,
                  padding: 8,
                  marginTop: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AlertTriangle size={14} color="#F59E0B" />
                <Text
                  style={{
                    fontSize: 12,
                    color: "#92400E",
                    flex: 1,
                  }}
                >
                  {`${groqAnalysis.conflicts.resolved.length} preference${
                    groqAnalysis.conflicts.resolved.length > 1 ? "s" : ""
                  } adapted`}
                </Text>
              </View>
            )}

            {/* Detailed Analysis (Expandable) */}
            {showAnalysisDetails && (
              <View style={{ marginTop: 12, gap: 8 }}>
                {/* Primary Ingredients */}
                {groqAnalysis?.extractedKeyPoints?.primaryIngredients?.items
                  ?.length > 0 && (
                  <View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: colors.textSecondary,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Detected Ingredients
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textPrimary,
                      }}
                    >
                      {groqAnalysis.extractedKeyPoints.primaryIngredients.items.join(
                        ", "
                      )}
                    </Text>
                  </View>
                )}

                {/* Applied Filters */}
                {groqAnalysis?.appliedFilters?.critical?.allergies?.length >
                  0 && (
                  <View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#EF4444",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      🚨 Allergies Excluded
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textPrimary,
                      }}
                    >
                      {(
                        groqAnalysis.appliedFilters.critical.allergies || []
                      ).join(", ")}
                    </Text>
                  </View>
                )}

                {groqAnalysis?.appliedFilters?.high?.diets?.length > 0 && (
                  <View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: colors.textSecondary,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Dietary Filters
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textPrimary,
                      }}
                    >
                      {(groqAnalysis.appliedFilters.high.diets || []).join(
                        ", "
                      )}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Recipes List */}
      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ padding: 20 }}
      >
        <View style={{ gap: 16 }}>
          {recipes.map((recipe, index) => (
            <RecipeCard
              key={`${recipe.id}-${index}`}
              recipe={recipe}
              onPress={() => handleRecipePress(recipe)}
              colors={colors}
            />
          ))}
        </View>

        {/* Generate New Button */}
        <TouchableOpacity
          onPress={handleRegenerate}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            marginTop: 24,
            marginBottom: 40,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <RefreshCw size={20} color="#FFFFFF" />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#FFFFFF",
            }}
          >
            Generate New Recipes
          </Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

/**
 * Recipe Card Component
 */
function RecipeCard({
  recipe,
  onPress,
  colors,
}: {
  recipe: SpoonacularRecipe;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Image
        source={{
          uri: recipe.image || "https://via.placeholder.com/400x200",
        }}
        style={{ width: "100%", height: 200 }}
        resizeMode="cover"
      />

      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: colors.textPrimary,
            marginBottom: 8,
          }}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* CRASH FIX: Ensure value is greater than 0 explicitly. 
              {0 && <View/>} renders the number 0 and crashes RN.
          */}
          {(recipe.readyInMinutes || 0) > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Clock size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                }}
              >
                {recipe.readyInMinutes} min
              </Text>
            </View>
          )}

          {(recipe.servings || 0) > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Users size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                }}
              >
                {recipe.servings} servings
              </Text>
            </View>
          )}

          {(recipe.healthScore || 0) > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Flame size={14} color="#10B981" />
              <Text
                style={{
                  fontSize: 13,
                  color: "#10B981",
                  fontWeight: "600",
                }}
              >
                {recipe.healthScore}%
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
