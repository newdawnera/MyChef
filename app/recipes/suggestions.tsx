// app/recipes/suggestions.tsx - AI Suggestions with Real Spoonacular Data
/**
 * This screen now:
 * 1. Receives search params from Home screen
 * 2. Calls Groq AI for analysis
 * 3. Fetches real recipes from Spoonacular
 * 4. Displays results with proper loading/error states
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
import { ArrowLeft, Clock, Flame, Users, Sparkles } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { usePreferences } from "@/hooks/usePreferences";
import { analyzeRecipeRequest } from "@/services/groqServices";
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

  // Extract params from navigation
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
   * Main recipe generation flow
   */
  const generateRecipes = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log("🤖 Starting AI recipe generation...");
      console.log("Search:", searchText);
      console.log("Images:", images.length);

      // Step 1: Analyze with Groq AI
      const groqResponse = await analyzeRecipeRequest({
        searchText,
        images,
        preferences,
      });

      console.log("✅ Groq analysis complete:", groqResponse);

      // Step 2: Convert to Spoonacular parameters
      const spoonacularParams = groqToSpoonacularParams(groqResponse);

      console.log("🔍 Searching Spoonacular with:", spoonacularParams);

      // Step 3: Search recipes
      const results = await searchRecipes(spoonacularParams);

      console.log(`✅ Found ${results.results.length} recipes`);

      // If no results, try a simpler search
      if (results.results.length === 0) {
        console.log("⚠️ No results, trying simpler search...");
        const fallbackResults = await searchRecipes({
          query: searchText || "popular recipes",
          number: 10,
          addRecipeInformation: true,
        });
        setRecipes(fallbackResults.results as any);
      } else {
        setRecipes(results.results as any);
      }

      // Fade in recipes
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
          { text: "Retry", onPress: generateRecipes },
        ]
      );
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  /**
   * Handle recipe press
   */
  const handleRecipePress = (recipe: SpoonacularRecipe) => {
    router.push(`/recipes/details?id=${recipe.id}`);
  };

  /**
   * Handle regenerate
   */
  const handleRegenerate = () => {
    setRecipes([]);
    generateRecipes();
  };

  // Loading State
  if (isGenerating) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["bottom"]}
      >
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />

        {/* Header */}
        <View
          style={{
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: colors.cardBg,
            shadowColor: colors.shadow,
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
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

        {/* Loading State */}
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
            Generating Recipes...
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
            AI is analyzing your preferences and creating personalized recipes
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
        edges={["bottom"]}
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
            onPress={handleRegenerate}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 24,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Results State
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["bottom"]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: colors.cardBg,
          shadowColor: colors.shadow,
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
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
          style={{ fontSize: 20, fontWeight: "600", color: colors.textPrimary }}
        >
          AI Suggestions
        </Text>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        >
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 20,
            }}
          >
            Based on your preferences, we found{" "}
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              {recipes.length} recipes
            </Text>{" "}
            for you
          </Text>

          {/* Recipe Cards */}
          {recipes.map((recipe) => {
            const difficulty = calculateDifficulty(recipe);
            const tags = [
              ...(recipe.diets || []),
              ...(recipe.dishTypes?.slice(0, 1) || []),
            ];

            return (
              <TouchableOpacity
                key={recipe.id}
                style={{
                  backgroundColor: colors.cardBg,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 16,
                  overflow: "hidden",
                  shadowColor: colors.shadow,
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }}
                onPress={() => handleRecipePress(recipe)}
              >
                {/* Image */}
                <View style={{ height: 200, position: "relative" }}>
                  <Image
                    source={{ uri: recipe.image }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />

                  {/* Tags */}
                  {tags.length > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        flexDirection: "row",
                        gap: 8,
                        flexWrap: "wrap",
                        maxWidth: "70%",
                      }}
                    >
                      {tags.slice(0, 2).map((tag) => (
                        <View
                          key={tag}
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: 12,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: colors.primary,
                              fontWeight: "600",
                              textTransform: "capitalize",
                            }}
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Difficulty Badge */}
                  <View
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#FF9500",
                        fontWeight: "600",
                      }}
                    >
                      {difficulty}
                    </Text>
                  </View>
                </View>

                {/* Content */}
                <View style={{ padding: 16 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: colors.textPrimary,
                      marginBottom: 12,
                    }}
                    numberOfLines={2}
                  >
                    {recipe.title}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Clock size={16} color={colors.textSecondary} />
                      <Text
                        style={{ fontSize: 13, color: colors.textSecondary }}
                      >
                        {recipe.readyInMinutes} min
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Users size={16} color={colors.textSecondary} />
                      <Text
                        style={{ fontSize: 13, color: colors.textSecondary }}
                      >
                        {recipe.servings} servings
                      </Text>
                    </View>
                    {recipe.healthScore && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Flame size={16} color={colors.textSecondary} />
                        <Text
                          style={{ fontSize: 13, color: colors.textSecondary }}
                        >
                          {Math.round(recipe.healthScore)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Regenerate Button */}
          <TouchableOpacity
            onPress={handleRegenerate}
            style={{
              marginTop: 8,
              marginBottom: 24,
              paddingVertical: 16,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.cardBg,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              shadowColor: colors.shadow,
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Sparkles size={20} color={colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.primary,
              }}
            >
              Generate New Recipes
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
