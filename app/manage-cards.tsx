import { useBank } from "@/context/BankContext";
import { useCards } from "@/context/CardContext";
import { useUser } from "@/context/UserContext";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 220;

const formatCardNumber = (num: string) => {
  if (!num) return "•••• 0000";
  return `•••• •••• •••• ${num.slice(-4)}`;
};

export default function ManageCardsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Contexts
  const { cards } = useCards();
  const { accounts, updateBalance, deleteAccount } = useBank();
  const { colors, isDark } = useUser();

  // ★ 處理餘額修改 (點擊金額時觸發)
  const handleEditBalance = (account: any) => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "調整餘額",
        `目前餘額：$${account.balance}`,
        [
          { text: "取消", style: "cancel" },
          {
            text: "確認修改",
            // ★★★ 修正點：明確指定 val 的型別為 string | undefined ★★★
            onPress: (val?: string) => {
              const newBal = Number(val);
              if (!isNaN(newBal)) {
                updateBalance(account.id, newBal);
              } else {
                Alert.alert("錯誤", "請輸入有效的數字");
              }
            },
          },
        ],
        "plain-text",
        String(account.balance),
        "numeric"
      );
    } else {
      // Android 暫時替代方案
      Alert.alert("模擬存提款 (Android)", "請選擇操作", [
        { text: "取消", style: "cancel" },
        {
          text: "提款 $1,000",
          onPress: () =>
            updateBalance(account.id, Math.max(0, account.balance - 1000)),
        },
        {
          text: "存款 $1,000",
          onPress: () => updateBalance(account.id, account.balance + 1000),
        },
      ]);
    }
  };

  // 處理刪除銀行帳戶
  const handleDeleteBank = (id: string, name: string) => {
    Alert.alert("刪除帳戶", `確定要移除 ${name} 嗎？`, [
      { text: "取消", style: "cancel" },
      { text: "刪除", style: "destructive", onPress: () => deleteAccount(id) },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          我的錢包與卡片
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* --- 區塊 1: 信用卡列表 --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>
            信用卡 / 簽帳卡
          </Text>
        </View>

        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={styles.cardWrapper}
            onPress={() =>
              router.push({
                pathname: "/card-settings",
                params: { id: card.id },
              })
            }
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.cardInner,
                { backgroundColor: card.backgroundColor },
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardBrand}>EasySplit.</Text>
                <MaterialCommunityIcons
                  name="contactless-payment"
                  size={32}
                  color="rgba(255,255,255,0.8)"
                />
              </View>

              <View style={{ marginTop: 20 }}>
                <View style={styles.chip} />
                <Text style={styles.activeCardNumber}>
                  {formatCardNumber(card.cardNumber)}
                </Text>
                <Text style={styles.expiryText}>{card.expiry}</Text>
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.cardHolder}>
                  {card.name || "CARD HOLDER"}
                </Text>
                {card.type === "MASTERCARD" ? (
                  <FontAwesome5 name="cc-mastercard" size={36} color="#fff" />
                ) : (
                  <FontAwesome5 name="cc-visa" size={36} color="#fff" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[
            styles.addButton,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? colors.cardBackground : "#FAFAFA",
            },
          ]}
          onPress={() => router.push("/select-card")}
        >
          <Text style={[styles.addText, { color: colors.subText }]}>
            + 新增信用卡
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },

  // 分區標題
  sectionHeader: { marginBottom: 15 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // 卡片樣式
  cardWrapper: {
    width: "100%",
    height: CARD_HEIGHT,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: "transparent",
  },
  cardInner: {
    flex: 1,
    borderRadius: 20,
    padding: 25,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardBrand: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  chip: {
    width: 45,
    height: 32,
    backgroundColor: "#D4AF37",
    borderRadius: 6,
    marginBottom: 15,
  },
  activeCardNumber: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  expiryText: { color: "rgba(255,255,255,0.8)", fontSize: 12 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardHolder: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  // 通用新增按鈕
  addButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  addText: { fontSize: 15, fontWeight: "600" },

  // 銀行列表樣式
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  accountNum: { fontSize: 13 },
  bankActions: { flexDirection: "row", alignItems: "center" },
  balanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  balanceText: { fontSize: 16, fontWeight: "700" },
  deleteBtn: { marginLeft: 15, padding: 4 },
});
