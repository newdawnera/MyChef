import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Pressable,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Flame,
  SlidersHorizontal,
} from "lucide-react-native";
import {
  SPACING,
  SHADOWS,
  COLORS as STATIC_COLORS,
} from "@/constants/categories"; // Renamed to avoid conflict
import { useTheme } from "@/contexts/ThemeContext"; // 1. Import Theme Hook

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  nutrition?: {
    nutrients: Array<{ name: string; amount: number }>;
  };
}

// Recipe Card Component with Responsive Width
interface RecipeCardProps {
  recipe: Recipe;
  cardWidth: string;
  onPress: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  cardWidth,
  onPress,
}) => {
  const { colors } = useTheme(); // 2. Use theme colors inside card

  const getCalories = () => {
    const calorieNutrient = recipe.nutrition?.nutrients.find(
      (n) => n.name === "Calories"
    );
    return calorieNutrient ? Math.round(calorieNutrient.amount) : null;
  };

  const calories = getCalories();

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          marginBottom: 16,
        },
        { width: cardWidth as any },
      ]}
    >
      {({ pressed }) => (
        <View
          style={{
            backgroundColor: colors.cardBg, // Dynamic Card BG
            borderRadius: SPACING.borderRadius,
            overflow: "hidden",
            ...SHADOWS.card,
            shadowColor: colors.shadow, // Dynamic Shadow
            borderWidth: 1,
            borderColor: colors.border, // Dynamic Border
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          }}
        >
          {/* Recipe Image */}
          <Image
            source={{ uri: recipe.image }}
            style={{
              width: "100%",
              height: cardWidth === "100%" ? 200 : 140,
              backgroundColor: colors.background,
            }}
            resizeMode="cover"
          />

          {/* Recipe Info */}
          <View style={{ padding: 12 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: colors.textPrimary, // Dynamic Text
                marginBottom: 8,
              }}
              numberOfLines={2}
            >
              {recipe.title}
            </Text>

            {/* Meta Info */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clock size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary, // Dynamic Secondary Text
                  marginLeft: 4,
                }}
              >
                {recipe.readyInMinutes} min
              </Text>

              {calories && (
                <>
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginHorizontal: 8,
                    }}
                  >
                    •
                  </Text>
                  <Flame size={14} color={colors.textSecondary} />
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textSecondary,
                      marginLeft: 4,
                    }}
                  >
                    {calories} cal
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

// Main Category Results Screen
export default function CategoryResultsScreen() {
  const { colors, theme } = useTheme(); // 3. Get Theme context
  const params = useLocalSearchParams();
  const { category, label, query, color } = params;

  // Determine the header color (Dynamic from params or fallback to theme primary)
  const headerColor = (color as string) || colors.primary;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [layoutType, setLayoutType] = useState<"grid" | "list">("grid");

  // Dynamic responsive state
  const [screenDimensions, setScreenDimensions] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  // Calculate card width based on screen size and layout type
  const getCardWidth = () => {
    const { width } = screenDimensions;

    if (layoutType === "list") {
      return "100%";
    }

    // Grid layout
    if (width < 375) {
      return "100%"; // Single column for very small screens
    } else if (width < 768) {
      return "48%"; // 2 columns for phones
    } else {
      return "31%"; // 3 columns for tablets
    }
  };

  const cardWidth = getCardWidth();
  const numColumns =
    layoutType === "list"
      ? 1
      : screenDimensions.width < 375
      ? 1
      : screenDimensions.width < 768
      ? 2
      : 3;

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  // Fetch recipes on mount
  useEffect(() => {
    fetchRecipes();
  }, [query]);

  const fetchRecipes = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Replace with your Spoonacular API key
      const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
      const response = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=20&addRecipeNutrition=true&apiKey=${API_KEY}`
      );
      const data = await response.json();
      setRecipes(data.results || []);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRecipes(true);
  };

  const toggleLayoutType = () => {
    setLayoutType((prev) => (prev === "grid" ? "list" : "grid"));
  };

  const handleRecipePress = (recipeId: number) => {
    router.push({
      pathname: "/recipes/details",
      params: { recipeId },
    });
  };

  return (
    // 4. Apply header color to SafeAreaView to stretch it upwards
    <SafeAreaView
      style={{ flex: 1, backgroundColor: headerColor }}
      edges={["top"]} // Only pad top (status bar)
    >
      <StatusBar barStyle="light-content" />

      {/* Header with Category Banner */}
      <View
        style={{
          backgroundColor: headerColor, // Matches SafeAreaView
          paddingHorizontal: SPACING.containerPadding,
          paddingTop: 16,
          paddingBottom: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          zIndex: 1, // Ensure it sits on top of content
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left side: Back button and title */}
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <ArrowLeft size={20} color="#ffffff" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: screenDimensions.width < 375 ? 20 : 24,
                  fontWeight: "700",
                  color: "#ffffff",
                }}
                numberOfLines={1}
              >
                {label}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "400",
                  color: "rgba(255, 255, 255, 0.9)",
                  marginTop: 2,
                }}
              >
                {recipes.length} recipes found
              </Text>
            </View>
          </View>

          {/* Right side: Layout toggle button */}
          <TouchableOpacity
            onPress={toggleLayoutType}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 12,
            }}
          >
            <SlidersHorizontal size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Content Wrapper with Theme Background Color */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: SPACING.containerPadding,
            paddingTop: 20,
            paddingBottom: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={headerColor}
              colors={[headerColor]}
            />
          }
        >
          {loading ? (
            // Loading State
            <View style={{ paddingTop: 60, alignItems: "center" }}>
              <ActivityIndicator size="large" color={headerColor} />
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginTop: 12,
                }}
              >
                Loading delicious recipes...
              </Text>
            </View>
          ) : recipes.length === 0 ? (
            // Empty State
            <View style={{ paddingTop: 60, alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.textPrimary,
                  marginBottom: 8,
                }}
              >
                No recipes found
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                Try searching for a different category
              </Text>
            </View>
          ) : (
            // Recipes Grid/List
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent:
                  layoutType === "list" ? "flex-start" : "space-between",
              }}
            >
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  cardWidth={cardWidth}
                  onPress={() => handleRecipePress(recipe.id)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Floating Action Info (Optional) */}
        {!loading && recipes.length > 0 && (
          <View
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              backgroundColor: headerColor,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              shadowColor: colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {layoutType === "grid"
                ? `${numColumns} column${numColumns > 1 ? "s" : ""}`
                : "List view"}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
