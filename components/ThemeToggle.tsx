// components/ThemeToggle.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Sun, Moon, Smartphone } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { themeMode, setThemeMode, colors } = useTheme();

  const options = [
    { mode: "light" as const, icon: Sun, label: "Light" },
    { mode: "dark" as const, icon: Moon, label: "Dark" },
    { mode: "system" as const, icon: Smartphone, label: "System" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Appearance
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Choose your preferred theme
      </Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = themeMode === option.mode;

          return (
            <TouchableOpacity
              key={option.mode}
              style={[
                styles.option,
                {
                  backgroundColor: colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
              onPress={() => setThemeMode(option.mode)}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isSelected
                      ? `${colors.primary}15`
                      : "transparent",
                  },
                ]}
              >
                <Icon
                  size={24}
                  color={isSelected ? colors.primary : colors.textSecondary}
                  strokeWidth={1.5}
                />
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color: isSelected ? colors.primary : colors.textSecondary,
                    fontWeight: isSelected ? "600" : "400",
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  option: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 13,
  },
});
