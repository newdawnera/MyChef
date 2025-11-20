// app/preferences/index.tsx

import React, { useState } from "react";
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
} from "lucide-react-native";
import { useRouter } from "expo-router";

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
  const [showDietModal, setShowDietModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("Intermediate");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState("");
  const [servingSize, setServingSize] = useState(2);

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
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: "#E5E7EB",
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
            backgroundColor: "#70AD4715",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color="#70AD47" strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              color: "#1A1A1A",
              fontWeight: "500",
              marginBottom: 2,
            }}
          >
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280" }} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color="#9CA3AF" />
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
            backgroundColor: "#FFFFFF",
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
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1A1A1A" }}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6B7280" />
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
                    paddingHorizontal: 16,
                    backgroundColor: isSelected ? "#70AD4710" : "#F8F9FA",
                    borderRadius: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: isSelected ? "#70AD47" : "#E5E7EB",
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
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: isSelected
                            ? "#70AD4720"
                            : "#70AD4710",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ItemIcon size={16} color="#70AD47" strokeWidth={1.5} />
                      </View>
                    )}
                    <Text
                      style={{
                        fontSize: 15,
                        color: isSelected ? "#70AD47" : "#1A1A1A",
                        fontWeight: isSelected ? "600" : "400",
                      }}
                    >
                      {itemLabel}
                    </Text>
                  </View>
                  {isSelected && (
                    <Check size={20} color="#70AD47" strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {multiSelect && (
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: "#70AD47",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}
              >
                Done
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="dark-content" />

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
            gap: 12,
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
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
            Preferences
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
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

          {/* Allergies */}
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
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              borderWidth: 1,
              borderColor: "#E5E7EB",
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
                style={{ fontSize: 15, color: "#1A1A1A", fontWeight: "500" }}
              >
                Ingredients to Avoid
              </Text>
            </View>
            <TextInput
              placeholder="e.g., mushrooms, cilantro"
              placeholderTextColor="#9CA3AF"
              value={avoidIngredients}
              onChangeText={setAvoidIngredients}
              style={{
                backgroundColor: "#F8F9FA",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                fontSize: 14,
                color: "#1A1A1A",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            />
          </View>

          {/* Default Serving Size */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              borderWidth: 1,
              borderColor: "#E5E7EB",
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
                  backgroundColor: "#70AD4715",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={20} color="#70AD47" strokeWidth={1.5} />
              </View>
              <Text
                style={{ fontSize: 15, color: "#1A1A1A", fontWeight: "500" }}
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
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Minus size={18} color="#6B7280" />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#1A1A1A",
                  width: 30,
                  textAlign: "center",
                }}
              >
                {servingSize}
              </Text>
              <TouchableOpacity
                onPress={() => setServingSize(Math.min(6, servingSize + 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#70AD47",
                  alignItems: "center",
                  justifyContent: "center",
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
        onToggle={setSkillLevel}
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
