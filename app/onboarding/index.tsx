// app/onboarding/index.tsx

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from "react-native";
import { ChefHat, Sparkles, BookMarked, Wand2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PanGestureHandler,
  State,
  PanGestureHandlerStateChangeEvent,
} from "react-native-gesture-handler";

const { width } = Dimensions.get("window");

const slides = [
  {
    icon: ChefHat,
    title: "MyChef",
    description: "Your AI Cooking Assistant",
    color: "#70AD47",
    isSplash: true,
  },
  {
    icon: Wand2,
    title: "AI-Powered Recipes",
    description:
      "Get personalized recipe suggestions based on your preferences and available ingredients",
    color: "#70AD47",
    isSplash: false,
  },
  {
    icon: Sparkles,
    title: "Smart Suggestions",
    description:
      "Our AI learns your taste and dietary needs to provide better recommendations",
    color: "#FF9500",
    isSplash: false,
  },
  {
    icon: BookMarked,
    title: "Save & Organize",
    description:
      "Keep your favorite recipes in one place and access them anytime",
    color: "#70AD47",
    isSplash: false,
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slide = slides[index];
  const Icon = slide.icon;

  // Auto-advance from splash screen after 2 seconds
  useEffect(() => {
    if (index === 0) {
      const timer = setTimeout(() => {
        setIndex(1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [index]);

  // Fade & slight slide-in animation for content
  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [index]);

  // Continuous icon animations
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    rotateAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
    };
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });

  // === SWIPE HANDLER (Gesture Handler) ===
  const SWIPE_THRESHOLD = width * 0.15; // ~15% of screen width

  const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { translationX, oldState } = event.nativeEvent;

    // We only care when the gesture ends after being active
    if (oldState === State.ACTIVE) {
      // RIGHT -> LEFT swipe (finger moves left, translationX negative) => NEXT slide
      if (translationX < -SWIPE_THRESHOLD) {
        if (index < slides.length - 1) {
          setIndex((prev) => prev + 1);
        } else {
          // Only go to login when already on the last slide
          router.replace("/login");
        }
      }
      // LEFT -> RIGHT swipe (finger moves right, translationX positive) => PREVIOUS slide
      else if (translationX > SWIPE_THRESHOLD) {
        // Don't go back before the first interactive slide (index 1)
        if (index > 1) {
          setIndex((prev) => prev - 1);
        }
      }
    }
  };

  const goNext = () => {
    if (index < slides.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      router.replace("/login");
    }
  };

  // Splash screen (first slide)
  if (slide.isSplash) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F8F9FA" }}
        edges={["top", "bottom"]}
      >
        <StatusBar barStyle="dark-content" />
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
              // This container just handles layout and scaling
              width: 120,
              height: 120,
              marginBottom: 32,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: scaleAnim }, { rotate: spin }],
            }}
          >
            {/* Layer 1: The "Glow" (Casts the shadow) */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "#F8F9FA", // Match screen background
                shadowColor: slide.color, // Will be "#70AD47"
                shadowOpacity: 0.25, // Copied from the other slides
                shadowRadius: 30, // Copied from the other slides
                shadowOffset: { width: 0, height: 10 }, // Copied from the other slides
                elevation: 6,
                position: "absolute",
              }}
            />

            {/* Layer 2: The Content (Sits on top) */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(112, 173, 71, 0.15)", // The original background
                overflow: "hidden",
                position: "absolute",
              }}
            >
              <Icon size={60} color={slide.color} strokeWidth={1.5} />
            </View>
          </Animated.View>

          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: "#1A1A1A",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {slide.title}
          </Text>

          <Text
            style={{
              fontSize: 16,
              color: "#6B7280",
              textAlign: "center",
              maxWidth: "80%",
            }}
          >
            {slide.description}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Regular onboarding slides
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F8F9FA" }}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="dark-content" />

      {/* Wrap the whole screen in a PanGestureHandler so swipes anywhere work */}
      <PanGestureHandler onHandlerStateChange={onHandlerStateChange}>
        <Animated.View style={{ flex: 1, paddingTop: 10, paddingBottom: 20 }}>
          {/* Skip */}
          <View
            style={{
              alignItems: "flex-end",
              marginBottom: 20,
              paddingHorizontal: 20,
            }}
          >
            <TouchableOpacity onPress={() => router.replace("/login")}>
              <Text style={{ fontSize: 16, color: "#6B7280", padding: 8 }}>
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Animated.View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Icon Glow Circle with animations */}
            {/* Icon Glow Circle with animations */}
            <Animated.View
              style={{
                // This container just handles layout and scaling
                width: 130,
                height: 130,
                marginBottom: 40,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: scaleAnim }, { rotate: spin }],
              }}
            >
              {/* Layer 1: The "Glow" (Casts the shadow) */}
              <View
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  backgroundColor: "white", // Or "#F8F9FA" to match screen
                  shadowColor: slide.color,
                  shadowOpacity: 0.25,
                  shadowRadius: 30,
                  shadowOffset: { width: 0, height: 10 }, // You can keep the offset here
                  elevation: 6,
                  position: "absolute",
                }}
              />

              {/* Layer 2: The Content (Sits on top) */}
              <View
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: 65,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: slide.color + "15", // e.g., "rgba(112, 173, 71, 0.15)"
                  overflow: "hidden",
                  position: "absolute",
                }}
              >
                <Icon size={60} color={slide.color} strokeWidth={1.5} />
              </View>
            </Animated.View>

            {/* Title */}
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#1A1A1A",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {slide.title}
            </Text>

            {/* Description */}
            <Text
              style={{
                fontSize: 16,
                color: "#6B7280",
                textAlign: "center",
                maxWidth: "90%",
                lineHeight: 24,
              }}
            >
              {slide.description}
            </Text>
          </Animated.View>

          {/* Pagination Dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginBottom: 24,
              gap: 8,
              paddingHorizontal: 20,
            }}
          >
            {slides.slice(1).map((_, i) => {
              const dotIndex = i + 1;
              const active = dotIndex === index;
              return (
                <View
                  key={i}
                  style={{
                    height: 8,
                    borderRadius: 4,
                    width: active ? 24 : 8,
                    backgroundColor: active ? "#70AD47" : "#E5E7EB",
                  }}
                />
              );
            })}
          </View>

          {/* Next / Get Started Button */}
          <View style={{ paddingHorizontal: 20, alignItems: "center" }}>
            {/* This View just holds the stack */}
            <View
              style={{
                width: "100%",
                borderRadius: 20,
                // Apply shadow styles to this container
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <TouchableOpacity
                style={{
                  width: "100%",
                  backgroundColor: "#70AD47",
                  borderRadius: 20,
                  paddingVertical: 16,
                  alignItems: "center",
                  overflow: "hidden", // Add this to ensure content fits
                }}
                onPress={goNext}
              >
                <Text
                  style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}
                >
                  {index === slides.length - 1 ? "Get Started" : "Next"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </SafeAreaView>
  );
}
