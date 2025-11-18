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
import {
  ArrowLeft,
  Search,
  Clock,
  Flame,
  Heart,
  Home as HomeIcon,
  Bookmark,
  User,
} from "lucide-react-native";
import { useRouter } from "expo-router";

const savedRecipes = [
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
  const [activeTab, setActiveTab] = useState("saved");

  const filteredRecipes = savedRecipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(search.toLowerCase())
  );
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
          backgroundColor: "#FFFFFF",
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
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
            {filteredRecipes.map((recipe, index) => (
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
                onPress={() => router.push(`/recipes/details?id=${recipe.id}`)}
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
                    <Heart size={16} color="#FF6B6B" fill="#FF6B6B" />
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

      {/* Bottom Navigation */}
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
            onPress={() => {
              router.push("../home");
              /* On home screen, you'd just do: setActiveTab("home") */
              /* On other screens, you'd do: router.push("/") */
            }}
          >
            <HomeIcon
              size={24}
              color={activeTab === "home" ? "#16a34a" : "#9ca3af"}
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color: activeTab === "home" ? "#16a34a" : "#9ca3af",
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
              /* On saved screen, you'd just do: setActiveTab("saved") */
              /* On other screens, you'd do: router.push("/saved") */
            }}
          >
            <Bookmark
              size={24}
              color={activeTab === "saved" ? "#16a34a" : "#9ca3af"}
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color: activeTab === "saved" ? "#16a34a" : "#9ca3af",
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
              router.push("../profile");
              /* On profile screen, you'd just do: setActiveTab("profile") */
              /* On other screens, you'd do: router.push("/profile") */
            }}
          >
            <User
              size={24}
              color={activeTab === "profile" ? "#16a34a" : "#9ca3af"}
            />
            <Text
              style={{
                fontSize: 12,
                marginTop: 4,
                color: activeTab === "profile" ? "#16a34a" : "#9ca3af",
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
