// app/login/index.tsx

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock, User, ChefHat } from "lucide-react-native";
import { useRouter } from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Animation refs
  const logoScaleAnim = useRef(new Animated.Value(1)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateX = useRef(new Animated.Value(0)).current;

  const router = useRouter();

  // Logo breathing animation
  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(logoScaleAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, []);

  // Bi-directional slide-in transition when switching between login/signup
  useEffect(() => {
    // Determine slide direction based on current mode
    // When switching TO login: slide from left (form exits right, enters from left)
    // When switching TO signup: slide from right (form exits left, enters from right)
    const exitDirection = isLogin ? 300 : -300; // Exit to the right for login, left for signup
    const enterDirection = isLogin ? -300 : 300; // Enter from the left for login, right for signup

    // Step 1: Slide out with fade
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateX, {
        toValue: exitDirection,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Reset position to opposite side
      formTranslateX.setValue(enterDirection);

      // Step 3: Slide in with fade
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
      ]).start();
    });
  }, [isLogin]);

  const handleSubmit = () => {
    router.replace("/home");
  };

  const handleTabSwitch = (loginMode: boolean) => {
    setIsLogin(loginMode);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8F9FA" }}
      edges={["bottom"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 24,
            minHeight: SCREEN_HEIGHT - 100,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Title */}
          <View
            style={{ alignItems: "center", marginTop: 32, marginBottom: 32 }}
          >
            <Animated.View
              style={{
                // This container just handles layout and scaling
                width: 64,
                height: 64,
                marginBottom: 12,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: logoScaleAnim }],
              }}
            >
              {/* Layer 1: The "Glow" (Casts the shadow) */}
              {/* This View is *only* for casting the shadow. */}
              {/* It must have a background color to cast from. */}
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "white", // Can be any color, needed to cast shadow
                  shadowColor: "#4CAF50",
                  shadowOpacity: 0.7, // Set your desired glow opacity
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 25, // Set your desired glow radius
                  elevation: 8, // For Android
                  position: "absolute", // Place behind content
                }}
              />

              {/* Layer 2: The Content (Sits on top) */}
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(76, 175, 80, 0.1)",
                  overflow: "hidden", // Clip the icon/background
                  position: "absolute", // Sit on top of shadow layer
                }}
              >
                <ChefHat size={32} color="#4CAF50" strokeWidth={1.5} />
              </View>
            </Animated.View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#1A1A1A",
                marginBottom: 8,
              }}
            >
              MyChef
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              Your AI-powered cooking companion
            </Text>
          </View>

          {/* Toggle Tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 4,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TouchableOpacity
              onPress={() => handleTabSwitch(true)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isLogin ? "#4CAF50" : "transparent",
                shadowColor: isLogin ? "#4CAF50" : "transparent",
                shadowOpacity: isLogin ? 0.3 : 0,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: isLogin ? 4 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isLogin ? "#FFFFFF" : "#6B7280",
                }}
              >
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleTabSwitch(false)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: !isLogin ? "#4CAF50" : "transparent",
                shadowColor: !isLogin ? "#4CAF50" : "transparent",
                shadowOpacity: !isLogin ? 0.3 : 0,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 8,
                elevation: !isLogin ? 4 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: !isLogin ? "#FFFFFF" : "#6B7280",
                }}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form with Bi-directional Slide Animation */}
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateX: formTranslateX }],
              flex: 1,
            }}
          >
            {/* Name Field - Only for Sign Up */}
            {!isLogin && (
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "400",
                    color: "#1A1A1A",
                    marginBottom: 8,
                  }}
                >
                  Name
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                  }}
                >
                  <User size={20} color="#6B7280" style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    style={{
                      flex: 1,
                      fontSize: 16,
                      color: "#1A1A1A",
                      padding: 0,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Email Field */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "400",
                  color: "#1A1A1A",
                  marginBottom: 8,
                }}
              >
                Email
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                }}
              >
                <Mail size={20} color="#6B7280" style={{ marginRight: 12 }} />
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: "#1A1A1A",
                    padding: 0,
                  }}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "400",
                  color: "#1A1A1A",
                  marginBottom: 8,
                }}
              >
                Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 16,
                  paddingVertical: 16,
                }}
              >
                <Lock size={20} color="#6B7280" style={{ marginRight: 12 }} />
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: "#1A1A1A",
                    padding: 0,
                  }}
                />
              </View>
            </View>

            {/* Forgot Password - Only for Login */}
            {isLogin && (
              <View style={{ alignItems: "flex-end", marginBottom: 24 }}>
                <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#4CAF50",
                      fontWeight: "400",
                    }}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Main Submit Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#4CAF50",
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                marginTop: isLogin ? 0 : 0,
                shadowColor: "#4CAF50",
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 12,
                elevation: 8,
              }}
              onPress={handleSubmit}
              activeOpacity={0.9}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {isLogin ? "Login" : "Sign Up"}
              </Text>
            </TouchableOpacity>

            {/* Or continue with */}
            <Text
              style={{
                marginTop: 24,
                marginBottom: 16,
                textAlign: "center",
                fontSize: 16,
                color: "#6B7280",
              }}
            >
              or continue with
            </Text>

            {/* Social Buttons */}
            <View
              style={{
                flexDirection: "row",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#1A1A1A",
                    fontWeight: "400",
                  }}
                >
                  Google
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: "#1A1A1A",
                    fontWeight: "400",
                  }}
                >
                  Facebook
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
