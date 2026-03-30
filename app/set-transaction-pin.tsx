import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function SetTransactionPinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, userInfo, updateUser } = useUser();

  // ★ 新增狀態：記錄目前是「設定」還是「確認」階段
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [firstPin, setFirstPin] = useState(""); // 暫存第一次輸入的密碼

  const [pin, setPin] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const pinLength = 6;

  const keys = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "#",
    "0",
    "delete",
  ];

  // 處理最終完成邏輯 (寫入資料庫)
  const handleFinalSubmit = useCallback(
    async (finalPin: string) => {
      if (!userInfo?.id) return;
      setIsLoading(true);

      // ★★★ 關鍵修改：務必儲存實際的 PIN 碼字串 ★★★
      await SecureStore.setItemAsync("hasSetupPin", "true");
      await SecureStore.setItemAsync("userPin", finalPin); // 存入 PIN 碼，讓 pin-login 可以讀取

      try {
        // 1. 更新 Supabase
        const { error } = await supabase
          .from("profiles")
          .update({ has_setup_pin: true })
          .eq("id", userInfo.id);

        if (error) throw error;

        // 3. 更新 Context
        await updateUser({ balance: userInfo.balance });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Alert.alert("設定成功", "交易密碼已啟用，現在您可以開始使用。", [
        //   {
        //     text: "確定",
        //     onPress: () => router.replace("/(tabs)"),
        //   },
        router.replace("/(tabs)");
      } catch (error: any) {
        console.error("儲存交易碼失敗", error.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("錯誤", "設定失敗，請稍後再試。");
        // 失敗時重置所有狀態
        setPin([]);
        setStep("create");
        setFirstPin("");
      } finally {
        setIsLoading(false);
      }
    },
    [router, userInfo, updateUser]
  );

  // 監聽輸入長度
  useEffect(() => {
    if (pin.length === pinLength) {
      const enteredPin = pin.join("");

      if (step === "create") {
        // ★ 第一次輸入完成：暫存並進入確認階段
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setFirstPin(enteredPin);
        setPin([]); // 清空輸入框
        setStep("confirm");
        // 給一點延遲讓使用者感受到切換
      } else {
        // ★ 第二次輸入完成：進行比對
        if (enteredPin === firstPin) {
          handleFinalSubmit(enteredPin);
        } else {
          // 密碼不一致
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("錯誤", "兩次輸入的密碼不一致，請重新設定。", [
            {
              text: "重試",
              onPress: () => {
                setPin([]);
                setStep("create"); // 回到第一步
                setFirstPin("");
              },
            },
          ]);
        }
      }
    }
  }, [pin, step, firstPin, handleFinalSubmit]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (isLoading) return;
      if (key === "delete") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPin((prev) => prev.slice(0, -1));
      } else if (pin.length < pinLength && key !== "#") {
        Haptics.selectionAsync();
        setPin((prev) => [...prev, key]);
      }
    },
    [pin.length, isLoading]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerContent}>
        <Text style={[styles.title, { color: colors.text }]}>
          {step === "create" ? "設定交易密碼" : "確認交易密碼"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>
          {step === "create"
            ? "請設定您的 6 位支付密碼。"
            : "請再次輸入以確認密碼。"}
        </Text>

        {/* 進度提示文字 */}
        <View style={styles.subLabelContainer}>
          <Text style={[styles.subLabel, { color: colors.primary }]}>
            {step === "create" ? "步驟 1 / 2" : "步驟 2 / 2"}
          </Text>
          <Text style={[styles.subHint, { color: colors.subText }]}>
            {step === "create" ? "用於付款驗證" : "請確保與第一次輸入相同"}
          </Text>
        </View>
      </View>

      <View style={styles.pinContainer}>
        {Array.from({ length: pinLength }).map((_, index) => {
          const isActive = pin.length === index;
          const isFilled = pin.length > index;
          return (
            <View
              key={index}
              style={[
                styles.pinSlot,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
                isActive && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              {isFilled ? (
                <View style={[styles.dot, { backgroundColor: colors.text }]} />
              ) : null}
            </View>
          );
        })}
      </View>

      {isLoading && (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.subText, marginTop: 10 }}>
            處理中...
          </Text>
        </View>
      )}

      <View
        style={[
          styles.keyboardContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.keyboardRow}>
          {keys.map((key) => (
            <TouchableOpacity
              key={key}
              style={styles.key}
              onPress={() => handleKeyPress(key)}
              disabled={isLoading}
              activeOpacity={0.4}
            >
              {key === "delete" ? (
                <Ionicons
                  name="backspace-outline"
                  size={28}
                  color={colors.text}
                />
              ) : key === "#" ? (
                <Text
                  style={[
                    styles.keyText,
                    { color: colors.subText, opacity: 0.3 },
                  ]}
                >
                  #
                </Text>
              ) : (
                <Text style={[styles.keyText, { color: colors.text }]}>
                  {key}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContent: { paddingHorizontal: 40, marginTop: 40 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 40 },
  subLabelContainer: { marginBottom: 20 },
  subLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  subHint: { fontSize: 14 },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    marginTop: 10,
  },
  pinSlot: {
    width: (width - 110) / 6,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  loadingWrapper: { alignItems: "center", marginTop: 40 },
  keyboardContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 20,
  },
  keyboardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  key: {
    width: "33.33%",
    height: 75,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: { fontSize: 28, fontWeight: "500" },
});
