import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Animated,
  Pressable,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Search,
  Sparkles,
  User,
  Bookmark,
  Home as HomeIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
} from "lucide-react-native";
import { CATEGORIES, COLORS, SPACING, SHADOWS } from "@/constants/categories";

const recentRecipes = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1574665619640-df774e5f01bb?auto=format&fit=crop&w=800&q=80",
    title: "Buddha Bowl",
    time: "25 min",
    calories: "350 cal",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80",
    title: "Creamy Pasta",
    time: "30 min",
    calories: "520 cal",
  },
  {
    id: 3,
    image: "...",
    title: "Grilled Chicken",
    time: "35 min",
    calories: "420 cal",
  },
  {
    id: 4,
    image: "...",
    title: "Avocado Toast",
    time: "10 min",
    calories: "280 cal",
  },
  {
    id: 5,
    image: "...",
    title: "Beef Stir-Fry",
    time: "20 min",
    calories: "480 cal",
  },
  {
    id: 6,
    image: "...",
    title: "Lentil Soup",
    time: "45 min",
    calories: "310 cal",
  },
  {
    id: 7,
    image: "...",
    title: "Salmon & Asparagus",
    time: "25 min",
    calories: "390 cal",
  },
  {
    id: 8,
    image: "...",
    title: "Veggie Omelette",
    time: "15 min",
    calories: "260 cal",
  },
  {
    id: 9,
    image: "...",
    title: "Quinoa Salad",
    time: "15 min",
    calories: "330 cal",
  },
  {
    id: 10,
    image: "...",
    title: "Chicken Tacos",
    time: "30 min",
    calories: "410 cal",
  },
  {
    id: 11,
    image: "...",
    title: "Pesto Pasta",
    time: "20 min",
    calories: "460 cal",
  },
  {
    id: 12,
    image: "...",
    title: "Fruit Smoothie",
    time: "5 min",
    calories: "210 cal",
  },
  {
    id: 13,
    image: "...",
    title: "Margherita Pizza",
    time: "25 min",
    calories: "550 cal",
  },
  {
    id: 14,
    image: "...",
    title: "Caprese Salad",
    time: "10 min",
    calories: "240 cal",
  },
  {
    id: 15,
    image: "...",
    title: "Blueberry Muffins",
    time: "40 min",
    calories: "290 cal",
  },
];

type Tab = "home" | "saved" | "profile";

// Category Carousel Item Component
interface CategoryCarouselItemProps {
  category: (typeof CATEGORIES)[0];
  onPress: () => void;
}

const CategoryCarouselItem: React.FC<CategoryCarouselItemProps> = ({
  category,
  onPress,
}) => {
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
            backgroundColor: COLORS.cardBg,
            shadowColor: "#000",
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
            color: COLORS.textPrimary,
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

// Recipe Card Component - Memoized to prevent unnecessary re-renders
interface RecipeCardProps {
  recipe: (typeof recentRecipes)[0];
  onPress: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = React.memo(
  ({ recipe, onPress }) => {
    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#ffffff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          borderRadius: 16,
          padding: 10,
          borderWidth: 1,
          borderColor: "rgba(243, 244, 246, 0.5)",
          marginBottom: 12,
        }}
        onPress={onPress}
      >
        <Image
          source={{ uri: recipe.image }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            marginRight: 16,
            backgroundColor: "#f3f4f6",
          }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: COLORS.textPrimary,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {recipe.title}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Clock size={14} color={COLORS.textSecondary} />
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                marginLeft: 4,
              }}
            >
              {recipe.time}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                marginHorizontal: 8,
              }}
            >
              •
            </Text>
            <Flame size={14} color={COLORS.textSecondary} />
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textSecondary,
                marginLeft: 4,
              }}
            >
              {recipe.calories}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

