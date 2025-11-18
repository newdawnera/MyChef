import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import {
  CATEGORIES,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
} from "@/constants/categories";

// Responsive grid calculation
const screenWidth = Dimensions.get("window").width;
const getCardWidth = () => {
  if (screenWidth < 375) {
    return "45%"; // 2 columns for small screens
  }
  return "30%"; // 3 columns for normal screens
};

// Category Card Component
interface CategoryCardProps {
  category: (typeof CATEGORIES)[0];
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }) => {
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
        width: getCardWidth(),
        marginBottom: SPACING.gridGap + 4,
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: SPACING.cardSize,
            height: SPACING.cardSize,
            borderRadius: SPACING.borderRadius,
            backgroundColor: COLORS.cardBg,
            ...SHADOWS.card,
            borderWidth: 1,
            borderColor: category.borderColor,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Icon
            size={SPACING.iconSize}
            color={category.color}
            strokeWidth={1.8}
          />
        </View>
        <Text style={TYPOGRAPHY.categoryLabel}>{category.label}</Text>
      </Animated.View>
    </Pressable>
  );
};

// Main Categories Screen
export default function CategoriesScreen() {
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      edges={["bottom"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: SPACING.containerPadding,
          paddingTop: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.cardBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
            ...SHADOWS.backButton,
            borderWidth: 1,
            borderColor: "#f3f4f6",
          }}
        >
          <ChevronLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View>
          <Text style={TYPOGRAPHY.header}>Categories</Text>
          <Text style={[TYPOGRAPHY.subtitle, { marginTop: 2 }]}>
            Browse recipes by type
          </Text>
        </View>
      </View>

      {/* Categories Grid */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.containerPadding,
          paddingTop: 20,
          paddingBottom: 40,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={() => handleCategoryPress(category)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
