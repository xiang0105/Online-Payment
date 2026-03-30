import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { useUser } from "@/context/UserContext"; // ★ 引入 UserContext
import { AntDesign, Feather, FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useUser(); // ★ 直接從 Context 拿顏色

  // 定義 TabBar 的樣式
  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.cardBackground,
      borderTopWidth: isDark ? 1 : 0,
      borderTopColor: colors.border,

      // --- iOS Shadow ---
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 12,

      // --- Android Elevation ---
      elevation: 20,

      height: 64 + insets.bottom,
      paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
      paddingTop: 10,
      position: "absolute" as const, // 讓 Bar 懸浮感更強
    }),
    [colors, isDark, insets]
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subText,
        headerShown: false,
        tabBarStyle: tabBarStyle,
        tabBarButton: HapticTab, // 保持震動回饋
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首頁",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="home" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: "地圖",
          tabBarIcon: ({ color }) => (
            <Feather name="map" size={22} color={color} />
          ),
        }}
      />

      {/* ★ 掃描按鈕：特殊佈局處理 ★ */}
      <Tabs.Screen
        name="scan"
        options={{
          title: "掃描",
          tabBarStyle: { display: "none" }, // 進入掃描後隱藏，避免擋住鏡頭
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.scanButtonContainer,
                {
                  backgroundColor: colors.primary,
                  // 當點擊時增加一點點發光感
                  shadowColor: colors.primary,
                  shadowOpacity: focused ? 0.6 : 0.3,
                },
              ]}
            >
              <AntDesign name="scan" size={26} color="white" />
            </View>
          ),
          // 讓 Label 下移一點點，或者不顯示 Label 以維持簡潔
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="list"
        options={{
          title: "其他",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="list-ul" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="accounting"
        options={{
          title: "記帳",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="book" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButtonContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    // 關鍵：將按鈕向上提，做出突起效果
    marginTop: Platform.OS === "ios" ? -35 : -40,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 4,
    borderColor: "transparent", // 可在此加邊框讓它與 TabBar 更有結合感
  },
});