RecipeCard.displayName = "RecipeCard";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [itemsToShow, setItemsToShow] = useState(3); // Start with 6 items

  // Navigate directly to category results
  const handleCategoryPress = (category: (typeof CATEGORIES)[0]) => {
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

  // Navigate to all categories page
  const handleSeeAllCategories = () => {
    router.push("../categories");
  };

  // Navigate to recipe details
  const handleRecipePress = (recipeId: number) => {
    router.push({
      pathname: "/recipes/details",
      params: { recipeId },
    });
  };

  // Navigate to AI recipe generation
  const handleAIGeneration = () => {
    router.push("/recipes/suggestions");
  };

  // Load more recipes (pagination)
  const handleLoadMore = () => {
    setItemsToShow(15);
  };

  // Show less recipes
  const handleShowLess = () => {
    setItemsToShow(2);
  };

  const allItemsShowing = itemsToShow >= recentRecipes.length;
  const displayedRecipes = recentRecipes.slice(0, itemsToShow);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#ffffff" }}
      edges={["bottom"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Main Container - Using flex column */}
      <View style={{ flex: 1 }}>
        {/* FIXED HEADER SECTION - NOT SCROLLABLE */}
        <View>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: SPACING.containerPadding,
              paddingTop: 24,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>
                Good Morning
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: COLORS.textPrimary,
                }}
              >
                What&apos;s cooking today?
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View
            style={{
              paddingHorizontal: SPACING.containerPadding,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f9fafb",
                borderRadius: 16,
                paddingHorizontal: 16,
                height: 56,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Search size={20} color={COLORS.textSecondary} />
              <TextInput
                placeholder="Search recipes..."
                placeholderTextColor={COLORS.textSecondary}
                style={{
                  flex: 1,
                  marginLeft: 12,
                  fontSize: 16,
                  color: COLORS.textPrimary,
                }}
              />
            </View>
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
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                paddingVertical: 18,
                paddingHorizontal: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
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
            {/* Section Header */}
            <View
              style={{
                paddingHorizontal: SPACING.containerPadding,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: COLORS.textPrimary,
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
                    color: COLORS.primary,
                  }}
                >
                  See All
                </Text>
                <ChevronRight size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Horizontal Scrollable Categories */}
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

          {/* Recent Recipes Header - FIXED */}
          <View
            style={{
              paddingHorizontal: SPACING.containerPadding,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8, // Small margin as requested
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: COLORS.textPrimary,
              }}
            >
              Recent Recipes
            </Text>
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
                  color: COLORS.primary,
                }}
              >
                {allItemsShowing ? "Show Less" : "Show More"}
              </Text>
              {allItemsShowing ? (
                <ChevronUp size={16} color={COLORS.primary} />
              ) : (
                <ChevronDown size={16} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SCROLLABLE RECENT RECIPES SECTION ONLY */}
        <FlatList
          data={displayedRecipes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onPress={() => handleRecipePress(item.id)}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: SPACING.containerPadding,
            paddingTop: 4, // Small top padding
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={6}
          windowSize={10}
        />
      </View>

      {/* Bottom Navigation */}
      <View
        style={{
          backgroundColor: "#ffffff",
          paddingTop: 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 8,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
            height: 64,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
            onPress={() => setActiveTab("home")}
          >
            <HomeIcon
              size={24}
              color={
                activeTab === "home" ? COLORS.vegetarian : COLORS.textTertiary
              }
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color:
                  activeTab === "home"
                    ? COLORS.vegetarian
                    : COLORS.textTertiary,
                fontWeight: activeTab === "home" ? "500" : "400",
              }}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
            onPress={() => {
              setActiveTab("saved");
              router.push("../recipes/saved");
            }}
          >
            <Bookmark
              size={24}
              color={
                activeTab === "saved" ? COLORS.vegetarian : COLORS.textTertiary
              }
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color:
                  activeTab === "saved"
                    ? COLORS.vegetarian
                    : COLORS.textTertiary,
                fontWeight: activeTab === "saved" ? "500" : "400",
              }}
            >
              Saved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
            }}
            onPress={() => {
              setActiveTab("profile");
              router.push("../profile");
            }}
          >
            <User
              size={24}
              color={
                activeTab === "profile"
                  ? COLORS.vegetarian
                  : COLORS.textTertiary
              }
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color:
                  activeTab === "profile"
                    ? COLORS.vegetarian
                    : COLORS.textTertiary,
                fontWeight: activeTab === "profile" ? "500" : "400",
              }}
            >
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
