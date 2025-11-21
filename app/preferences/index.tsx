// app/preferences/index.tsx
/**
 * User Preferences Screen - WITH FIRESTORE PERSISTENCE
 *
 * Now saves/loads preferences to/from Firestore
 * Uses usePreferences hook for data management
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Leaf,
  AlertTriangle,
  Globe,
  TrendingUp,
  Target,
  Ban,
  Users,
  ChevronRight,
  Check,
  X,
  Plus,
  Minus,
  Save,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { usePreferences } from "@/hooks/usePreferences";

const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "vegan", label: "Vegan", icon: Leaf },
  { id: "keto", label: "Keto", icon: TrendingUp },
  { id: "paleo", label: "Paleo", icon: Target },
  { id: "lowCarb", label: "Low Carb", icon: TrendingUp },
  { id: "highProtein", label: "High Protein", icon: TrendingUp },
  { id: "glutenFree", label: "Gluten-Free", icon: AlertTriangle },
  { id: "dairyFree", label: "Dairy-Free", icon: AlertTriangle },
];

const allergyOptions = [
  { id: "peanuts", label: "Peanuts" },
  { id: "treeNuts", label: "Tree Nuts" },
  { id: "eggs", label: "Eggs" },
  { id: "soy", label: "Soy" },
  { id: "shellfish", label: "Shellfish" },
  { id: "wheat", label: "Wheat" },
  { id: "lactose", label: "Lactose" },
];

const cuisineOptions = [
  "Italian",
  "Mexican",
  "Asian",
  "Indian",
  "Mediterranean",
  "African",
  "American",
  "French",
];

const skillLevels = ["Beginner", "Intermediate", "Advanced"];

const mealGoals = [
  "Weight Loss",
  "Muscle Gain",
  "Balanced Diet",
  "Quick Meals",
  "Budget Cooking",
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();

  // Use preferences hook
  const {
    preferences,
    savePreferences,
    loading: prefsLoading,
    saving: prefsSaving,
    error: prefsError,
  } = usePreferences();

  // Local state for form
  const [showDietModal, setShowDietModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  // Form state - initialize from preferences
  const [selectedDiets, setSelectedDiets] = useState<string[]>(
    preferences.selectedDiets
  );
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(
    preferences.selectedAllergies
  );
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    preferences.selectedCuisines
  );
  const [skillLevel, setSkillLevel] = useState(preferences.skillLevel);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    preferences.selectedGoals
  );
  const [avoidIngredientsText, setAvoidIngredientsText] = useState(
    preferences.avoidIngredients.join(", ")
  );
  const [servingSize, setServingSize] = useState(preferences.servingSize);

  // Update form when preferences load
  useEffect(() => {
    setSelectedDiets(preferences.selectedDiets);
    setSelectedAllergies(preferences.selectedAllergies);
    setSelectedCuisines(preferences.selectedCuisines);
    setSkillLevel(preferences.skillLevel);
    setSelectedGoals(preferences.selectedGoals);
    setAvoidIngredientsText(preferences.avoidIngredients.join(", "));
    setServingSize(preferences.servingSize);
  }, [preferences]);

  /**
   * Save preferences to Firestore
   */
  const handleSave = async () => {
    try {
      // Parse avoid ingredients
      const avoidIngredients = avoidIngredientsText
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      // Create updated preferences object
      const updated = {
        ...preferences,
        selectedDiets,
        selectedAllergies,
        selectedCuisines,
        skillLevel,
        selectedGoals,
        avoidIngredients,
        servingSize,
      };

      await savePreferences(updated);

      Alert.alert("Success", "Your preferences have been saved!");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    }
  };

  const toggleSelection = (
    array: string[],
    setter: (val: string[]) => void,
    item: string
  ) => {
    if (array.includes(item)) {
      setter(array.filter((i) => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const PreferenceCard = ({
    title,
    value,
    onPress,
    icon: Icon,
  }: {
    title: string;
    value: string;
    onPress: () => void;
    icon: any;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: colors.shadow,
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: `${colors.primary}15`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={colors.primary} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              color: colors.textPrimary,
              fontWeight: "500",
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          <Text
            style={{ fontSize: 13, color: colors.textSecondary }}
            numberOfLines={1}
          >
            {value}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const SelectionModal = ({
    visible,
    onClose,
    title,
    options,
    selectedItems,
    onToggle,
    multiSelect = true,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: any[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    multiSelect?: boolean;
  }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.cardBg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: colors.textPrimary,
              }}
            >
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const itemId = typeof option === "string" ? option : option.id;
              const itemLabel =
                typeof option === "string" ? option : option.label;
              const ItemIcon = typeof option === "object" ? option.icon : null;
              const isSelected = multiSelect
                ? selectedItems.includes(itemId)
                : selectedItems[0] === itemId;

              return (
                <TouchableOpacity
                  key={itemId}
                  onPress={() => {
                    if (multiSelect) {
                      onToggle(itemId);
                    } else {
                      onToggle(itemId);
                      setTimeout(onClose, 200);
                    }
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 16,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: isSelected
                      ? `${colors.primary}10`
                      : "transparent",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {ItemIcon && (
                      <ItemIcon
                        size={20}
                        color={
                          isSelected ? colors.primary : colors.textSecondary
                        }
                        strokeWidth={1.5}
                      />
                    )}
                    <Text
                      style={{
                        fontSize: 16,
                        color: isSelected ? colors.primary : colors.textPrimary,
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {itemLabel}
                    </Text>
                  </View>
                  {isSelected && <Check size={20} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (prefsLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["bottom"]}
      >
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
        />
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{ marginTop: 16, fontSize: 16, color: colors.textSecondary }}
          >
            Loading preferences...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.cardBg,
            shadowColor: colors.shadow,
            shadowOpacity: 0.05,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
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
              Preferences
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={prefsSaving}
            style={{
              backgroundColor: prefsSaving
                ? colors.textTertiary
                : colors.primary,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            {prefsSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={18} color="#FFFFFF" />
            )}
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
              {prefsSaving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Error Message */}
          {prefsError && (
            <View
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: "#DC2626" }}>
                {prefsError}
              </Text>
            </View>
          )}

          {/* Dietary Preferences */}
          <PreferenceCard
            title="Dietary Preferences"
            value={
              selectedDiets.length > 0
                ? selectedDiets
                    .map((id) => dietaryOptions.find((d) => d.id === id)?.label)
                    .join(", ")
                : "Not set"
            }
            onPress={() => setShowDietModal(true)}
            icon={Leaf}
          />

          {/* Allergies & Restrictions */}
          <PreferenceCard
            title="Allergies & Restrictions"
            value={
              selectedAllergies.length > 0
                ? selectedAllergies
                    .map((id) => allergyOptions.find((a) => a.id === id)?.label)
                    .join(", ")
                : "None"
            }
            onPress={() => setShowAllergyModal(true)}
            icon={AlertTriangle}
          />

          {/* Favorite Cuisines */}
          <PreferenceCard
            title="Favorite Cuisines"
            value={
              selectedCuisines.length > 0
                ? selectedCuisines.join(", ")
                : "Not set"
            }
            onPress={() => setShowCuisineModal(true)}
            icon={Globe}
          />

          {/* Cooking Skill Level */}
          <PreferenceCard
            title="Cooking Skill Level"
            value={skillLevel}
            onPress={() => setShowSkillModal(true)}
            icon={TrendingUp}
          />

          {/* Meal Goals */}
          <PreferenceCard
            title="Meal Goals"
            value={
              selectedGoals.length > 0 ? selectedGoals.join(", ") : "Not set"
            }
            onPress={() => setShowGoalsModal(true)}
            icon={Target}
          />

          {/* Ingredients to Avoid */}
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              shadowColor: colors.shadow,
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#FF6B6B15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ban size={20} color="#FF6B6B" strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textPrimary,
                  fontWeight: "500",
                }}
              >
                Ingredients to Avoid
              </Text>
            </View>
            <TextInput
              placeholder="e.g., mushrooms, cilantro"
              placeholderTextColor={colors.textTertiary}
              value={avoidIngredientsText}
              onChangeText={setAvoidIngredientsText}
              style={{
                backgroundColor: colors.background,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                fontSize: 14,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
          </View>

          {/* Default Serving Size */}
          <View
            style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: colors.shadow,
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${colors.primary}15`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={20} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  color: colors.textPrimary,
                  fontWeight: "500",
                }}
              >
                Default Serving Size
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <TouchableOpacity
                onPress={() => setServingSize(Math.max(1, servingSize - 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Minus size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: colors.textPrimary,
                  width: 30,
                  textAlign: "center",
                }}
              >
                {servingSize}
              </Text>
              <TouchableOpacity
                onPress={() => setServingSize(Math.min(12, servingSize + 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: colors.primary,
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <Plus size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      <SelectionModal
        visible={showDietModal}
        onClose={() => setShowDietModal(false)}
        title="Dietary Preferences"
        options={dietaryOptions}
        selectedItems={selectedDiets}
        onToggle={(item) =>
          toggleSelection(selectedDiets, setSelectedDiets, item)
        }
      />

      <SelectionModal
        visible={showAllergyModal}
        onClose={() => setShowAllergyModal(false)}
        title="Allergies & Restrictions"
        options={allergyOptions}
        selectedItems={selectedAllergies}
        onToggle={(item) =>
          toggleSelection(selectedAllergies, setSelectedAllergies, item)
        }
      />

      <SelectionModal
        visible={showCuisineModal}
        onClose={() => setShowCuisineModal(false)}
        title="Favorite Cuisines"
        options={cuisineOptions}
        selectedItems={selectedCuisines}
        onToggle={(item) =>
          toggleSelection(selectedCuisines, setSelectedCuisines, item)
        }
      />

      <SelectionModal
        visible={showSkillModal}
        onClose={() => setShowSkillModal(false)}
        title="Cooking Skill Level"
        options={skillLevels}
        selectedItems={[skillLevel]}
        onToggle={(item) => setSkillLevel(item as typeof skillLevel)}
        multiSelect={false}
      />

      <SelectionModal
        visible={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
        title="Meal Goals"
        options={mealGoals}
        selectedItems={selectedGoals}
        onToggle={(item) =>
          toggleSelection(selectedGoals, setSelectedGoals, item)
        }
      />
    </SafeAreaView>
  );
}
