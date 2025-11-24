import React, { useEffect, useState, useCallback } from "react";
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
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Flame,
  SlidersHorizontal,
  Search,
  X,
} from "lucide-react-native";
import {
  SPACING,
  SHADOWS,
  COLORS as STATIC_COLORS,
} from "@/constants/categories";
import { useTheme } from "@/contexts/ThemeContext";

interface Recipe {
  id: number;
  title: string;
  image: string;
  readyInMinutes: number;
  nutrition?: {
    nutrients: Array<{ name: string; amount: number }>;
  };
  pricePerServing?: number;
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
  const { colors } = useTheme();

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
          height: 260, // Fixed height
        },
        { width: cardWidth as any },
      ]}
    >
      {({ pressed }) => (
        <View
          style={{
            flex: 1,
            backgroundColor: colors.cardBg,
            borderRadius: SPACING.borderRadius,
            overflow: "hidden",
            ...SHADOWS.card,
            shadowColor: colors.shadow,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          }}
        >
          {/* Recipe Image - Fixed height */}
          <Image
            source={{ uri: recipe.image }}
            style={{
              width: "100%",
              height: 140,
              backgroundColor: colors.background,
            }}
            resizeMode="cover"
          />

          {/* Recipe Info */}
          <View
            style={{
              padding: 12,
              flex: 1,
              justifyContent: "space-between",
            }}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.textPrimary,
                marginBottom: 4,
                lineHeight: 20,
              }}
            >
              {recipe.title}
            </Text>

            {/* Meta Info */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: "auto",
              }}
            >
              <Clock size={14} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
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
  const { colors, theme } = useTheme();
  const params = useLocalSearchParams();
  const { category, label, query, color } = params;

  // Determine the header color
  const headerColor = (color as string) || colors.primary;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [layoutType, setLayoutType] = useState<"grid" | "list">("grid");

  // Search State
  const [searchText, setSearchText] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // The actual search term used in API

  // Dynamic responsive state
  const [screenDimensions, setScreenDimensions] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  // Debounce Search: Only update activeSearch when user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchText);
    }, 600); // 600ms delay

    return () => clearTimeout(timer);
  }, [searchText]);

  // Calculate card width
  const getCardWidth = () => {
    const { width } = screenDimensions;
    if (layoutType === "list") return "100%";
    if (width < 375) return "100%";
    else if (width < 768) return "48%";
    else return "31%";
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

  // Fetch recipes when activeSearch or category changes
  useEffect(() => {
    fetchRecipes();
  }, [activeSearch, category]);

  const fetchRecipes = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;

      // Base URL
      let baseUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=20&addRecipeNutrition=true`;
      let filterParams = "";

      // 1. Apply User Search Text (if exists)
      if (activeSearch.trim()) {
        filterParams += `&query=${encodeURIComponent(activeSearch)}`;
      }

      // 2. Apply STRICT Category Filters
      // We switch based on the category ID to apply the correct API parameter
      // instead of just appending a generic query string.
      switch (category) {
        // --- MEAL TYPES ---
        case "breakfast":
          filterParams += "&type=breakfast";
          break;
        case "lunch":
          // Spoonacular doesn't have a strict 'lunch' type, usually main course + salad/soup/sandwich covers it,
          // but we can query for it or use main course
          filterParams += "&type=main course";
          break;
        case "dinner":
          filterParams += "&type=main course";
          break;
        case "desserts":
          filterParams += "&type=dessert";
          break;
        case "snacks":
          filterParams += "&type=snack";
          break;
        case "drinks":
          filterParams += "&type=drink";
          break;
        case "soup":
          filterParams += "&type=soup";
          break;
        case "appetizers":
          filterParams += "&type=appetizer";
          break;
        case "salad": // Assuming you might have this
          filterParams += "&type=salad";
          break;

        // --- DIETS ---
        case "vegetarian":
          filterParams += "&diet=vegetarian";
          break;
        case "vegan":
          filterParams += "&diet=vegan";
          break;
        case "pescetarian":
          filterParams += "&diet=pescetarian";
          break;
        case "gluten-free":
          filterParams += "&intolerances=gluten";
          break;
        case "dairy-free":
          filterParams += "&intolerances=dairy";
          break;
        case "ketogenic": // If you have this
          filterParams += "&diet=ketogenic";
          break;

        // --- SPECIAL CATEGORIES ---
        case "low-calorie":
          filterParams += "&maxCalories=500&sort=calories&sortDirection=asc";
          break;
        case "high-protein":
          filterParams += "&minProtein=30&sort=protein&sortDirection=desc";
          break;
        case "budget":
          filterParams += "&sort=price&sortDirection=asc&type=main course";
          break;
        case "quick-meals":
          filterParams += "&maxReadyTime=30";
          break;

        // --- DEFAULT FALLBACK ---
        default:
          // If it's none of the above, fallback to the generic query string passed from the previous screen
          // Only append if user hasn't typed their own search, OR if we want to combine them
          if (!activeSearch.trim() && query && query !== "undefined") {
            filterParams += `&query=${query}`;
          }
          break;
      }

      const finalUrl = `${baseUrl}${filterParams}`;
      console.log(`🔍 Fetching: ${finalUrl}`);

      const response = await fetch(finalUrl);
      const data = await response.json();

      if (data.status === "failure") {
        throw new Error(data.message);
      }

      setRecipes(data.results || []);
    } catch (error) {
      console.error("❌ Error fetching recipes:", error);
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
      params: { id: recipeId },
    });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: headerColor }}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" />

      {/* Header Container */}
      <View
        style={{
          backgroundColor: headerColor,
          paddingTop: 16,
          paddingBottom: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          zIndex: 1,
        }}
      >
        {/* Top Row: Back, Title, Layout Toggle */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: SPACING.containerPadding,
            marginBottom: 16,
          }}
        >
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

        {/* Search Bar (New Addition) */}
        <View style={{ paddingHorizontal: SPACING.containerPadding }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 44,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.3)",
            }}
          >
            <Search size={18} color="rgba(255, 255, 255, 0.8)" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={`Search in ${label}...`}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              style={{
                flex: 1,
                marginLeft: 8,
                color: "#ffffff",
                fontSize: 15,
                height: "100%",
              }}
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")}>
                <X size={18} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Content Wrapper */}
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
            <View style={{ paddingTop: 60, alignItems: "center" }}>
              <ActivityIndicator size="large" color={headerColor} />
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginTop: 12,
                }}
              >
                Searching...
              </Text>
            </View>
          ) : recipes.length === 0 ? (
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
                  paddingHorizontal: 40,
                }}
              >
                Try adjusting your search or checking another category.
              </Text>
            </View>
          ) : (
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
