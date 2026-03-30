import CreditCard from "@/components/CreditCard";
import Wave from "@/components/Wave";
import { useCards } from "@/context/CardContext";
import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Barcode from "react-native-barcode-svg";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 220;

const AnimatedCard = ({ card, index, scrollY, totalCards }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * CARD_HEIGHT,
      index * CARD_HEIGHT,
      (index + 1) * CARD_HEIGHT,
    ];

    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            inputRange,
            [45, 0, -45],
            Extrapolate.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollY.value,
            inputRange,
            [0.88, 1, 0.88],
            Extrapolate.CLAMP
          ),
        },
      ],
      opacity: interpolate(
        scrollY.value,
        inputRange,
        [0.5, 1, 0.5],
        Extrapolate.CLAMP
      ),
      zIndex: Math.round(
        totalCards -
          index +
          interpolate(scrollY.value, inputRange, [0, 100, 0], Extrapolate.CLAMP)
      ),
    };
  });

  return (
    <Animated.View style={[styles.cardAbsolute, animatedStyle]}>
      <CreditCard data={card} height={CARD_HEIGHT} />
    </Animated.View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userInfo, colors, isDark } = useUser();
  const { cards } = useCards();

  const visibleCards = useMemo(
    () => cards.filter((card) => card.isEnabled !== false),
    [cards]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollY = useSharedValue(0);
  const currentCard = visibleCards[activeIndex];

  // 取得純數字卡號（Barcode 專用）
  const cleanCardNumber = useMemo(() => {
    if (!currentCard || !currentCard.cardNumber) return "";
    return String(currentCard.cardNumber).replace(/\s/g, "");
  }, [currentCard]);

  // 已使用金額
  const usedAmount = useMemo(() => {
    if (!currentCard) return 0;
    return (currentCard.totalLimit || 0) - (currentCard.availableBalance || 0);
  }, [currentCard]);

  // 波浪圖百分比計算：(已使用 / 總額度) * 100
  const balancePercentage = useMemo(() => {
    if (!currentCard || !currentCard.totalLimit) return 15;
    const percent = (usedAmount / currentCard.totalLimit) * 100;
    return Math.min(Math.max(percent, 15), 90);
  }, [currentCard, usedAmount]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useAnimatedReaction(
    () => scrollY.value,
    (currentScrollY) => {
      const index = Math.round(currentScrollY / CARD_HEIGHT);
      if (index !== activeIndex && index >= 0 && index < visibleCards.length) {
        runOnJS(setActiveIndex)(index);
      }
    }
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 10 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={styles.userInfo}
        >
          <Image
            source={{
              // ★★★ 修正處：將 userInfo.avatar 改為 userInfo.avatar_url ★★★
              uri:
                userInfo?.avatar_url ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={[styles.avatar, { borderColor: colors.cardBackground }]}
          />
          <View>
            <Text style={[styles.greetingSmall, { color: colors.subText }]}>
              歡迎回來,
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userInfo?.name || "使用者"}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.cardBackground }]}
            onPress={() => router.push("/select-card")}
          >
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.cardBackground }]}
            // onPress={() => router.push("/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Deck */}
      <View style={styles.deckWrapper}>
        {visibleCards.length > 0 ? (
          <View style={styles.deckContainer}>
            {visibleCards.map((card, index) => (
              <AnimatedCard
                key={card.id}
                card={card}
                index={index}
                scrollY={scrollY}
                totalCards={visibleCards.length}
              />
            ))}
            <Animated.ScrollView
              style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
              contentContainerStyle={{
                height: visibleCards.length * CARD_HEIGHT,
              }}
              snapToInterval={CARD_HEIGHT}
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              snapToAlignment="start"
              onScroll={scrollHandler}
              scrollEventThrottle={16}
              disableIntervalMomentum={true}
              bounces={false}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.emptyCardContainer, { borderColor: colors.border }]}
            onPress={() => router.push("/select-card")}
          >
            <Ionicons
              name="add-circle-outline"
              size={50}
              color={colors.subText}
            />
            <Text style={[styles.addCardText, { color: colors.subText }]}>
              點擊新增您的第一張卡片
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.staticAreaContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentCard ? (
          <View>
            {/* 條碼區塊 */}
            <View
              style={[
                styles.paymentCodeSection,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.barcodeWrapper}>
                {cleanCardNumber ? (
                  <View style={{ alignItems: "center" }}>
                    <Barcode
                      value={cleanCardNumber}
                      format="CODE128"
                      height={50}
                      lineColor={isDark ? "#FFF" : "#000"}
                      singleBarWidth={2}
                    />
                    <Text
                      style={[styles.barcodeNumberText, { color: colors.text }]}
                    >
                      {cleanCardNumber.replace(/(.{4})/g, "$1 ")}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.subText }}>無有效卡號</Text>
                )}
              </View>
            </View>

            {/* 額度進度區 */}
            <View
              style={[
                styles.waterContainer,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.waveWrapper}>
                <Wave
                  heightPercent={balancePercentage}
                  color={colors.primary}
                />
              </View>
              <View style={styles.waterContent}>
                <Text
                  style={[
                    styles.limitLabel,
                    { color: isDark ? colors.primary : "#7DA0C4" },
                  ]}
                >
                  AVAILABLE LIMIT
                </Text>
                <View style={styles.limitRow}>
                  <Text style={[styles.limitValue, { color: colors.text }]}>
                    ${usedAmount.toLocaleString()}
                  </Text>
                  <Text
                    style={[styles.limitSeparator, { color: colors.subText }]}
                  >
                    /
                  </Text>
                  <Text style={[styles.limitTotal, { color: colors.subText }]}>
                    {(currentCard.totalLimit || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={{ color: colors.subText }}>請滑動至有效卡片</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    height: 60,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1.5,
  },
  greetingSmall: { fontSize: 12, fontWeight: "500" },
  userName: { fontSize: 16, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  deckWrapper: {
    height: CARD_HEIGHT + 40,
    marginTop: 10,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  deckContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardAbsolute: { position: "absolute", width: "100%", height: CARD_HEIGHT },
  emptyCardContainer: {
    height: CARD_HEIGHT,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  addCardText: { fontSize: 14, fontWeight: "600", marginTop: 12 },
  staticAreaContainer: { paddingHorizontal: 24, marginTop: 20, flex: 1 },
  paymentCodeSection: {
    borderRadius: 28,
    padding: 25,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  barcodeWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  barcodeNumberText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    letterSpacing: 2,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  waterContainer: {
    height: 130,
    borderRadius: 28,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    elevation: 4,
  },
  waveWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    opacity: 0.6,
  },
  waterContent: { alignItems: "center", zIndex: 10 },
  limitLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
    textAlign: "center",
  },
  limitRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  limitValue: {
    fontSize: 22,
    fontWeight: "900",
    width: 100,
    textAlign: "right",
  },
  limitSeparator: { fontSize: 22, marginHorizontal: 8, opacity: 0.3 },
  limitTotal: {
    fontSize: 18,
    fontWeight: "600",
    width: 100,
    textAlign: "left",
  },
  placeholderBox: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.5,
  },
});
