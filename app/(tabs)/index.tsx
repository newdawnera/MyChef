// app/(tabs)/index.tsx - Enhanced Home Screen with AI Search
import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Pressable,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  User,
} from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { CATEGORIES, SPACING } from "@/constants/categories";
import { ImprovedSearchBar } from "@/components/ImprovedSearchBar";
import { useRecentRecipes } from "@/hooks/useRecentRecipes";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// Helper: Get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
};

// Friendly cooking prompts (3 words max)
const COOKING_PROMPTS = [
  "What's cooking today?",
  "Ready to cook?",
  "Feeling hungry today?",
  "Let's make magic!",
  "Time to cook!",
  "Craving something delicious?",
  "Let's get cooking!",
  "Hungry for more?",
  "Cook something amazing!",
  "What sounds good?",
];

// Get random prompt
const getRandomPrompt = () => {
  return COOKING_PROMPTS[Math.floor(Math.random() * COOKING_PROMPTS.length)];
};

// Category Carousel Item Component
interface CategoryCarouselItemProps {
  category: (typeof CATEGORIES)[0];
  onPress: () => void;
}

const CategoryCarouselItemComponent: React.FC<CategoryCarouselItemProps> = ({
  category,
  onPress,
}) => {
  const { colors } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(1));
  const Icon = category.icon;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        marginRight: 16,
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: SPACING.borderRadius,
            backgroundColor: colors.cardBg,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
            borderWidth: 1,
            borderColor: category.borderColor,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Icon size={30} color={category.color} strokeWidth={1.8} />
        </View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
            color: colors.textPrimary,
            textAlign: "center",
            maxWidth: 72,
          }}
          numberOfLines={1}
        >
          {category.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

CategoryCarouselItemComponent.displayName = "CategoryCarouselItem";
const CategoryCarouselItem = React.memo(CategoryCarouselItemComponent);

// Recipe Carousel Item Component (Medium size - 160px)
interface RecipeCarouselItemProps {
  recipe: any;
  onPress: () => void;
}

const RecipeCarouselItemComponent: React.FC<RecipeCarouselItemProps> = ({
  recipe,
  onPress,
}) => {
  const { colors } = useTheme();
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Extract calories from recipe (cached from when it was viewed)
  const getCalories = () => {
    const targetRecipe = recipe.recipe;
    if (!targetRecipe) return "N/A";

    // 1. Check for nutrient array (Standard Spoonacular)
    if (targetRecipe.nutrition?.nutrients) {
      const calorieNutrient = targetRecipe.nutrition.nutrients.find(
        (n: any) => n.name === "Calories"
      );
      if (calorieNutrient) return `${Math.round(calorieNutrient.amount)} cal`;
    }

    // 2. Fallbacks for other data structures
    if (targetRecipe.calories)
      return `${Math.round(targetRecipe.calories)} cal`;
    if (targetRecipe.nutrition?.calories)
      return `${Math.round(targetRecipe.nutrition.calories)} cal`;

    return "N/A";
  };

  const calories = getCalories();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        marginRight: 16,
        width: 160,
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          backgroundColor: colors.cardBg, // White/Card background
          borderRadius: 16,
          overflow: "hidden", // Clips image to border radius
          // Shadow for iOS
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          // Shadow for Android
          elevation: 4,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Recipe Image */}
        <Image
          source={{ uri: recipe.recipe?.image }}
          style={{
            width: "100%",
            height: 120, // Slightly shorter image to fit card style
            backgroundColor: colors.background,
          }}
          resizeMode="cover"
        />

        {/* Recipe Info Container */}
        <View style={{ padding: 12 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.textPrimary,
              marginBottom: 8,
              lineHeight: 20,
            }}
            numberOfLines={2}
          >
            {recipe.recipe?.title}
          </Text>

          {/* Time and Calories Row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clock size={12} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  marginLeft: 4,
                }}
              >
                {recipe.recipe?.readyInMinutes || "N/A"}m
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Flame size={12} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  marginLeft: 4,
                }}
              >
                {calories}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

RecipeCarouselItemComponent.displayName = "RecipeCarouselItem";
const RecipeCarouselItem = React.memo(RecipeCarouselItemComponent);

// Recipe Card Component
export default function HomeScreen() {
  const { colors, theme } = useTheme();
  const [search, setSearch] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [allItemsShowing, setAllItemsShowing] = useState(false);

  const sheenAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // A. Button Sheen Loop (Runs every 5 seconds)
    const sheenLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheenAnim, {
          toValue: 1,
          duration: 1000, // Sweep takes 1 second
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(4000), // Wait 4 seconds
      ])
    );

    // B. Avatar Glow Rotation (Continuous)
    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 16000, // One full rotation every 12 seconds
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    sheenLoop.start();
    rotateLoop.start();

    return () => {
      sheenLoop.stop();
      rotateLoop.stop();
    };
  }, []);

  // 3. ADD: Interpolations
  const sheenTranslate = sheenAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300], // Moves from left off-screen to right off-screen
  });

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Firestore user data
  const [firestoreUser, setFirestoreUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Get recent recipes from context
  const { recentRecipes, loading: recentLoading } = useRecentRecipes();

  // Get current user from Auth
  const currentUser = auth.currentUser;

  // Fetch user data from Firestore
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoadingUser(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setFirestoreUser(docSnap.data());
          console.log("✅ Firestore user data loaded:", docSnap.data().name);
        }
        setLoadingUser(false);
      },
      (error) => {
        console.error("❌ Error loading user data:", error);
        setLoadingUser(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Get user info (Firestore > Auth > fallback)
  const userName = firestoreUser?.name || currentUser?.displayName || "Chef";
  const userAvatar = firestoreUser?.photoURL || currentUser?.photoURL;

  // Get greeting and random prompt (memoized to prevent re-renders)
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  const cookingPrompt = useMemo(() => getRandomPrompt(), []);

  const displayedRecipes = allItemsShowing
    ? recentRecipes.slice(0, 10) // Max 10 recipes
    : recentRecipes.slice(0, 6);

  /**
   * Handle AI recipe generation
   */
  const handleAIGeneration = () => {
    // Validate inputs
    if (!search.trim() && selectedImages.length === 0) {
      Alert.alert(
        "Input Required",
        "Please enter a search query or add ingredient images to generate recipes."
      );
      return;
    }

    // Navigate to suggestions screen with parameters
    router.push({
      pathname: "/recipes/suggestions",
      params: {
        searchText: search,
        images: JSON.stringify(selectedImages),
      },
    });
  };

  const handleCategoryPress = (category: any) => {
    router.push({
      pathname: "/categories/[category]",
      params: {
        category: category.id,
        label: category.label,
        query: category.query,
        color: category.color,
      },
    });
  };

  const handleSeeAllCategories = () => {
    router.push("../categories");
  };

  const handleRecipePress = (recipe: any) => {
    // Navigate to recipe details with the recipe ID
    const recipeId = recipe.recipe?.id || recipe.id;
    router.push(`/recipes/details?id=${recipeId}`);
  };

  const handleLoadMore = () => {
    setAllItemsShowing(true);
  };

  const handleShowLess = () => {
    setAllItemsShowing(false);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Main ScrollView for entire page */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Greeting and Profile */}
        <View
          style={{
            paddingHorizontal: SPACING.containerPadding,
            paddingTop: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              {greeting}, {userName}
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.textPrimary,
              }}
            >
              {cookingPrompt}
            </Text>
          </View>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            {/* 1. The Spinning Rays Container */}
            <Animated.View
              style={{
                position: "absolute",
                width: 80,
                height: 80,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ rotate: spin }], // Spin the whole starburst
              }}
            >
              {/* Ray 1: Vertical */}
              <View
                style={{
                  position: "absolute",
                  width: 4, // Thin width for "ray" look
                  height: 60, // Long height
                  backgroundColor: colors.primary,
                  opacity: 0.5,
                  borderRadius: 2,
                }}
              />
              {/* Ray 2: Horizontal */}
              <View
                style={{
                  position: "absolute",
                  width: 60,
                  height: 4,
                  backgroundColor: colors.primary,
                  opacity: 0.5,
                  borderRadius: 2,
                }}
              />
              {/* Ray 3: Diagonal 1 */}
              <View
                style={{
                  position: "absolute",
                  width: 4,
                  height: 60,
                  backgroundColor: colors.primary,
                  opacity: 0.5,
                  borderRadius: 2,
                  transform: [{ rotate: "45deg" }],
                }}
              />
              {/* Ray 4: Diagonal 2 */}
              <View
                style={{
                  position: "absolute",
                  width: 4,
                  height: 60,
                  backgroundColor: colors.primary,
                  opacity: 0.5,
                  borderRadius: 2,
                  transform: [{ rotate: "-45deg" }],
                }}
              />
            </Animated.View>

            {/* 2. The Central Bright Core (Static Glow) */}
            <View
              style={{
                position: "absolute",
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: colors.primary,
                opacity: 0.2, // Soft glow behind the avatar
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 15, // Large glow radius
                elevation: 10,
              }}
            />

            {/* 3. The Actual Avatar Button */}
            <TouchableOpacity
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: colors.cardBg,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: colors.background,
                overflow: "hidden",
                zIndex: 10,
              }}
              onPress={() => router.push("/profile")}
            >
              {userAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  resizeMode="cover"
                />
              ) : (
                <User size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Improved Search Bar */}
        <View
          style={{
            paddingHorizontal: SPACING.containerPadding,
            paddingTop: 20,
            paddingBottom: 24,
          }}
        >
          <ImprovedSearchBar
            value={search}
            onChangeText={setSearch}
            onImagesSelected={setSelectedImages}
            placeholder="Search recipes, ingredients, or describe what you want to cook..."
          />
        </View>

        {/* AI Recipe Generator Button */}
        <View
          style={{
            paddingHorizontal: SPACING.containerPadding,
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={handleAIGeneration}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 16,
              paddingVertical: 18,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* The Glitter Sheen Effect */}
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 60, // Width of the shine beam
                backgroundColor: "rgba(255, 255, 255, 0.4)", // White semi-transparent
                transform: [
                  { translateX: sheenTranslate }, // Move across
                  { skewX: "-20deg" }, // Slant it
                ],
                zIndex: 1,
              }}
            />
            <Sparkles size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#ffffff",
              }}
            >
              Generate Recipes with AI
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories Carousel */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              paddingHorizontal: SPACING.containerPadding,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              paddingTop: 20,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.textPrimary,
              }}
            >
              Categories
            </Text>
            <TouchableOpacity
              onPress={handleSeeAllCategories}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.primary,
                }}
              >
                See All
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SPACING.containerPadding,
              paddingVertical: 4,
            }}
          >
            {CATEGORIES.map((category) => (
              <CategoryCarouselItem
                key={category.id}
                category={category}
                onPress={() => handleCategoryPress(category)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Recently Viewed Recipes Header */}
        <View
          style={{
            paddingHorizontal: SPACING.containerPadding,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            paddingTop: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.textPrimary,
            }}
          >
            Recently Viewed
          </Text>
          {recentRecipes.length > 6 && (
            <TouchableOpacity
              onPress={allItemsShowing ? handleShowLess : handleLoadMore}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.primary,
                }}
              >
                {allItemsShowing ? "Show Less" : "Show More"}
              </Text>
              {allItemsShowing ? (
                <ChevronUp size={16} color={colors.primary} />
              ) : (
                <ChevronDown size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* RECENTLY VIEWED RECIPES CAROUSEL */}
        {recentLoading ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 40,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : recentRecipes.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 40,
              paddingVertical: 40,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              No recently viewed recipes yet.{"\n"}
              Start exploring to build your recipe history!
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: SPACING.containerPadding,
              paddingVertical: 4,
              paddingBottom: 24,
            }}
          >
            {displayedRecipes.map((item) => (
              <RecipeCarouselItem
                key={item.recipe.id}
                recipe={item}
                onPress={() => handleRecipePress(item)}
              />
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
