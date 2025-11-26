// app/(tabs)/saved.tsx
/**
 * Saved Recipes Screen with Filters
 *
 * Features:
 * - Real data from Firebase + AsyncStorage
 * - Filter by: All, Favorites, Cooked, Uncooked
 * - Search functionality
 * - Pull-to-refresh
 * - Optimistic UI updates
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Clock,
  Flame,
  Heart,
  ChefHat,
  Bookmark,
  Filter,
  Users,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";

type FilterType = "all" | "favorites" | "cooked" | "uncooked";

// --- CUSTOM ARROW COMPONENT ---
const FilterArrow = ({
  label,
  icon: Icon,
  isActive,
  onPress,
  index,
  total,
  colors,
  theme,
}: any) => {
  const ARROW_WIDTH = 14; // Reduced arrow width slightly to save space
  const HEIGHT = 42;

  // Colors
  const activeBg = colors.primary;
  const inactiveBg = theme === "dark" ? "#374151" : "#E5E7EB";

  const bg = isActive ? activeBg : inactiveBg;
  const textColor = isActive ? "#FFFFFF" : colors.textSecondary;
  const iconColor = isActive ? "#FFFFFF" : colors.textSecondary;

  // Check if this is the last item
  const isLast = index === total - 1;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: HEIGHT,
        zIndex: total - index,
        marginLeft: index === 0 ? 0 : -ARROW_WIDTH - 4, // Overlap logic
        flex: 1, // Allow item to expand to fill available space
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Main Body Box */}
      <View
        style={{
          backgroundColor: bg,
          height: HEIGHT,
          // Adjust padding: Left accounts for the previous arrow's point.
          // Right is smaller to fit text better.
          paddingLeft: index === 0 ? 12 : ARROW_WIDTH + 8,
          paddingRight: 6,
          justifyContent: "center",
          alignItems: "center", // Center content horizontally
          borderTopLeftRadius: index === 0 ? 8 : 0,
          borderBottomLeftRadius: index === 0 ? 8 : 0,
          // If last item, round the right corners to make it look contained
          borderTopRightRadius: isLast ? 8 : 0,
          borderBottomRightRadius: isLast ? 8 : 0,
          flex: 1, // Body takes up all space in the flex container
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          {/* Only show icon if there is enough space, or use smaller size */}
          <Icon size={14} color={iconColor} />
          <Text
            style={{ fontSize: 12, fontWeight: "600", color: textColor }}
            numberOfLines={1}
            adjustsFontSizeToFit // Ensures text shrinks if it's too long
          >
            {label}
          </Text>
        </View>
      </View>

      {/* The Arrow Point - Hide it for the last item so it fits flush */}
      {!isLast && (
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: HEIGHT / 2,
            borderBottomWidth: HEIGHT / 2,
            borderLeftWidth: ARROW_WIDTH,
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: bg,
          }}
        />
      )}
    </TouchableOpacity>
  );
};

