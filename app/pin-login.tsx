import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { Stack, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function PinLoginScreen() {
  const router = useRouter();
  const { userInfo, logout, colors, isDark } = useUser();
  const [pin, setPin] = useState<string[]>([]);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [errorState, setErrorState] = useState(false); // 控制錯誤時的紅字/震動

  const PIN_LENGTH = 6;
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
    "bio",
    "0",
    "delete",
  ];

  // 1. 進來就檢查是否有生物辨識，有的話直接觸發
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricSupported(compatible && enrolled);

    if (compatible && enrolled) {
      handleBiometricAuth(); // 自動跳出指紋/FaceID
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "請驗證身分以登入",
        fallbackLabel: "使用 PIN 碼登入",
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.log("Biometric error:", error);
    }
  };

  // 2. 驗證 PIN 碼核心邏輯
  const verifyPin = async (enteredPin: string) => {
    try {
      // 從安全儲存區取出當初設定的 PIN
      const storedPin = await SecureStore.getItemAsync("userPin");

      if (storedPin === enteredPin) {
        // 密碼正確
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      } else {
        // 密碼錯誤
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setErrorState(true);
        setPin([]); // 清空輸入

        // 0.5秒後取消錯誤狀態 (紅字變回正常)
        setTimeout(() => setErrorState(false), 500);
      }
    } catch (e) {
      Alert.alert("錯誤", "驗證過程發生異常，請重新登入。");
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === "bio") {
      handleBiometricAuth();
      return;
    }

    if (key === "delete") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin((prev) => prev.slice(0, -1));
      return;
    }

    if (pin.length < PIN_LENGTH) {
      Haptics.selectionAsync();
      const newPin = [...pin, key];
      setPin(newPin);

      // ★★★ 輸入滿 6 碼，自動驗證 (無需按鈕) ★★★
      if (newPin.length === PIN_LENGTH) {
        // 給一點點延遲，讓 UI 畫出最後一個黑點，體驗比較好
        setTimeout(() => {
          verifyPin(newPin.join(""));
        }, 100);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert("忘記密碼？", "為了安全，若忘記 PIN 碼需重新登入並重設。", [
      { text: "取消", style: "cancel" },
      {
        text: "登出重設",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.content}>
        {/* 頭像與歡迎詞 */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {userInfo?.avatar_url ? (
              <Image
                source={{ uri: userInfo.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Ionicons name="person" size={32} color="#FFF" />
              </View>
            )}
          </View>
          <Text style={[styles.welcomeText, { color: colors.text }]}>
            歡迎回來，{userInfo?.name || "User"}
          </Text>
          <Text
            style={[
              styles.subText,
              { color: errorState ? "#FF3B30" : colors.subText },
            ]}
          >
            {errorState ? "密碼錯誤，請重新輸入" : "請輸入交易密碼以解鎖"}
          </Text>
        </View>

        {/* 6個黑點顯示 */}
        <View style={styles.pinContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    borderColor: errorState ? "#FF3B30" : colors.primary,
                    backgroundColor: isFilled
                      ? errorState
                        ? "#FF3B30"
                        : colors.text // 填滿時的顏色
                      : "transparent",
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: colors.primary }]}>
            忘記 PIN 碼 / 登出
          </Text>
        </TouchableOpacity>
      </View>

      {/* 數字鍵盤 */}
      <View style={styles.keypad}>
        {keys.map((key) => (
          <TouchableOpacity
            key={key}
            style={styles.key}
            onPress={() => handleKeyPress(key)}
            activeOpacity={0.7}
          >
            {key === "delete" ? (
              <Ionicons
                name="backspace-outline"
                size={28}
                color={colors.text}
              />
            ) : key === "bio" ? (
              isBiometricSupported ? (
                <Ionicons
                  name="finger-print"
                  size={36}
                  color={colors.primary}
                />
              ) : (
                <View />
              )
            ) : (
              <Text style={[styles.keyText, { color: colors.text }]}>
                {key}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    marginTop: -40,
  },
  header: { alignItems: "center", marginBottom: 40 },
  avatarContainer: {
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  defaultAvatar: {
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeText: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subText: { fontSize: 15 },
  pinContainer: { flexDirection: "row", gap: 16, marginBottom: 30 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  forgotBtn: { padding: 10 },
  forgotText: { fontSize: 14, fontWeight: "600" },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingBottom: 50,
  },
  key: {
    width: width / 3 - 20,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 40,
  },
  keyText: { fontSize: 28, fontWeight: "500" },
});
