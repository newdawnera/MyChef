// app/recipes/details.tsx - ENHANCED WITH ANIMATIONS & TOOLTIPS
/**
 * Enhanced features:
 * 1. Tooltip labels on press for meta icons (3 sec display)
 * 2. Parallax zoom effect on hero image while scrolling
 * 3. Smooth tab transitions matching reference code
 * 4. Preserves all API calling logic
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
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

// Tooltip Component for Meta Icons
interface TooltipProps {
  visible: boolean;
  label: string;
  color?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  visible,
  label,
  color = "#70AD47",
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: "absolute",
        bottom: "150%",
        left: "50%",
        transform: [{ translateX: -50 }, { scale: scaleAnim }],
        opacity: fadeAnim,
        backgroundColor: color,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        zIndex: 1000,
        minWidth: 100,
        maxWidth: 160,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 13,
          fontWeight: "600",
          textAlign: "center",
          flexWrap: "wrap",
        }}
      >
        {label}
      </Text>
      {/* Tooltip Arrow */}
      <View
        style={{
          position: "absolute",
          bottom: -5,
          left: "50%",
          marginLeft: -5,
          width: 10,
          height: 10,
          backgroundColor: color,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </Animated.View>
  );
};

// Meta Info Item with Tooltip
interface MetaItemProps {
  icon: any;
  value: string;
  label: string;
  color: string;
}

const MetaItem: React.FC<MetaItemProps> = ({
  icon: Icon,
  value,
  label,
  color,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef<number | null>(null);

  const handlePressIn = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setShowTooltip(true);
    Animated.spring(scaleAnim, {
      toValue: 1.15,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    // Hide tooltip after 3 seconds
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 3000);

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        position: "relative",
        alignItems: "center",
        backgroundColor: "rgba(112, 173, 71, 0.08)",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(112, 173, 71, 0.15)",
      }}
    >
      <Tooltip visible={showTooltip} label={label} color={color} />
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Icon size={18} color={color} />
        <Text style={{ fontSize: 14, color: color, fontWeight: "600" }}>
          {value}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

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

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  // Tab content slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Handle tab change with slide animation
  const handleTabChange = (tab: "ingredients" | "instructions") => {
    if (tab === activeTab) return;

    // Determine slide direction
    const slideDirection = tab === "instructions" ? -1 : 1; // Left for instructions, right for ingredients

    // Slide out current content
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: slideDirection * 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change tab
      setActiveTab(tab);

      // Reset position for slide in from opposite direction
      slideAnim.setValue(slideDirection * -50);

      // Slide in new content
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

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

  // Parallax zoom effect for hero image
  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.5, 1],
    extrapolateRight: "clamp",
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [50, 0, -50],
    extrapolate: "clamp",
  });

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

      {/* Hero Image with Parallax */}
      <View style={{ height: 320, position: "relative", overflow: "hidden" }}>
        <Animated.Image
          source={{ uri: recipe.image }}
          style={{
            width: "100%",
            height: "120%",
            transform: [{ scale: imageScale }, { translateY: imageTranslateY }],
          }}
          resizeMode="cover"
        />

        {/* Gradient Overlay - Lower height to match reference */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%", // Reduced from 50% to match reference
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
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
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.15,
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
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.15,
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
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
            >
              <Share2 size={20} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Title Overlay - Positioned lower to match reference */}
        <View
          style={{
            position: "absolute",
            bottom: 16, // Reduced from 20
            left: 20,
            right: 20,
          }}
        >
          <Text
            style={{
              fontSize: 24, // Slightly smaller to match reference
              fontWeight: "700",
              color: "#FFFFFF",
              textShadowColor: "rgba(0, 0, 0, 0.6)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {recipe.title}
          </Text>
        </View>
      </View>

      {/* Recipe Content */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottom + 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Meta Info with Tooltips */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingTop: 24,
            paddingBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-around",
              backgroundColor: colors.background,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <MetaItem
              icon={Clock}
              value={`${recipe.readyInMinutes} min`}
              label="Cooking Time"
              color={colors.textSecondary}
            />

            <View
              style={{
                width: 2,
                height: 24,
                backgroundColor: colors.border,
              }}
            />

            <MetaItem
              icon={Users}
              value={`${recipe.servings}`}
              label="Servings"
              color={colors.textSecondary}
            />

            <View
              style={{
                width: 2,
                height: 24,
                backgroundColor: colors.border,
              }}
            />

            <MetaItem
              icon={ChefHat}
              value={difficulty}
              label="Difficulty"
              color={colors.textSecondary}
            />

            {recipe.healthScore && (
              <>
                <View
                  style={{
                    width: 2,
                    height: 24,
                    backgroundColor: colors.border,
                  }}
                />

                <MetaItem
                  icon={Flame}
                  value={`${Math.round(recipe.healthScore)}%`}
                  label="Health Score"
                  color="#70AD47"
                />
              </>
            )}
          </View>
        </View>

        {/* Description */}
        {recipe.summary && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                lineHeight: 24,
                textAlign: "justify",
              }}
            >
              {recipe.summary.replace(/<[^>]*>/g, "")}
            </Text>
          </View>
        )}

        {/* Tabs - Matching reference smooth transitions */}
        <View
          style={{
            paddingHorizontal: 20,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 4,
              flexDirection: "row",
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => handleTabChange("ingredients")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor:
                  activeTab === "ingredients" ? colors.primary : "transparent",
                shadowColor:
                  activeTab === "ingredients" ? colors.primary : "transparent",
                shadowOpacity: activeTab === "ingredients" ? 0.3 : 0,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: activeTab === "ingredients" ? 3 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
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
              onPress={() => handleTabChange("instructions")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor:
                  activeTab === "instructions" ? colors.primary : "transparent",
                shadowColor:
                  activeTab === "instructions" ? colors.primary : "transparent",
                shadowOpacity: activeTab === "instructions" ? 0.3 : 0,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: activeTab === "instructions" ? 3 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
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
        </View>

        {/* Tab Content with Slide Animation */}
        <Animated.View
          style={{
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          }}
        >
          {activeTab === "ingredients" ? (
            <View style={{ paddingHorizontal: 20, gap: 12 }}>
              {recipe.extendedIngredients &&
              recipe.extendedIngredients.length > 0 ? (
                recipe.extendedIngredients.map((ingredient, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      backgroundColor: colors.cardBg,
                      padding: 16,
                      borderRadius: 16,
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                      borderWidth: 1,
                      borderColor: colors.border || "#F3F4F6",
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.primary,
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
            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              {recipe.analyzedInstructions &&
              recipe.analyzedInstructions.length > 0 &&
              recipe.analyzedInstructions[0].steps ? (
                recipe.analyzedInstructions[0].steps.map((step, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      gap: 16,
                      backgroundColor: colors.cardBg,
                      padding: 16,
                      borderRadius: 16,
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                      borderWidth: 1,
                      borderColor: colors.border || "#F3F4F6",
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: `${colors.primary}10`,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: `${colors.primary}20`,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.primary,
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
        </Animated.View>
      </Animated.ScrollView>

      {/* Start Cooking Button */}
      <View
        style={{
          position: "absolute",
          bottom: bottom || 10,
          left: 20,
          right: 20,
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            shadowColor: colors.primary,
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
          activeOpacity={0.8}
        >
          <ChefHat size={22} color="#FFFFFF" />
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: "#FFFFFF",
            }}
          >
            Start Cooking
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