export default function SavedRecipesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, theme } = useTheme();
  const { savedRecipes, loading, syncing, toggleFavorite, unsaveRecipe } =
    useSavedRecipes();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>(
    (params.filter as FilterType) || "all"
  );
  const [refreshing, setRefreshing] = useState(false);

  // ... (Keep existing onRefresh, getFilteredRecipes, filteredRecipes, getFilterConfig, handlers, renderEmptyState) ...
  /**
   * Handle pull-to-refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  /**
   * Apply filters
   */
  const getFilteredRecipes = () => {
    let filtered = savedRecipes;

    switch (activeFilter) {
      case "favorites":
        filtered = filtered.filter((r) => r.isFavorite);
        break;
      case "cooked":
        filtered = filtered.filter((r) => r.isCooked);
        break;
      case "uncooked":
        filtered = filtered.filter((r) => !r.isCooked);
        break;
      default:
        break;
    }

    if (search) {
      filtered = filtered.filter((r) =>
        r.recipe.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.savedAt - a.savedAt);
  };

  const filteredRecipes = getFilteredRecipes();

  /**
   * Get filter button config
   */
  const getFilterConfig = (filter: FilterType) => {
    const configs = {
      all: { label: "All", icon: Bookmark },
      favorites: { label: "Favorites", icon: Heart },
      cooked: { label: "Cooked", icon: ChefHat },
      uncooked: { label: "To Cook", icon: Clock },
    };
    return configs[filter];
  };

  const handleRecipePress = (recipeId: number) => {
    router.push(`/recipes/details?id=${recipeId}`);
  };

  const handleToggleFavorite = async (recipeId: number) => {
    await toggleFavorite(recipeId);
  };

  const renderEmptyState = () => {
    const messages = {
      all: {
        title: "No Saved Recipes",
        message: "Start saving recipes you love and they'll appear here!",
        icon: Bookmark,
      },
      favorites: {
        title: "No Favorites Yet",
        message: "Mark recipes as favorites by tapping the heart icon!",
        icon: Heart,
      },
      cooked: {
        title: "No Cooked Recipes",
        message:
          "Start cooking and mark recipes as cooked to track your progress!",
        icon: ChefHat,
      },
      uncooked: {
        title: "All Recipes Cooked!",
        message: "Great job! You've cooked all your saved recipes.",
        icon: ChefHat,
      },
    };

    const config = messages[activeFilter];
    const Icon = config.icon;

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 40,
          paddingTop: 60,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${colors.primary}15`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Icon size={36} color={colors.primary} />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: colors.textPrimary,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {config.title}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          {config.message}
        </Text>

        {activeFilter === "all" && (
          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 14,
              borderRadius: 12,
            }}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>
              Discover Recipes
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.cardBg }}
      edges={["top"]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View
        style={{
          paddingVertical: 16,
          paddingTop: 24,
          paddingHorizontal: 20,
          backgroundColor: colors.cardBg,
          shadowColor: colors.shadow,
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          zIndex: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
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
              Saved Recipes
            </Text>
            {syncing && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ position: "relative", marginBottom: 40 }}>
          <View
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: [{ translateY: -10 }],
              zIndex: 1,
            }}
          >
            <Search size={20} color={colors.textSecondary} />
          </View>
          <TextInput
            placeholder="Search saved recipes..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            style={{
              backgroundColor: colors.background,
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 16,
              paddingLeft: 48,
              fontSize: 15,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.textPrimary,
            }}
          />
        </View>

        {/* Arrow Process Filter Tabs (Stationary & Aligned) */}
        <View style={{ height: 20, width: "100%", marginBottom: 8 }}>
          <View
            style={{
              flexDirection: "row",
              // Center items but allow them to stretch
              alignItems: "center",
              // Add horizontal padding to match the search bar above (usually 20px in your design)
              paddingHorizontal: 0,
            }}
          >
            {(["all", "favorites", "cooked", "uncooked"] as FilterType[]).map(
              (filter, index, array) => {
                const config = getFilterConfig(filter);
                return (
                  <View
                    key={filter}
                    style={{
                      flex: 1,
                      // COMPENSATION: The last item needs to be slightly wider or shifted
                      // to visually align with the search bar's right edge because of the overlap.
                      marginRight: index === array.length - 1 ? 0 : 0,
                    }}
                  >
                    <FilterArrow
                      label={config.label}
                      icon={config.icon}
                      isActive={activeFilter === filter}
                      onPress={() => setActiveFilter(filter)}
                      index={index}
                      total={array.length}
                      colors={colors}
                      theme={theme}
                    />
                  </View>
                );
              }
            )}
          </View>
        </View>
      </View>

      {/* Recipe Grid */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {filteredRecipes.length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            contentContainerStyle={{
              paddingBottom: 120,
              paddingTop: 20,
            }}
          >
            <View style={{ paddingHorizontal: 20 }}>
              {/* Count */}
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 20,
                }}
              >
                {search ? "Showing " : ""}
                <Text style={{ color: colors.primary, fontWeight: "600" }}>
                  {filteredRecipes.length}
                </Text>
                {search
                  ? " matching recipes"
                  : activeFilter === "all"
                  ? " saved recipes"
                  : ` ${activeFilter} recipes`}
              </Text>

              {/* Grid */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                }}
              >
                {filteredRecipes.map((entry) => (
                  <TouchableOpacity
                    key={entry.recipe.id}
                    style={{
                      width: "48%",
                      marginBottom: 16,
                      backgroundColor: colors.cardBg,
                      borderRadius: 20,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.border,
                      shadowColor: colors.shadow,
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }}
                    onPress={() => handleRecipePress(entry.recipe.id)}
                  >
                    {/* Image */}
                    <View style={{ height: 160, position: "relative" }}>
                      <Image
                        source={{ uri: entry.recipe.image }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />

                      {/* Heart Icon */}
                      <TouchableOpacity
                        onPress={() => handleToggleFavorite(entry.recipe.id)}
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: "#000",
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }}
                      >
                        <Heart
                          size={16}
                          color={entry.isFavorite ? "#FF6B6B" : "#9CA3AF"}
                          fill={entry.isFavorite ? "#FF6B6B" : "transparent"}
                        />
                      </TouchableOpacity>

                      {/* Cooked Badge */}
                      {entry.isCooked && (
                        <View
                          style={{
                            position: "absolute",
                            bottom: 8,
                            left: 8,
                            backgroundColor: "rgba(112, 173, 71, 0.95)",
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <ChefHat size={12} color="#FFFFFF" />
                          <Text
                            style={{
                              fontSize: 10,
                              color: "#FFFFFF",
                              fontWeight: "600",
                            }}
                          >
                            Cooked
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Content */}
                    <View style={{ padding: 12 }}>
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.textPrimary,
                          marginBottom: 8,
                          lineHeight: 18,
                        }}
                      >
                        {entry.recipe.title}
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
                          <Clock size={12} color={colors.textSecondary} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.textSecondary,
                            }}
                          >
                            {entry.recipe.readyInMinutes} min
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Users size={12} color={colors.textSecondary} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.textSecondary,
                            }}
                          >
                            {entry.recipe.servings}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
