// app/recipes/details.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
// 1. Import useSafeAreaInsets
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
import { useRouter } from "expo-router";

const recipe = {
  image:
    "https://images.unsplash.com/photo-1712579733874-c3a79f0f9d12?auto=format&fit=crop&w=800&q=80",
  title: "Grilled Chicken with Herbs",
  time: "35 min",
  calories: 420,
  servings: 2,
  difficulty: "Easy",
  description:
    "Juicy grilled chicken marinated in fresh herbs and spices. Perfect for a healthy dinner.",
  ingredients: [
    "2 chicken breasts",
    "2 tbsp olive oil",
    "1 tbsp fresh rosemary",
    "1 tbsp fresh thyme",
    "3 cloves garlic, minced",
    "1 lemon, juiced",
    "Salt and pepper to taste",
  ],
  instructions: [
    "Mix olive oil, herbs, garlic, and lemon juice in a bowl",
    "Marinate chicken breasts for at least 30 minutes",
    "Preheat grill to medium-high heat",
    "Grill chicken for 6-7 minutes per side",
    "Let rest for 5 minutes before serving",
    "Garnish with fresh herbs and serve hot",
  ],
  nutrition: [
    { label: "Protein", value: "42g", color: "#70AD47" },
    { label: "Carbs", value: "8g", color: "#FF9500" },
    { label: "Fat", value: "18g", color: "#FF6B6B" },
    { label: "Fiber", value: "2g", color: "#70AD47" },
  ],
};

export default function RecipeDetailsScreen() {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"ingredients" | "instructions">(
    "ingredients"
  );
  // 2. Call the hook to get the bottom inset
  const { bottom } = useSafeAreaInsets();

  return (
    // 3. Change background color to white
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar barStyle="light-content" />

      {/* Hero Image */}
      <View style={{ height: 320, position: "relative" }}>
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
            height: "70%",
            // A subtle gradient is often cleaner than a solid block
            backgroundColor:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Header Actions */}
        <SafeAreaView
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: 10,
          }}
          edges={["bottom"]}
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
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }}
          >
            <ArrowLeft size={22} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
            >
              <Share2 size={22} color="#1A1A1A" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSaved(!isSaved)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              }}
            >
              <Heart
                size={22}
                color={isSaved ? "#FF6B6B" : "#1A1A1A"}
                fill={isSaved ? "#FF6B6B" : "transparent"}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Title & Stats */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: 12,
            }}
          >
            {recipe.title}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Clock size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 14, color: "#FFFFFF" }}>
                {recipe.time}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Flame size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 14, color: "#FFFFFF" }}>
                {recipe.calories} cal
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Users size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 14, color: "#FFFFFF" }}>
                {recipe.servings} servings
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#FF9500",
                  fontWeight: "600",
                }}
              >
                {recipe.difficulty}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        // 4. Adjust ScrollView padding
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {/* Description */}
          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            {recipe.description}
          </Text>

          {/* Nutrition Cards */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 24,
              gap: 12,
            }}
          >
            {recipe.nutrition.map((item, index) => (
              <View
                key={item.label}
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 12,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                  // Using a subtle border
                  borderWidth: 1,
                  borderColor: "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#1A1A1A",
                    marginBottom: 4,
                  }}
                >
                  {item.value}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Tabs */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 4,
              flexDirection: "row",
              marginBottom: 20,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("ingredients")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor:
                  activeTab === "ingredients" ? "#70AD47" : "transparent",
                shadowColor:
                  activeTab === "ingredients" ? "#70AD47" : "transparent",
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
                  color: activeTab === "ingredients" ? "#FFFFFF" : "#6B7280",
                }}
              >
                Ingredients
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("instructions")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor:
                  activeTab === "instructions" ? "#70AD47" : "transparent",
                shadowColor:
                  activeTab === "instructions" ? "#70AD47" : "transparent",
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
                  color: activeTab === "instructions" ? "#FFFFFF" : "#6B7280",
                }}
              >
                Instructions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === "ingredients" ? (
            <View style={{ gap: 12 }}>
              {recipe.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: "#FFFFFF",
                    padding: 16,
                    borderRadius: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#70AD47",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      color: "#1A1A1A",
                      flex: 1,
                    }}
                  >
                    {ingredient}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {recipe.instructions.map((instruction, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    gap: 16,
                    backgroundColor: "#FFFFFF",
                    padding: 16,
                    borderRadius: 16,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#70AD4710",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#70AD4720",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#70AD47",
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: "#1A1A1A",
                      lineHeight: 22,
                    }}
                  >
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Start Cooking Button */}
      {/* 5. This is the main fix for the button */}
      <View
        style={{
          position: "absolute",
          // Use the safe area inset, with a 10px fallback
          bottom: bottom || 10,
          // Inset the button from the screen edges
          left: 20,
          right: 20,
          // Make the background transparent
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: "#70AD47",
            paddingVertical: 16,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            shadowColor: "#70AD47",
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
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
