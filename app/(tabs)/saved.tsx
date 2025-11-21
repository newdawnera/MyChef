// app/saved/index.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Search, Clock, Flame, Heart } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext"; // 1. Import Theme Hook

const initialSavedRecipes = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1574665619640-df774e5f01bb?auto=format&fit=crop&w=800&q=80",
    title: "Buddha Bowl",
    time: "25 min",
    calories: 350,
    category: "Healthy",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1712579733874-c3a79f0f9d12?auto=format&fit=crop&w=800&q=80",
    title: "Grilled Chicken with Herbs",
    time: "35 min",
    calories: 420,
    category: "High Protein",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80",
    title: "Creamy Pasta",
    time: "30 min",
    calories: 520,
    category: "Comfort Food",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1536540166989-ad5334cee5f0?auto=format&fit=crop&w=800&q=80",
    title: "Asian Noodle Stir Fry",
    time: "20 min",
    calories: 385,
    category: "Quick Meals",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1677653805080-59c57727c84e?auto=format&fit=crop&w=800&q=80",
    title: "Mediterranean Salad",
    time: "15 min",
    calories: 280,
    category: "Fresh",
  },
];

export default function SavedRecipesScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme(); // 2. Get current theme colors
  const [search, setSearch] = useState("");

  const [recipes, setRecipes] = useState(
    initialSavedRecipes.map((recipe) => ({ ...recipe, isFavorite: true }))
  );

  const toggleFavorite = (id: number) => {
    setRecipes((currentRecipes) =>
      currentRecipes.map((recipe) =>
        recipe.id === id
          ? { ...recipe, isFavorite: !recipe.isFavorite }
          : recipe
      )
    );
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    // 3. Use dynamic cardBg for the top safe area (Header background)
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.cardBg }}
      edges={["top"]}
    >
      {/* Adapt status bar style */}
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header */}
      <View
        style={{
          paddingVertical: 16,
          paddingTop: 24,
          paddingHorizontal: 20,
          backgroundColor: colors.cardBg, // Dynamic background
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
            gap: 12,
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.background, // Light gray in light mode, dark gray in dark mode
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
              color: colors.textPrimary, // Dynamic text color
            }}
          >
            Saved Recipes
          </Text>
        </View>

        {/* Search Bar */}
        <View style={{ position: "relative" }}>
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
              backgroundColor: colors.background, // Dynamic input background
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 16,
              paddingLeft: 48,
              fontSize: 15,
              borderWidth: 1,
              borderColor: colors.border,
              color: colors.textPrimary, // Dynamic input text
            }}
          />
        </View>
      </View>

      {/* Recipe Grid */}
      {/* 4. Use dynamic background for the main content area */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
            paddingTop: 8,
          }}
        >
          <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
            {/* Count */}
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 20,
              }}
            >
              {search ? "Showing " : "You have "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {filteredRecipes.length}
              </Text>
              {search ? " matching recipes" : " saved recipes"}
            </Text>

            {/* Grid */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {filteredRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={{
                    width: "48%",
                    marginBottom: 16,
                    backgroundColor: colors.cardBg, // Dynamic card background
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
                  onPress={() =>
                    router.push(`/recipes/details?id=${recipe.id}`)
                  }
                >
                  {/* Image */}
                  <View style={{ height: 160, position: "relative" }}>
                    <Image
                      source={{ uri: recipe.image }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />

                    {/* Gradient Overlay */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "50%",
                        backgroundColor: "transparent",
                      }}
                    />

                    {/* Heart Icon */}
                    <TouchableOpacity
                      onPress={() => toggleFavorite(recipe.id)}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        // Using semi-transparent white here looks best on photos even in dark mode
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
                        color={recipe.isFavorite ? "#FF6B6B" : "#9CA3AF"}
                        fill={recipe.isFavorite ? "#FF6B6B" : "transparent"}
                      />
                    </TouchableOpacity>

                    {/* Category Badge */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 8,
                        left: 8,
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: 12,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.primary, // Use theme primary color
                          fontWeight: "600",
                        }}
                      >
                        {recipe.category}
                      </Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={{ padding: 12 }}>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.textPrimary, // Dynamic title color
                        marginBottom: 8,
                        lineHeight: 18,
                      }}
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
                        <Clock size={12} color={colors.textSecondary} />
                        <Text
                          style={{ fontSize: 12, color: colors.textSecondary }}
                        >
                          {recipe.time}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Flame size={12} color={colors.textSecondary} />
                        <Text
                          style={{ fontSize: 12, color: colors.textSecondary }}
                        >
                          {recipe.calories}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
