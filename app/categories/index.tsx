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
import { ArrowLeft } from "lucide-react-native";
import {
  CATEGORIES,
  COLORS, // Kept in case needed for category data, but used theme for UI
  TYPOGRAPHY,
  SPACING,
  SHADOWS,
} from "@/constants/categories";
import { useTheme } from "@/contexts/ThemeContext"; // 1. Import Theme Hook

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
  const { colors } = useTheme(); // 2. Use theme hook inside component
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
            backgroundColor: colors.cardBg, // 3. Dynamic Card Background
            ...SHADOWS.card,
            shadowColor: colors.shadow, // 4. Dynamic Shadow Color
            borderWidth: 1,
            borderColor: category.borderColor, // Keeping specific category color
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
        <Text
          style={[
            TYPOGRAPHY.categoryLabel,
            { color: colors.textPrimary }, // 5. Dynamic Text Color
          ]}
        >
          {category.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// Main Categories Screen
export default function CategoriesScreen() {
  const { colors, theme } = useTheme(); // 6. Use theme hook for screen

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
    // 1. Set SafeAreaView background to header color (cardBg)
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.cardBg }}
      edges={["top"]} // Only pad the top
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {/* Header - Matches Top SafeArea Color */}
      <View
        style={{
          paddingHorizontal: SPACING.containerPadding,
          paddingTop: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.cardBg, // Ensure header matches top area
          // Optional: Add shadow like profile page
          shadowColor: colors.shadow,
          shadowOpacity: 0.05,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
          zIndex: 1,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.background, // Contrast button bg
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <View>
          <Text style={[TYPOGRAPHY.header, { color: colors.textPrimary }]}>
            Categories
          </Text>
          <Text
            style={[
              TYPOGRAPHY.subtitle,
              { marginTop: 2, color: colors.textSecondary },
            ]}
          >
            Browse recipes by type
          </Text>
        </View>
      </View>

      {/* 2. Wrap Content in a separate View with the page background color */}
      <View style={{ flex: 1, backgroundColor: colors.background }}>
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
      </View>
    </SafeAreaView>
  );
}
