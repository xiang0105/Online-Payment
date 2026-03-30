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
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const renderCategoryIcon = (
  iconName: string,
  iconType: string = "Ionicons",
  color: string = "#333",
  size: number = 20
) => {
  switch (iconType) {
    case "Feather": return <Feather name={iconName as any} size={size} color={color} />;
    case "FontAwesome5": return <FontAwesome5 name={iconName as any} size={size} color={color} />;
    case "MaterialIcons": return <MaterialIcons name={iconName as any} size={size} color={color} />;
    case "MaterialCommunityIcons": return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
    case "AntDesign": return <AntDesign name={iconName as any} size={size} color={color} />;
    case "Entypo": return <Entypo name={iconName as any} size={size} color={color} />;
    case "Ionicons": default: return <Ionicons name={iconName as any} size={size} color={color} />;
  }
};

export default function ConfirmPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userInfo, updateUser } = useUser();
  const { cards, addTransaction } = useCards();
  const { categories } = useCategory();

  const params = useLocalSearchParams();

  const getParam = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0];
    return param || "";
  };

  const initialAmountStr = getParam(params.amount);
  const receiver = getParam(params.receiver) || "麥當勞 - 台北車站店";
  const receiverPhone = getParam(params.receiverId);
  const cardId = getParam(params.cardId);
  const initialCategoryId = getParam(params.categoryId) || "2";

  const [amountInput, setAmountInput] = useState(initialAmountStr === "0" ? "" : initialAmountStr);
  const [pin, setPin] = useState("");
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>(cardId || "wallet");
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);

  const inputRef = useRef<TextInput>(null);
  const PIN_LENGTH = 6;

  const currentCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0] || { name: "一般", icon: "pricetag", color: "#333", type: "Ionicons" };

  const getPaymentMethodLabel = () => {
    if (selectedPayment === "wallet")
      return `錢包 ($${userInfo?.balance.toLocaleString()})`;

    const card = cards.find((c) => c.id === selectedPayment);
    if (card) {
      const lastFour = card.cardNumber.slice(-4);
      return `卡 **${lastFour} ($${card.availableBalance.toLocaleString()})`;
    }
    return "選擇付款方式";
  };

  const handlePinChange = (text: string) => {
    setPin(text);
  };

  const handleConfirm = async () => {
    if (pin.length !== PIN_LENGTH) {
     Alert.alert("提示", "請輸入 6 位數支付密碼", [
        {
          text: "確定",
          onPress: () => {
            setPin(""); // ★ 1. 清空 PIN 碼
          },
        },
      ]);
      return;
    }

    const numericAmount = Number(amountInput);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("提示", "請輸入有效的交易金額");

      return;
    }

    setIsSubmitting(true);

    try {
      const desc = `支付予 ${receiver}`;
      const txDate = new Date().toISOString();

      const transactionData = {
        user_id: userInfo?.id,
        description: desc,
        amount: numericAmount,
        date: txDate,
        card_id: selectedPayment === "wallet" ? null : selectedPayment,
        category_id: selectedCategoryId,
      };

      let realTransactionId = `TX-${Date.now()}`;

      if (selectedPayment === "wallet") {
        if (!userInfo || numericAmount > userInfo.balance) {
          throw new Error("餘額不足 (Insufficient Funds)");
        }
        await updateUser({ balance: userInfo.balance - numericAmount });
        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .insert(transactionData)
          .select()
          .single();

        if (txError) throw txError;
        if (txData) realTransactionId = txData.id;
      } else {
        const targetCard = cards.find((c) => c.id === selectedPayment);
        if (!targetCard || numericAmount > targetCard.availableBalance) {
          throw new Error("信用卡可用額度不足");
        }
        await addTransaction(targetCard.id, {
          date: txDate,
          description: desc,
          amount: numericAmount,
        });
        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .insert(transactionData)
          .select()
          .single();

        if (txError) throw txError;
        if (txData) realTransactionId = txData.id;
      }

      if (receiverPhone) {
        const { error: transferError } = await supabase.rpc(
          "increment_balance_by_phone",
          {
            target_phone: receiverPhone,
            amount: numericAmount,
          }
        );
        if (transferError) console.error("Transfer error:", transferError);
      }

      let paymentLabelClean = "EasySplit Wallet";
      if (selectedPayment !== "wallet") {
        const card = cards.find((c) => c.id === selectedPayment);
        paymentLabelClean = card
          ? `${card.type || "Card"} •••• ${card.cardNumber.slice(-4)}`
          : "Credit Card";
      }

      router.replace({
        pathname: "/payment-success" as any,
        params: {
          amount: numericAmount.toString(),
          receiver: receiver,
          paymentMethodLabel: paymentLabelClean,
          transactionId: realTransactionId,
          date: txDate,
          categoryId: selectedCategoryId,
        },
      });
    } catch (error: any) {
      console.log("Payment Confirmation Error:", error);
      let paymentLabelClean = "EasySplit Wallet";
      if (selectedPayment !== "wallet") {
        const card = cards.find((c) => c.id === selectedPayment);
        paymentLabelClean = card
          ? `${card.type || "Card"} •••• ${card.cardNumber.slice(-4)}`
          : "Credit Card";
      }

      router.replace({
        pathname: "/payment-error" as any,
        params: {
          amount: numericAmount.toString(),
          receiver: receiver,
          paymentMethodLabel: paymentLabelClean,
          date: new Date().toISOString(),
          reason: error.message || "連線逾時或未知錯誤",
        },
      });
      setPin("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: "#F2C94C" }}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* 1. 調整層級：KeyboardAvoidingView 在最外層，包住 ScrollView */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          {/* ScrollView 包含所有內容 (Header + Card) */}
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              // 3. 增加底部 Padding，防止內容被擋住
              { paddingBottom: insets.bottom + 10 }, 
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ backgroundColor: "#F9F9F9" }} // 背景色設在這裡
            bounces={false} // 防止下拉看到背景色不一致
          >
            {/* Header 移入 ScrollView */}
            <View style={styles.yellowHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text" size={45} color="#F2C94C" />
              </View>
            </View>

            <View style={styles.confirmCard}>
              <Text style={styles.headerTitle}>交易確認</Text>
              <Text style={styles.timestamp}>
                {new Date().toLocaleString()}
              </Text>

              <View style={styles.infoList}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>交易商家</Text>
                  <Text style={styles.valueBold} numberOfLines={1}>
                    {receiver}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.label}>交易金額</Text>
                  {initialAmountStr === "0" ? (
                    <TextInput
                      style={styles.amountInput}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={amountInput}
                      onChangeText={setAmountInput}
                      autoFocus
                    />
                  ) : (
                    <Text style={styles.amountValue}>
                      $ {Number(amountInput || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  )}
                </View>

                {/* 消費類型 */}
                {/* <TouchableOpacity
                  style={styles.selectorRow}
                  onPress={() => setShowCategoryPicker(true)}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  <View style={styles.selectorLabelRow}>
                    <Ionicons name="pricetag" size={20} color="#555" />
                    <Text style={styles.selectorLabelText}>消費類型</Text>
                  </View>

                  <View style={styles.selectorValueRow}>
                    <View style={styles.selectorValueContent}>
                      {renderCategoryIcon(currentCategory.icon, currentCategory.type, currentCategory.color || "#333", 16)}
                      <Text style={[styles.selectorValueText, { marginLeft: 6 }]} numberOfLines={1}>
                        {currentCategory.name}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down-circle" size={20} color="#CCC" />
                  </View>
                </TouchableOpacity> */}

                {/* 付款方式選擇器 */}
                <TouchableOpacity
                  style={styles.selectorRow}
                  onPress={() => setShowPaymentPicker(true)}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <View style={styles.selectorLabelRow}>
                    <Ionicons name="card" size={20} color="#555" />
                    <Text style={styles.selectorLabelText}>付款方式</Text>
                  </View>

                  <View style={styles.selectorValueRow}>
                    <View style={styles.selectorValueContent}>
                      <Text
                        style={[
                          styles.selectorValueText,
                          { color: selectedPayment === "wallet" ? "#F2C94C" : "#333" },
                        ]}
                        numberOfLines={1}
                      >
                        {getPaymentMethodLabel()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down-circle" size={20} color="#CCC" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* PIN 碼 */}
              <TouchableOpacity
                style={styles.pinWrapper}
                activeOpacity={1}
                onPress={() => !isSubmitting && inputRef.current?.focus()}
              >
                {Array(PIN_LENGTH).fill(0).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.pinBox,
                      pin.length === i && styles.pinBoxActive,
                      pin.length > i && styles.pinBoxFilled,
                    ]}
                  >
                    {pin.length > i && <View style={styles.pinDot} />}
                  </View>
                ))}
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={PIN_LENGTH}
                value={pin}
                onChangeText={handlePinChange}
                editable={!isSubmitting}
                caretHidden
              />

              {/* 確認按鈕 */}
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  pin.length === PIN_LENGTH && !isSubmitting
                    ? styles.btnYellow
                    : styles.btnDisabled,
                ]}
                onPress={handleConfirm}
                disabled={pin.length !== PIN_LENGTH || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>確認支付</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Modal: 付款方式 */}
        <Modal visible={showPaymentPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>選擇付款方式</Text>
                <TouchableOpacity onPress={() => setShowPaymentPicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.methodItem}
                onPress={() => {
                  setSelectedPayment("wallet");
                  setShowPaymentPicker(false);
                }}
              >
                <Ionicons name="wallet-outline" size={24} color="#F2C94C" />
                <View style={styles.methodTextGroup}>
                  <Text style={styles.methodText}>EasySplit Wallet</Text>
                  <Text style={styles.methodSubText}>
                    可用餘額: ${userInfo?.balance.toLocaleString()}
                  </Text>
                </View>
                {selectedPayment === "wallet" && (
                  <Ionicons name="checkmark-circle" size={20} color="#F2C94C" />
                )}
              </TouchableOpacity>
              <FlatList
                data={cards}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.methodItem}
                    onPress={() => {
                      setSelectedPayment(item.id);
                      setShowPaymentPicker(false);
                    }}
                  >
                    <Ionicons name="card-outline" size={24} color="#555" />
                    <View style={styles.methodTextGroup}>
                      <Text style={styles.methodText}>Card (**{item.cardNumber.slice(-4)})</Text>
                      <Text style={styles.methodSubText}>可用額度: ${item.availableBalance.toLocaleString()}</Text>
                    </View>
                    {selectedPayment === item.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#F2C94C" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Modal: 分類選擇 */}
        <Modal visible={showCategoryPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>選擇消費分類</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                numColumns={3}
                columnWrapperStyle={{ justifyContent: 'flex-start', gap: 10 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryGridItem,
                      selectedCategoryId === item.id && styles.categoryGridItemActive
                    ]}
                    onPress={() => {
                      setSelectedCategoryId(item.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <View style={[styles.categoryIconCircle, { backgroundColor: selectedCategoryId === item.id ? '#F2C94C' : '#F5F5F5' }]}>
                        {renderCategoryIcon(item.icon, item.type, selectedCategoryId === item.id ? '#FFF' : item.color, 24)}
                    </View>
                    <Text style={[styles.categoryGridText, selectedCategoryId === item.id && { color: '#F2C94C', fontWeight: 'bold' }]}>
                        {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  // 移除 container 的 flex: 1，因為現在 ScrollView 處理背景
  scrollContent: {
    flexGrow: 1, 
    // 不再需要 paddingTop，因為 Header 已經在 ScrollView 內
  },
  yellowHeader: {
    height: 220, // 增加高度，讓視覺延伸到頂部
    backgroundColor: "#F2C94C",
    borderBottomLeftRadius: 250,
    borderBottomRightRadius: 250,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ scaleX: 1.5 }],
    marginBottom: 0, // 讓 Card 往上蓋
    zIndex: 0,
  },
  iconCircle: {
    width: 90,
    height: 90,
    backgroundColor: "#FFF",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    // 移除 absolute positioning，改為 flex 佈局
    position: "absolute",
    marginBottom: 40, 
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    top: 160,
    transform: [{ scaleX: 0.67 }], // 抵銷父層的 scaleX
  },
  confirmCard: {
    paddingVertical: 30,
    paddingHorizontal: 24,
    // 確保 Card 內容在 ScrollView 內正確顯示
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 10,
    textAlign: "center",
  },
  timestamp: {
    fontSize: 13,
    color: "#AAA",
    marginTop: 6,
    marginBottom: 30,
    fontWeight: "500",
    textAlign: "center",
  },
  infoList: { width: "100%" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  label: { fontSize: 15, color: "#888", fontWeight: "600" },
  valueBold: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  amountValue: {
    fontSize: 26,
    fontWeight: "900",
    color: "#F2C94C",
  },
  amountInput: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F2C94C",
    textAlign: "right",
    flex: 1,
    padding: 0,
  },
  divider: { height: 1, backgroundColor: "#F0F0F0", width: "100%" },

  // Selector 樣式
  selectorRow: {
    marginTop: 15,
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 16,
  },
  selectorLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  selectorLabelText: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
    marginLeft: 6,
  },
  selectorValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // 新增：將內容包起來，確保 flex 正確運作
  selectorValueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // 佔滿剩餘空間
    marginRight: 10, // 與箭頭保持距離
  },
  selectorValueText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    flex: 1, // 讓文字可以縮放
  },

  pinWrapper: { flexDirection: "row", gap: 10, marginVertical: 30 },
  pinBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EAEAEA",
    backgroundColor: "#F9F9F9",
    justifyContent: "center",
    alignItems: "center",
  },
  pinBoxActive: { borderColor: "#F2C94C", backgroundColor: "#FFF" },
  pinBoxFilled: { borderColor: "#333", backgroundColor: "#FFF" },
  pinDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#333" },
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },

  confirmBtn: {
    width: "100%",
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#F2C94C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnYellow: { backgroundColor: "#F2C94C" },
  btnDisabled: { backgroundColor: "#E0E0E0", shadowOpacity: 0 },
  confirmBtnText: { color: "#FFF", fontSize: 18, fontWeight: "800" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  methodTextGroup: { flex: 1, marginLeft: 15 },
  methodText: { fontSize: 16, fontWeight: "700", color: "#333" },
  methodSubText: { fontSize: 13, color: "#999", marginTop: 4 },

  categoryGridItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryGridItemActive: {},
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryGridText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
});