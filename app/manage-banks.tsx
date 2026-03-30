import { useBank } from "@/context/BankContext";
import { useUser } from "@/context/UserContext"; // 引入 UserContext
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 格式化帳號顯示 (只顯示後四碼)
const formatAccountNumber = (num: string) => {
  if (!num) return "••••";
  return `•••• ${num.slice(-4)}`;
};

export default function ManageBanksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Contexts
  const { accounts, updateBalance, deleteAccount } = useBank();
  const { colors, isDark, userInfo, updateUser } = useUser(); // ★ 取得 userInfo 與 updateUser

  // --- 1. 修改錢包餘額 (User Context) ---
  const handleEditWalletBalance = () => {
    if (!userInfo) return;

    if (Platform.OS === "ios") {
      Alert.prompt(
        "調整錢包餘額",
        `目前餘額：$${userInfo.balance}`,
        [
          { text: "取消", style: "cancel" },
          {
            text: "確認修改",
            onPress: (val?: string) => {
              const newBal = Number(val);
              if (!isNaN(newBal)) {
                // 更新資料庫的使用者餘額
                updateUser({ balance: newBal });
              } else {
                Alert.alert("錯誤", "請輸入有效的數字");
              }
            },
          },
        ],
        "plain-text",
        String(userInfo.balance),
        "numeric"
      );
    } else {
      Alert.alert("模擬錢包存提款", "請選擇操作", [
        { text: "取消", style: "cancel" },
        {
          text: "提款 $1,000",
          onPress: () =>
            updateUser({ balance: Math.max(0, userInfo.balance - 1000) }),
        },
        {
          text: "存款 $1,000",
          onPress: () => updateUser({ balance: userInfo.balance + 1000 }),
        },
      ]);
    }
  };

  // --- 2. 修改外部銀行餘額 (Bank Context) ---
  const handleEditBankBalance = (account: any) => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "調整銀行餘額",
        `目前餘額：$${account.balance}`,
        [
          { text: "取消", style: "cancel" },
          {
            text: "確認修改",
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
      Alert.alert("模擬銀行存提款", "請選擇操作", [
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
    Alert.alert("移除帳戶", `確定要移除 ${name} 嗎？`, [
      { text: "取消", style: "cancel" },
      {
        text: "移除",
        style: "destructive",
        onPress: () => deleteAccount(id),
      },
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
          管理銀行帳戶
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>
            預設帳戶 (不可刪除)
          </Text>
        </View>

        {/* ★★★ 1. 我的錢包 (固定顯示，連結 userInfo.balance) ★★★ */}
        <View
          style={[
            styles.bankCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: "#F2C94C", // 金色邊框強調
              borderWidth: 1.5,
            },
          ]}
        >
          {/* 左側：錢包圖標 */}
          <View style={styles.bankContent}>
            <View
              style={[
                styles.bankIconBox,
                { backgroundColor: "#F2C94C" }, // 錢包專屬色
              ]}
            >
              <Ionicons name="wallet" size={24} color="#FFF" />
            </View>
            <View style={styles.bankInfo}>
              <Text style={[styles.bankName, { color: colors.text }]}>
                我的錢包
              </Text>
              <Text style={[styles.accountNum, { color: colors.subText }]}>
                EasySplit Wallet
              </Text>
            </View>
          </View>

          {/* 右側：錢包餘額 (無刪除按鈕) */}
          <View style={styles.bankActions}>
            <Text style={[styles.balanceLabel, { color: colors.subText }]}>
              餘額
            </Text>
            <Text
              style={[
                styles.balanceAmount,
                { color: isDark ? "#F2C94C" : "#F2994A" }, // 金橘色文字
              ]}
            >
              ${userInfo?.balance.toLocaleString() || 0}
            </Text>
          </View>
        </View>

        {/* --- 2. 外部銀行帳戶列表 --- */}
        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>
            已連結帳戶 ({accounts.length})
          </Text>
        </View>

        {accounts.length > 0 ? (
          accounts.map((bank) => (
            <View
              key={bank.id}
              style={[
                styles.bankCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* 左側：圖標與基本資訊 */}
              <View style={styles.bankContent}>
                <View
                  style={[
                    styles.bankIconBox,
                    { backgroundColor: bank.color || "#0052FF" },
                  ]}
                >
                  <MaterialCommunityIcons name="bank" size={24} color="#FFF" />
                </View>
                <View style={styles.bankInfo}>
                  <Text style={[styles.bankName, { color: colors.text }]}>
                    {bank.bankName}
                  </Text>
                  <Text style={[styles.accountNum, { color: colors.subText }]}>
                    {formatAccountNumber(bank.accountNumber)}
                  </Text>
                </View>
              </View>

              {/* 右側：餘額與操作 */}
              <View style={styles.bankActions}>
                <TouchableOpacity
                  onPress={() => handleEditBankBalance(bank)}
                  style={styles.balanceBtn}
                >
                  <Text
                    style={[styles.balanceLabel, { color: colors.subText }]}
                  >
                    餘額
                  </Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      { color: isDark ? "#4CAF50" : "#2E7D32" },
                    ]}
                  >
                    ${bank.balance.toLocaleString()}
                  </Text>
                </TouchableOpacity>

                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />

                <TouchableOpacity
                  onPress={() => handleDeleteBank(bank.id, bank.bankName)}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="bank-off-outline"
              size={48}
              color={colors.subText}
              style={{ opacity: 0.5 }}
            />
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              目前沒有連結其他銀行帳戶
            </Text>
          </View>
        )}

        {/* 新增按鈕 */}
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              borderColor: colors.border,
              backgroundColor: isDark ? colors.cardBackground : "#FAFAFA",
            },
          ]}
          onPress={() => router.push("/add-bank")}
        >
          <Text style={[styles.addText, { color: colors.subText }]}>
            + 連結新帳戶
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

  sectionHeader: { marginBottom: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // 銀行卡片樣式
  bankCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bankContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  accountNum: { fontSize: 13, letterSpacing: 0.5 },

  // 右側操作區
  bankActions: {
    flexDirection: "column",
    alignItems: "center",
  },
  balanceBtn: {
    alignItems: "flex-end",
    paddingRight: 12,
  },
  balanceLabel: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
  balanceAmount: { fontSize: 16, fontWeight: "800" },

  divider: {
    width: 1,
    height: 30,
    marginRight: 12,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: "rgba(255, 59, 48, 0.1)", // 淡紅色背景
    borderRadius: 8,
  },

  // 空狀態
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    opacity: 0.8,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
  },

  // 新增按鈕
  addButton: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  addText: { fontSize: 15, fontWeight: "600" },
});
