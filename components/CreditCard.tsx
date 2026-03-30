import { useCards } from "@/context/CardContext"; // ★ 引入 Context 取得顏色
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View, useColorScheme } from "react-native";

const formatCardNumber = (num: string) => {
  if (!num) return "•••• 0000";
  return `•••• •••• •••• ${num.slice(-4)}`;
};

interface CreditCardProps {
  data: {
    name?: string;
    cardNumber: string;
    expiry?: string;
    type: string;
    backgroundColor: string;
    limit?: string | number;
  };
  showBalance?: boolean;
  showBrand?: boolean;
  height?: number;
}

// ★ 使用 React.memo 優化，防止列表滾動時頻繁重繪
const CreditCard = React.memo(
  ({
    data,
    showBalance = false,
    showBrand = true,
    height = 220,
  }: CreditCardProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const { cardColors } = useCards(); // ★ 從 Context 取得適配顏色

    // 判斷是否為「黑卡」且處於「深色模式」，若是則需要亮色邊框
    const needsBorder = useMemo(() => {
      return (
        isDark &&
        (data.backgroundColor === "#1A1A1A" ||
          data.backgroundColor === "#000000")
      );
    }, [isDark, data.backgroundColor]);

    const balance = useMemo(() => {
      const num = parseFloat(String(data.limit));
      return isNaN(num) ? "0" : num.toLocaleString();
    }, [data.limit]);

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: data.backgroundColor,
            height,
            shadowColor: cardColors.shadow, // ★ 自動適配深淺色陰影
            borderWidth: needsBorder ? 1 : 0,
            borderColor: "rgba(255,255,255,0.2)",
          },
        ]}
      >
        {/* 玻璃感覆蓋層 */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: cardColors.overlay },
          ]}
        />

        {/* Top Row */}
        <View style={styles.cardTop}>
          {showBrand ? (
            <Text style={[styles.cardBrand, { color: cardColors.text }]}>
              EasySplit.
            </Text>
          ) : (
            <MaterialCommunityIcons
              name="chip"
              size={40}
              color={data.backgroundColor === "#1A1A1A" ? "#999" : "#FFD700"}
            />
          )}
          <MaterialCommunityIcons
            name="contactless-payment"
            size={32}
            color="rgba(255,255,255,0.6)"
          />
        </View>

        {/* Middle Row */}
        <View style={{ marginTop: showBrand ? 15 : 5 }}>
          {showBrand && <View style={styles.chip} />}
          <Text style={[styles.cardNumber, { color: cardColors.text }]}>
            {formatCardNumber(data.cardNumber)}
          </Text>
          {data.expiry && <Text style={styles.expiry}>{data.expiry}</Text>}
        </View>

        {/* Bottom Row */}
        <View style={styles.cardBottom}>
          <View style={{ flex: 1 }}>
            {showBalance ? (
              <>
                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                <Text style={[styles.balanceValue, { color: cardColors.text }]}>
                  ${balance}
                </Text>
              </>
            ) : (
              <Text style={[styles.cardHolder, { color: cardColors.text }]}>
                {data.name || "CARD HOLDER"}
              </Text>
            )}
          </View>

          {data.type === "MASTERCARD" ? (
            <FontAwesome5
              name="cc-mastercard"
              size={36}
              color="rgba(255,255,255,0.9)"
            />
          ) : (
            <FontAwesome5
              name="cc-visa"
              size={36}
              color="rgba(255,255,255,0.9)"
            />
          )}
        </View>
      </View>
    );
  }
);

export default CreditCard;

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    justifyContent: "space-between",
    overflow: "hidden",
    elevation: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },
  cardBrand: { fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  chip: {
    width: 42,
    height: 30,
    backgroundColor: "#D4AF37",
    borderRadius: 6,
    marginBottom: 12,
    opacity: 0.9,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 2,
    fontFamily: "System",
    marginBottom: 4,
  },
  expiry: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "500" },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    zIndex: 1,
  },
  cardHolder: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  balanceValue: { fontSize: 24, fontWeight: "800", fontStyle: "italic" },
});
