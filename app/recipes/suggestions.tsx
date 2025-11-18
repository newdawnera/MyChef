// app/suggestions.tsx - React Native version of AI Suggestions screen

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Clock, Flame, Users, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";

const suggestedRecipes = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1712579733874-c3a79f0f9d12?auto=format&fit=crop&w=800&q=80",
    title: "Grilled Chicken with Herbs",
    time: "35 min",
    calories: 420,
    servings: 2,
    difficulty: "Easy",
    tags: ["High Protein", "Low Carb"],
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1536540166989-ad5334cee5f0?auto=format&fit=crop&w=800&q=80",
    title: "Asian Noodle Stir Fry",
    time: "20 min",
    calories: 385,
    servings: 2,
    difficulty: "Easy",
    tags: ["Quick", "Vegetarian"],
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1677653805080-59c57727c84e?auto=format&fit=crop&w=800&q=80",
    title: "Mediterranean Salad Bowl",
    time: "15 min",
    calories: 280,
    servings: 2,
    difficulty: "Very Easy",
    tags: ["Healthy", "Fresh"],
  },
];

export default function AiSuggestionScreen() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(true);
  const [showRecipes, setShowRecipes] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loading animation
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

    const timer = setTimeout(() => {
      pulse.stop();
      rotate.stop();
      setIsGenerating(false);
      setShowRecipes(true);

      // Fade in recipes
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 2000);

    return () => {
      clearTimeout(timer);
      pulse.stop();
      rotate.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (isGenerating) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F8F9FA" }}
        edges={["bottom"]}
      >
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View
          style={{
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
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
              backgroundColor: "rgba(112, 173, 71, 0.1)",
              marginBottom: 32,
              transform: [{ scale: scaleAnim }, { rotate: spin }],
            }}
          >
            <Sparkles size={60} color="#70AD47" strokeWidth={1.5} />
          </Animated.View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#1A1A1A",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Generating Recipes...
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: "#6B7280",
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8F9FA" }}
      edges={["bottom"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
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
          AI Suggestions
        </Text>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
        >
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 20 }}>
            Based on your preferences, we found{" "}
            <Text style={{ color: "#70AD47", fontWeight: "600" }}>
              {suggestedRecipes.length} recipes
            </Text>{" "}
            for you
          </Text>

          {/* Recipe Cards */}
          {suggestedRecipes.map((recipe, index) => (
            <TouchableOpacity
              key={recipe.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginBottom: 16,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
              onPress={() => router.push(`/recipes/details?id=${recipe.id}`)}
            >
              {/* Image */}
              <View style={{ height: 200, position: "relative" }}>
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

                {/* Tags */}
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    flexDirection: "row",
                    gap: 8,
                  }}
                >
                  {recipe.tags.map((tag) => (
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
                          color: "#70AD47",
                          fontWeight: "600",
                        }}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>

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
                    {recipe.difficulty}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: "#1A1A1A",
                    marginBottom: 12,
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
                    <Clock size={16} color="#6B7280" />
                    <Text style={{ fontSize: 13, color: "#6B7280" }}>
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
                    <Flame size={16} color="#6B7280" />
                    <Text style={{ fontSize: 13, color: "#6B7280" }}>
                      {recipe.calories} cal
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Users size={16} color="#6B7280" />
                    <Text style={{ fontSize: 13, color: "#6B7280" }}>
                      {recipe.servings} servings
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Regenerate Button */}
          <TouchableOpacity
            style={{
              marginTop: 8,
              marginBottom: 24,
              paddingVertical: 16,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Sparkles size={20} color="#70AD47" />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#70AD47",
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
