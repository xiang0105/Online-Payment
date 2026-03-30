import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback, // ★ 1. 引入
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCards } from "../context/CardContext";
import { useUser } from "../context/UserContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 50;
const CARD_HEIGHT = CARD_WIDTH / 1.586;

export default function AddCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addCard } = useCards();
  const { colors, isDark } = useUser();
  const params = useLocalSearchParams();

  const cardColor = (params.backgroundColor as string) || colors.primary;
  const cardType = (params.type as string) || "VISA";

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [limit, setLimit] = useState("");
  const [carrier, setCarrier] = useState("");
  const [cardName, setCardName] = useState("");

  const getPreviewCardNumber = useCallback(() => {
    if (!cardNumber) return "•••• •••• •••• ••••";
    return cardNumber.padEnd(19, "•");
  }, [cardNumber]);

  const handleCardNumberChange = (text: string) => {
    let clean = text.replace(/[^0-9]/g, "").slice(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    let clean = text.replace(/[^0-9]/g, "").slice(0, 4);
    if (clean.length >= 3) {
      setExpiry(clean.substring(0, 2) + "/" + clean.substring(2));
    } else {
      setExpiry(clean);
    }
  };

  const handleConfirm = async () => {
    const cleanNum = cardNumber.replace(/\s/g, "");

    if (cleanNum.length < 16 || !expiry || !cvv || !limit || !cardName) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("資料不完整", "請確認填寫所有欄位並輸入正確的 16 碼卡號。");
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await addCard({
        cardNumber: cleanNum,
        expiry,
        cvv,
        totalLimit: parseFloat(limit),
        // ★ 這裡邏輯沒問題，如果輸入 "AB123"，會存成 "/AB123"
        carrier: carrier ? `/${carrier.replace(/^\//, "").toUpperCase()}` : "",
        name: cardName,
        backgroundColor: cardColor,
        type: cardType,
      });

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);
    } catch (error) {
      console.error("新增卡片失敗", error);
      Alert.alert("系統錯誤", "無法儲存卡片資料，請稍後再試。");
    }
  };

  return (
    // ★ 2. 點擊背景收鍵盤
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            新增卡片
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* ★ 3. KeyboardAvoidingView 包覆 */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 卡片預覽 */}
            <View style={[styles.cardPreview, { backgroundColor: cardColor }]}>
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
              <Text style={styles.previewCardNumber}>
                {getPreviewCardNumber()}
              </Text>
              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.cardHolder}>NEW MEMBER</Text>
                </View>
                <FontAwesome5
                  name={cardType === "MASTERCARD" ? "cc-mastercard" : "cc-visa"}
                  size={32}
                  color="#fff"
                />
              </View>
            </View>

            {/* 表單填寫區 */}
            <View style={styles.formContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                卡片號碼
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor={colors.subText}
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={handleCardNumberChange}
                maxLength={19}
                // ★ iOS 防干擾
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                selectionColor={colors.primary}
              />

              <View style={styles.row}>
                <View style={styles.halfInputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    到期日
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.subText}
                    keyboardType="numeric"
                    value={expiry}
                    onChangeText={handleExpiryChange}
                    textContentType="none"
                    autoComplete="off"
                    selectionColor={colors.primary}
                  />
                </View>
                <View style={[styles.halfInputContainer, { marginLeft: 15 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    CVV
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="123"
                    placeholderTextColor={colors.subText}
                    keyboardType="numeric"
                    secureTextEntry
                    value={cvv}
                    onChangeText={(text) =>
                      setCvv(text.replace(/[^0-9]/g, "").slice(0, 3))
                    }
                    textContentType="none"
                    autoComplete="off"
                    selectionColor={colors.primary}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInputContainer}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    限制金額
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="例: 50000"
                    placeholderTextColor={colors.subText}
                    keyboardType="numeric"
                    value={limit}
                    onChangeText={setLimit}
                    textContentType="none"
                    autoComplete="off"
                    selectionColor={colors.primary}
                  />
                </View>
                <View style={[styles.halfInputContainer, { marginLeft: 15 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    手機載具
                  </Text>
                  <View
                    style={[
                      styles.carrierWrapper,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.prefix, { color: colors.text }]}>
                      /
                    </Text>
                    <TextInput
                      style={[styles.carrierInput, { color: colors.text }]}
                      placeholder="載具編碼"
                      placeholderTextColor={colors.subText}
                      value={carrier}
                      onChangeText={setCarrier}
                      autoCapitalize="characters"
                      textContentType="none"
                      autoComplete="off"
                      autoCorrect={false}
                      selectionColor={colors.primary}
                    />
                  </View>
                </View>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>
                自定義卡片名稱
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="例: 生活開銷卡"
                placeholderTextColor={colors.subText}
                value={cardName}
                onChangeText={setCardName}
                textContentType="none"
                autoComplete="off"
                selectionColor={colors.primary}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + 20,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: cardColor }]}
              onPress={handleConfirm}
            >
              <Text style={styles.submitBtnText}>確認新增卡片</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingTop: 10, paddingBottom: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  cardPreview: {
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 24,
    justifyContent: "space-between",
    marginBottom: 30,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  previewCardNumber: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
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
  previewLimit: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontStyle: "italic",
  },
  formContainer: { marginTop: 10 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8, marginLeft: 4 },
  input: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    marginBottom: 18,
  },
  row: { flexDirection: "row" },
  halfInputContainer: { flex: 1 },
  carrierWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 18,
  },
  prefix: { fontSize: 18, fontWeight: "bold", marginRight: 5 },
  carrierInput: { flex: 1, fontSize: 16 },
  footer: { paddingHorizontal: 25, paddingTop: 20, borderTopWidth: 1 },
  submitBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
