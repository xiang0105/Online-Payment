import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BiometricAuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // 進來頁面後稍微延遲一下再啟動生物辨識，體驗較好
    const timer = setTimeout(() => {
      handleBiometricAuth();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleBiometricAuth = async () => {
    setIsProcessing(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // 如果沒硬體或沒設定指紋，直接去 PIN 碼登入
        router.replace("/pin-login");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "請驗證身分以登入 EasySplit",
        // ★★★ 關鍵修改 1：設定 cancelLabel 為「使用交易密碼」 ★★★
        // 注意：iOS 不允許自訂 fallbackLabel 的行為導向 App 內，
        // 所以策略是：讓使用者點「取消」或「使用密碼」都視為失敗，然後我們手動導航。
        cancelLabel: "使用交易密碼",

        // ★★★ 關鍵修改 2：禁用系統原生的備援密碼 (手機解鎖密碼) ★★★
        disableDeviceFallback: true,
      });

      if (result.success) {
        // 驗證成功 -> 進首頁
        router.replace("/(tabs)");
      } else {
        // ★★★ 關鍵修改 3：捕捉所有失敗/取消的情況，導向自訂 PIN 頁面 ★★★
        // 當 disableDeviceFallback: true 時，點擊提示框的按鈕會導致 result.success = false
        // 我們就利用這一點來跳轉
        router.replace("/pin-login");
      }
    } catch (error) {
      console.log("Biometric Auth Error:", error);
      // 出錯也導向 PIN 碼頁作為備案
      router.replace("/pin-login");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUsePin = () => {
    // ★★★ 關鍵：點擊按鈕時，導向您製作的 PIN 碼驗證頁 ★★★
    router.replace("/pin-login");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="finger-print" size={60} color={colors.primary} />
        </View>

        <Text style={styles.title}>EasySplit</Text>
        <Text style={styles.subtitle}>請驗證身分以繼續</Text>

        {/* 手動觸發生物辨識 */}
        <TouchableOpacity
          style={styles.bioButton}
          onPress={handleBiometricAuth}
          disabled={isProcessing}
        >
          <Text style={[styles.bioButtonText, { color: colors.primary }]}>
            {isProcessing ? "驗證中..." : "再次嘗試 Face ID / 指紋"}
          </Text>
        </TouchableOpacity>

        {/* ★ 使用密碼登入按鈕 */}
        <TouchableOpacity style={styles.pinLink} onPress={handleUsePin}>
          <Text style={styles.pinLinkText}>使用交易密碼登入</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>Protected by EasySplit Security</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 50,
  },
  bioButton: {
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  bioButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  pinLink: {
    padding: 15,
  },
  pinLinkText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  footer: {
    position: "absolute",
    bottom: 0,
  },
  footerText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
});
