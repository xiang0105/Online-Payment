import { useCards } from "@/context/CardContext";
import { useCategory } from "@/context/CategoryContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// 輔助函式：渲染分類圖示
const renderCategoryIcon = (
  iconName: string,
  iconType: string,
  color: string,
  size: number = 24
) => {
  switch (iconType) {
    case "Feather":
      return <Feather name={iconName as any} size={size} color={color} />;
    case "FontAwesome5":
      return <FontAwesome5 name={iconName as any} size={size} color={color} />;
    case "MaterialIcons":
      return <MaterialIcons name={iconName as any} size={size} color={color} />;
    case "MaterialCommunityIcons":
      return (
        <MaterialCommunityIcons
          name={iconName as any}
          size={size}
          color={color}
        />
      );
    case "AntDesign":
      return <AntDesign name={iconName as any} size={size} color={color} />;
    case "Entypo":
      return <Entypo name={iconName as any} size={size} color={color} />;
    case "Ionicons":
    default:
      return <Ionicons name={iconName as any} size={size} color={color} />;
  }
};

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { categories } = useCategory();
  const { cards } = useCards();
  const { colors, isDark } = useUser();

  const amount = Number(params.amount || 0);
  const description =
    (params.receiver as string) || (params.description as string) || "未知交易";
  const dateStr = (params.date as string) || new Date().toISOString();
  const transactionId =
    (params.transactionId as string) || (params.id as string) || "";
  const initialCategoryId =
    (params.categoryId as string) || (params.category_id as string) || "2";
  const cardId = (params.cardId as string) || (params.card_id as string);
  const note = (params.note as string) || "";

  // --- 狀態管理 ---
  const [currentCategoryId, setCurrentCategoryId] = useState(initialCategoryId);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ★ 新增：暫存選擇的分類 ID (在 Modal 內使用)
  const [tempCategoryId, setTempCategoryId] = useState(initialCategoryId);

  const category = categories.find((c) => c.id === currentCategoryId) || {
    name: "一般",
    icon: "pricetag",
    color: isDark ? "#CCC" : "#333",
    type: "Ionicons",
  };

  const cardInfo = useMemo(() => {
    if (!cardId || cardId === "wallet" || cardId === "null") {
      return { name: "Grepay Wallet", last4: "4288" };
    }
    const foundCard = cards.find((c) => c.id === cardId);
    return foundCard
      ? { name: foundCard.name, last4: foundCard.cardNumber.slice(-4) }
      : { name: "Credit Card", last4: "----" };
  }, [cardId, cards]);

  const formattedDate = new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const merchantName = description.split("-")[0].trim();

  // ★ 1. 開啟 Modal 時，初始化暫存狀態
  const openCategoryPicker = () => {
    setTempCategoryId(currentCategoryId); // 將暫存值重置為當前值
    setShowCategoryPicker(true);
  };

  // ★ 2. 按下「確認修改」後，才真正更新資料庫與 UI
  const handleConfirmUpdate = async () => {
    // 先更新 UI
    setCurrentCategoryId(tempCategoryId);
    setShowCategoryPicker(false);

    if (!transactionId || transactionId.startsWith("TX-")) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .update({ category_id: tempCategoryId }) // 使用選定的暫存值更新
        .eq("id", transactionId);
      if (error) console.error("Update failed:", error);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          交易詳情
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={[styles.merchantName, { color: colors.text }]}>
            {merchantName}
          </Text>
          <Text style={[styles.amountText, { color: colors.text }]}>
            -${amount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.dashedLineContainer}>
          <View style={[styles.dashedLine, { borderColor: colors.border }]} />
        </View>

        <View style={styles.detailsList}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subText }]}>
              信用/錢包卡號
            </Text>
            <Text style={[styles.valueBold, { color: colors.text }]}>
              •••• {cardInfo.last4}
            </Text>
          </View>

          {/* 類別選擇按鈕 */}
          <TouchableOpacity
            style={styles.row}
            onPress={openCategoryPicker} // ★ 改用新的開啟函式
            activeOpacity={0.6}
          >
            <Text style={[styles.label, { color: colors.subText }]}>類別</Text>
            <View style={styles.categoryIconWrapper}>
              <Text style={{ color: colors.text, marginRight: 8 }}>
                {category.name}
              </Text>
              {renderCategoryIcon(
                category.icon,
                category.type,
                isDark ? "#fff" : "#333",
                24
              )}
              <Ionicons
                name="chevron-down"
                size={16}
                color={colors.subText}
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subText }]}>時間</Text>
            <Text style={[styles.valueBoldItalic, { color: colors.text }]}>
              {formattedDate}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subText }]}>
              交易ID
            </Text>
            <Text style={[styles.valueSmall, { color: colors.subText }]}>
              {transactionId}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subText }]}>備註</Text>
            {note ? (
              <Text style={[styles.value, { color: colors.text }]}>{note}</Text>
            ) : (
              <TouchableOpacity>
                <Text style={styles.addNoteText}>新增備註</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ★ 分類選擇 Modal (含確認按鈕) */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1C1C1E" : "#FFF" },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDark ? "#FFF" : "#333" }]}
            >
              修改消費類型
            </Text>

            <ScrollView
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    { borderBottomColor: colors.border },
                  ]}
                  // ★ 點擊時只更新暫存狀態，不關閉視窗
                  onPress={() => setTempCategoryId(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryItemIcon,
                      { backgroundColor: isDark ? "#333" : "#F5F7FA" },
                    ]}
                  >
                    {renderCategoryIcon(cat.icon, cat.type, isDark ? "fff" : "#333", 20)}
                  </View>
                  <Text
                    style={[styles.categoryItemName, { color: colors.text }]}
                  >
                    {cat.name}
                  </Text>

                  {/* ★ 根據暫存狀態顯示打勾 */}
                  {tempCategoryId === cat.id && (
                    <Ionicons name="checkmark" size={20} color="#2962FF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ★ 新增：確認修改按鈕 */}
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={handleConfirmUpdate}
            >
              <Text style={styles.modalConfirmBtnText}>確認修改</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  placeholder: {
    width: 38,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 50,
  },
  mainInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  amountText: {
    fontSize: 42,
    fontWeight: "800",
  },
  dashedLineContainer: {
    height: 1,
    overflow: "hidden",
    marginBottom: 30,
  },
  dashedLine: {
    height: 2,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 1,
  },
  detailsList: {
    gap: 25,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  valueBold: {
    fontSize: 16,
    fontWeight: "800",
    fontStyle: "italic",
  },
  valueBoldItalic: {
    fontSize: 16,
    fontWeight: "800",
    fontStyle: "italic",
  },
  valueSmall: {
    fontSize: 13,
    textTransform: "uppercase",
  },
  categoryIconWrapper: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addNoteText: {
    fontSize: 15,
    color: "#6B7280",
    textDecorationLine: "underline",
  },
  // Modal 樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 20,
    padding: 20,
    maxHeight: "70%", // 稍微加高一點以容納按鈕
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 15,
    textAlign: "center",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  categoryItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  // ★ Modal 確認按鈕樣式
  modalConfirmBtn: {
    backgroundColor: "#2962FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  modalConfirmBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
