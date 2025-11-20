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
  const [search, setSearch] = useState("");

  // 1. Initialize state with an 'isFavorite' property set to true
  const [recipes, setRecipes] = useState(
    initialSavedRecipes.map((recipe) => ({ ...recipe, isFavorite: true }))
  );

  // 2. Function to toggle the favorite state
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
    // 3. CHANGE: Set backgroundColor to #FFFFFF so the status bar area is white
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingVertical: 16,
          paddingTop: 24,
          paddingHorizontal: 20,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          zIndex: 10, // Ensure header stays on top
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
              backgroundColor: "#F3F4F6",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <ArrowLeft size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "600", color: "#1A1A1A" }}>
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
            <Search size={20} color="#6B7280" />
          </View>
          <TextInput
            placeholder="Search saved recipes..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            style={{
              backgroundColor: "#F3F4F6",
              borderRadius: 20,
              paddingVertical: 14,
              paddingHorizontal: 16,
              paddingLeft: 48,
              fontSize: 15,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              color: "#1A1A1A",
            }}
          />
        </View>
      </View>

      {/* Recipe Grid */}
      {/* 4. CHANGE: Wrap ScrollView in a View with the gray background */}
      <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120, // 5. CHANGE: Increased padding to clear Bottom Nav Bar
            paddingTop: 8,
          }}
        >
          <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
            {/* Count */}
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
              {search ? "Showing " : "You have "}
              <Text style={{ color: "#70AD47", fontWeight: "600" }}>
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
                    backgroundColor: "#FFFFFF",
                    borderRadius: 20,
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    shadowColor: "#000",
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

                    {/* Heart Icon - 6. CHANGE: Added toggle logic and conditional styling */}
                    <TouchableOpacity
                      onPress={() => toggleFavorite(recipe.id)}
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
                          color: "#70AD47",
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
                        color: "#1A1A1A",
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
                        <Clock size={12} color="#6B7280" />
                        <Text style={{ fontSize: 12, color: "#6B7280" }}>
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
                        <Flame size={12} color="#6B7280" />
                        <Text style={{ fontSize: 12, color: "#6B7280" }}>
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
