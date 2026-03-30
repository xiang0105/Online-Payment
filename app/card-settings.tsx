import { useCards } from "@/context/CardContext";
import { useUser } from "@/context/UserContext";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback, // ★ 1. 引入
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_HEIGHT = 220;

const formatCardNumber = (num: string) => {
  if (!num) return "•••• 0000";
  const cleanNum = num.replace(/\s/g, "");
  return `•••• •••• •••• ${cleanNum.slice(-4)}`;
};

export default function CardSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { cards, deleteCard, updateCard } = useCards();
  const { colors, isDark } = useUser();

  const card = cards.find((c) => c.id === id);

  const [isEnabled, setIsEnabled] = useState(true);
  const [isLimitAlertEnabled, setIsLimitAlertEnabled] = useState(false);
  const [isNfcEnabled, setIsNfcEnabled] = useState(true);
  const [carrierCode, setCarrierCode] = useState("");
  const [cardName, setCardName] = useState("");

  // ★ 關鍵：確保從 card prop 載入資料
  useEffect(() => {
    if (card) {
      setIsEnabled(card.isEnabled ?? true);
      setIsLimitAlertEnabled(card.isLimitAlertEnabled ?? false);
      setIsNfcEnabled(card.isNfcEnabled ?? true);
      // 載具代碼如果已經有 "/" 開頭，就直接顯示，否則補上
      setCarrierCode(card.carrier || "");
      setCardName(card.name || "");
    }
  }, [card]); // 這裡會監聽 card 變化，所以 Context 更新後這裡也會更新

  const saveTextFields = useCallback(async () => {
    if (card) {
      await updateCard(card.id, {
        carrier: carrierCode,
        name: cardName,
      });
    }
  }, [card, carrierCode, cardName, updateCard]);

  const handleDelete = () => {
    Alert.alert("刪除卡片", "確定要移除這張卡片嗎？此動作無法復原。", [
      { text: "取消", style: "cancel" },
      {
        text: "確認刪除",
        style: "destructive",
        onPress: async () => {
          if (card) {
            router.back();
            setTimeout(() => deleteCard(card.id), 100);
          }
        },
      },
    ]);
  };

  if (!card)
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.text }}>找不到卡片資訊</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 10 }}>返回</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    // ★ 2. 點擊背景收鍵盤
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              backgroundColor: colors.background,
            },
          ]}
        >
          <Stack.Screen options={{ headerShown: false }} />

          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.cardBackground,
                borderBottomColor: colors.border,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              卡片設定
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 卡片預覽 */}
            <View
              style={[
                styles.activeCard,
                { backgroundColor: card.backgroundColor || "#1A1A1A" },
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardBrand}>EasySplit.</Text>
                <MaterialCommunityIcons
                  name="contactless-payment"
                  size={28}
                  color="rgba(255,255,255,0.6)"
                />
              </View>
              <View>
                <View style={styles.chip} />
                <Text
                  style={styles.activeCardNumber}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCardNumber(card.cardNumber)}
                </Text>
              </View>
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardHolderLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardHolderValue}>
                    {cardName || "USER NAME"}
                  </Text>
                </View>
                <FontAwesome5
                  name={
                    card.type === "MASTERCARD" ? "cc-mastercard" : "cc-visa"
                  }
                  size={32}
                  color="#fff"
                />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.subText }]}>
              安全 & 偏好
            </Text>

            <SettingRow
              label="啟用卡片"
              value={isEnabled}
              colors={colors}
              onValueChange={(val: boolean) => {
                setIsEnabled(val);
                updateCard(card.id, { isEnabled: val });
              }}
            />

            <SettingRow
              label="預算超額提示"
              subLabel="(超過限額 80% 時通知)"
              value={isLimitAlertEnabled}
              colors={colors}
              onValueChange={(val: boolean) => {
                setIsLimitAlertEnabled(val);
                updateCard(card.id, { isLimitAlertEnabled: val });
              }}
            />

            <SettingRow
              label="NFC 感應支付"
              value={isNfcEnabled}
              colors={colors}
              onValueChange={(val: boolean) => {
                setIsNfcEnabled(val);
                updateCard(card.id, { isNfcEnabled: val });
              }}
            />

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                發票載具設定
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={carrierCode}
                onChangeText={setCarrierCode}
                onEndEditing={saveTextFields}
                placeholder="/AB1234 (選填)"
                placeholderTextColor={colors.subText}
                autoCapitalize="characters"
                returnKeyType="done"
                // ★ iOS 防干擾設定
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                selectionColor={colors.primary}
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                編輯卡片名稱
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                value={cardName}
                onChangeText={setCardName}
                onEndEditing={saveTextFields}
                placeholder="例如：生活開銷卡"
                placeholderTextColor={colors.subText}
                returnKeyType="done"
                // ★ iOS 防干擾設定
                textContentType="none"
                autoComplete="off"
                autoCorrect={false}
                selectionColor={colors.primary}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: isDark ? "#3D1A1A" : "#FFE5E5" },
              ]}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>刪除卡片</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const SettingRow = ({ label, subLabel, value, onValueChange, colors }: any) => (
  <View
    style={[
      styles.row,
      {
        backgroundColor: colors.cardBackground,
        borderBottomColor: colors.border,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
    ]}
  >
    <View style={{ flex: 1 }}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {subLabel && (
        <Text style={[styles.subLabel, { color: colors.subText }]}>
          {subLabel}
        </Text>
      )}
    </View>
    <Switch
      trackColor={{ false: "#E9E9EA", true: "#34C759" }}
      thumbColor={"#fff"}
      ios_backgroundColor="#E9E9EA"
      onValueChange={onValueChange}
      value={value}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  backButton: { padding: 5 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  activeCard: {
    height: CARD_HEIGHT,
    width: "100%",
    borderRadius: 20,
    padding: 24,
    justifyContent: "space-between",
    marginVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBrand: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  chip: {
    width: 40,
    height: 30,
    backgroundColor: "#FFD700",
    borderRadius: 4,
    opacity: 0.9,
    marginBottom: 10,
  },
  activeCardNumber: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 2,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardHolderLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardHolderValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 15,
    marginTop: 10,  
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  label: { fontSize: 16, fontWeight: "500" },
  subLabel: { fontSize: 12, marginTop: 2 },
  inputSection: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  deleteButton: {
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  deleteButtonText: { color: "#FF3B30", fontSize: 16, fontWeight: "700" },
});
