import { useUser } from "@/context/UserContext"; // ★ 引入主題配色
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics"; // ★ 增加觸覺回饋
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 50;
const CARD_HEIGHT = CARD_WIDTH / 1.586;

const MOCK_CARDS = [
  {
    id: 1,
    name: "經典藍 (Classic Blue)",
    backgroundColor: "#2962FF",
    type: "VISA",
  },
  {
    id: 2,
    name: "尊爵黑 (Premium Black)",
    backgroundColor: "#1A1A1A",
    type: "MASTERCARD",
  },
  {
    id: 3,
    name: "活力橘 (Dynamic Orange)",
    backgroundColor: "#FF6D00",
    type: "VISA",
  },
  {
    id: 4,
    name: "薄荷綠 (Mint Green)",
    backgroundColor: "#00BFA5",
    type: "MASTERCARD",
  },
];

export default function SelectCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useUser(); // ★ 取得全局配色

  const [selectedId, setSelectedId] = useState<number>(1);

  const handleSelect = (id: number) => {
    Haptics.selectionAsync(); // 選擇震動
    setSelectedId(id);
  };

  const handleConfirm = () => {
    const card = MOCK_CARDS.find((c) => c.id === selectedId);
    if (card) {
      router.push({
        pathname: "/add-card",
        params: {
          backgroundColor: card.backgroundColor,
          type: card.type,
          styleName: card.name, // 修正 Key 名稱
        },
      });
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* 自定義 Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          選擇卡片樣式
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        <Text style={[styles.instructionText, { color: colors.subText }]}>
          請選擇您喜歡的卡面設計：
        </Text>

        {MOCK_CARDS.map((card) => {
          const isSelected = selectedId === card.id;

          return (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.8}
              onPress={() => handleSelect(card.id)}
              style={[
                styles.cardWrapper,
                isSelected && {
                  borderColor: colors.primary,
                  backgroundColor: isDark
                    ? "rgba(41, 98, 255, 0.1)"
                    : "#F0F5FF",
                },
              ]}
            >
              <View
                style={[
                  styles.cardView,
                  { backgroundColor: card.backgroundColor },
                ]}
              >
                {/* 卡片裝飾背景 (增加質感) */}
                <View style={styles.cardOverlay} />

                <View style={styles.cardTopRow}>
                  <Text style={styles.cardBrand}>EasySplit.</Text>
                  <MaterialCommunityIcons
                    name="contactless-payment"
                    size={26}
                    color="rgba(255,255,255,0.7)"
                  />
                </View>

                <View style={styles.chipBox}>
                  <View style={styles.chip} />
                </View>

                <Text style={styles.cardPlaceholderDots}>
                  •••• •••• •••• 8888
                </Text>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.cardHolder}>NEW MEMBER</Text>
                  <FontAwesome5
                    name={card.type === "VISA" ? "cc-visa" : "cc-mastercard"}
                    size={32}
                    color="#fff"
                  />
                </View>

                {/* 選中覆蓋層 */}
                {isSelected && (
                  <View style={styles.checkMarkOverlay}>
                    <View style={styles.checkIconCircle}>
                      <Ionicons
                        name="checkmark"
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.styleNameLabel,
                  {
                    color: isSelected ? colors.primary : colors.subText,
                    fontWeight: isSelected ? "700" : "500",
                  },
                ]}
              >
                {card.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 底部按鈕區 */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 20,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleConfirm}
        >
          <Text style={styles.submitBtnText}>確認樣式</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 50,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  instructionText: { fontSize: 15, marginBottom: 20, fontWeight: "500" },
  cardWrapper: {
    marginBottom: 25,
    alignItems: "center",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardView: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 24,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  cardOverlay: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBrand: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  chipBox: { marginTop: 10 },
  chip: {
    width: 44,
    height: 32,
    backgroundColor: "#FFD700",
    borderRadius: 6,
    opacity: 0.8,
  },
  cardPlaceholderDots: {
    color: "#fff",
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: "600",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardHolder: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
    letterSpacing: 1,
  },
  checkMarkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },
  styleNameLabel: { marginTop: 12, fontSize: 14 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 25,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  submitBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
