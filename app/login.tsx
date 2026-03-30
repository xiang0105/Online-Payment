import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // 1. 簡單驗證：只檢查 Email 和密碼
    if (!email.trim() || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("提示", "請輸入電子郵件和密碼");
      return;
    }

    setIsLoading(true);

    try {
      // 2. 使用 Supabase 進行登入
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // 登入成功後，Router Guard 會自動處理轉導 (去 PIN 碼或首頁)
    } catch (error: any) {
      console.error("登入失敗:", error.message);
      Alert.alert("登入失敗", "帳號或密碼錯誤，請再試一次。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: colors.background }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <Text style={[styles.title, { color: colors.text }]}>歡迎回來</Text>
            <Text style={[styles.subtitle, { color: colors.subText }]}>
              請輸入您的帳號密碼以繼續。
            </Text>
          </View>

          <View style={styles.formSection}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                電子郵件
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="example@mail.com"
                  placeholderTextColor={isDark ? "#555" : "#999"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="none"
                  autoComplete="email"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                />
                <Feather
                  name="mail"
                  size={20}
                  color={colors.subText}
                  style={styles.inputIcon}
                />
              </View>
            </View>

            {/* 密碼 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>密碼</Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="請輸入密碼"
                  placeholderTextColor={isDark ? "#555" : "#999"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="none"
                  autoComplete="password"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.subText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 忘記密碼 (可選) */}
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={[styles.forgotPasswordText, { color: colors.subText }]}>
                忘記密碼？
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mainButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.mainButtonText}>登入</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.registerLinkContainer}>
            <Text style={[styles.footerText, { color: colors.subText }]}>
              還沒有帳號嗎？{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={[styles.registerLinkText, { color: colors.primary }]}>
                立即註冊
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 25 },
  headerSection: { marginTop: 20, marginBottom: 40 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, lineHeight: 24 },
  formSection: { marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 54,
  },
  input: { flex: 1, fontSize: 16 },
  inputIcon: { marginLeft: 10 },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: { fontSize: 14, fontWeight: "500" },
  mainButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  mainButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  registerLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  footerText: { fontSize: 14 },
  registerLinkText: { fontSize: 14, fontWeight: "bold" },
});