import { useCategory } from "@/context/CategoryContext";
import { supabase } from "@/lib/supabase"; // 確保引入 Supabase
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
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// 1. 輔助函式：動態渲染圖示
const renderCategoryIcon = (
  iconName: string,
  iconType: string = "Ionicons",
  color: string = "#333",
  size: number = 20
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
        <MaterialCommunityIcons name={iconName as any} size={size} color={color} />
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

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { categories } = useCategory();

  // --- 解析參數 ---
  const amount = params.amount as string;
  const receiver = (params.receiver as string) || "未知商家";
  // ★★★ 關鍵：確保這裡拿到的是真實的 UUID，而不是空字串或 TX-...
  const transactionId = (params.transactionId as string) || "";
  const date = (params.date as string) || new Date().toISOString();
  const paymentMethodLabel = (params.paymentMethodLabel as string) || "錢包";
  const initialCategoryId = (params.categoryId as string) || "2";

  // --- 狀態管理 ---
  const [currentCategoryId, setCurrentCategoryId] = useState(initialCategoryId);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // 根據 currentCategoryId 查找完整的分類物件
  const category = categories.find((c) => c.id === currentCategoryId) || {
    name: "一般消費",
    icon: "pricetag",
    color: "#333",
    type: "Ionicons",
  };

  const formattedDate = new Date(date).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // ★★★ 核心邏輯：更新分類 ★★★
  // ... 在 handleCategoryChange 裡面
  const handleCategoryChange = async (newCategoryId: string) => {
    // 1. 檢查是否為虛擬 ID
    if (!transactionId || transactionId.startsWith("TX-")) {
      console.log("無法更新", "這是舊的或模擬交易 (ID 為 TX- 開頭)，無法同步到資料庫。請試著新增一筆新交易。");
      // 雖然不能存檔，但我們還是更新 UI 讓你看起來有變
      setCurrentCategoryId(newCategoryId); 
      setShowCategoryPicker(false);
      return;
    }

    // 2. 嘗試更新資料庫
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ category_id: newCategoryId })
        .eq("id", transactionId);

      if (error) {
        console.log("更新失敗", "資料庫拒絕存取，請檢查 RLS Policy 的 UPDATE 權限。\n錯誤訊息: " + error.message);
      } else {
        console.log("成功", "分類已更新！");
        setCurrentCategoryId(newCategoryId);
        setShowCategoryPicker(false);
      }
    } catch (err: any) {
      console.log("錯誤", err.message);
    }
  };

  const handleDone = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: "#F9F9F9" }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* 藍色背景區 */}
      <View style={styles.blueHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={45} color="#2D62D6" />
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 80,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.headerTitle}>交易成功</Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>

            <View style={{ width: "100%" }}>
              {/* 交易商家 */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>交易商家</Text>
                <Text style={styles.valueBold} numberOfLines={1}>
                  {receiver}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* 交易金額 */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>交易金額</Text>
                <Text style={styles.amountValue}>
                  $ {Number(amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* ★ 消費類型 (點擊開啟選單) */}
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.6}
              >
                <Text style={styles.label}>消費類型</Text>

                {/* 右側顯示區塊：加上箭頭與底色，暗示可點擊 */}
                <View style={styles.categorySelector}>
                  {renderCategoryIcon(
                    category.icon,
                    category.type,
                    category.color || "#333",
                    18
                  )}

                  <Text
                    style={[
                      styles.categoryText,
                      { color: "#333", marginLeft: 6 },
                    ]}
                  >
                    {category.name}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#999"
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* 付款方式 */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>付款方式</Text>
                <Text style={styles.valueBold} numberOfLines={1}>
                  {paymentMethodLabel}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* 交易編號 */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>交易編號</Text>
                <Text
                  style={styles.valueSmall}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {transactionId}
                </Text>
              </View>
            </View>

            {/* 完成按鈕 */}
            <TouchableOpacity style={styles.primaryBtn} onPress={handleDone}>
              <Text style={styles.primaryBtnText}>完成</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* ★ 分類選擇 Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>修改消費類型</Text>
            <ScrollView
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryItem}
                  // ★ 點擊項目時觸發更新
                  onPress={() => handleCategoryChange(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryItemIcon,
                      { backgroundColor: "#F5F7FA" },
                    ]}
                  >
                    {renderCategoryIcon(cat.icon, cat.type, "#333", 20)}
                  </View>
                  <Text style={styles.categoryItemName}>{cat.name}</Text>
                  {currentCategoryId === cat.id && (
                    <Ionicons name="checkmark" size={20} color="#2D62D6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  blueHeader: {
    height: 180,
    backgroundColor: "#2D62D6",
    borderBottomLeftRadius: 250,
    borderBottomRightRadius: 250,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 20,
    transform: [{ scaleX: 1.5 }],
    marginBottom: -60,
    zIndex: 0,
  },
  iconCircle: {
    width: 90,
    height: 90,
    backgroundColor: "#FFF",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    transform: [{ scaleX: 0.67 }],
    position: "absolute",
    bottom: -40,
  },
  card: {
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 20,
  },
  timestamp: {
    fontSize: 13,
    color: "#AAA",
    marginTop: 6,
    marginBottom: 30,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  label: {
    fontSize: 15,
    color: "#888",
    fontWeight: "600",
  },
  valueBold: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#2D62D6",
  },
  valueSmall: {
    fontSize: 13,
    color: "#999",
    maxWidth: 180,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    width: "100%",
  },
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBtn: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    backgroundColor: "#2D62D6",
    shadowColor: "#2D62D6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "60%",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
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
    color: "#333",
    fontWeight: "600",
  },
});