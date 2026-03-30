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
  TouchableWithoutFeedback, // 用來點擊背景收鍵盤
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("提示", "請填寫所有欄位");
      return;
    }

    if (password !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("錯誤", "兩次密碼輸入不一致");
      return;
    }

    if (!isAgreed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert("提示", "請閱讀並同意條款及隱私權政策");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name,
            phone: phone,
            avatar_url:
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
          },
        },
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (data.session) {
        Alert.alert("註冊成功", "帳號已建立，請設定您的交易密碼。", [
          {
            text: "前往設定",
            onPress: () => router.replace("/set-transaction-pin"),
          },
        ]);
      } else {
        Alert.alert("註冊成功", "請至信箱收取驗證信後登入。", [
          {
            text: "確定",
            onPress: () => router.replace("/login"),
          },
        ]);
      }
    } catch (error: any) {
      console.error("註冊失敗:", error.message);
      Alert.alert("註冊失敗", error.message || "請檢查輸入資料是否正確");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. 包覆 TouchableWithoutFeedback 實現點擊背景收起鍵盤
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: colors.background }}
        // 2. iOS 鍵盤偏移修正 (避免 Header 導致推動距離不夠)
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            // 3. 增加底部 Padding，確保最後的按鈕能被滾動到鍵盤上方
            { paddingTop: insets.top + 20, paddingBottom: 120 },
          ]}
          showsVerticalScrollIndicator={false}
          // 4. 關鍵：允許在鍵盤開啟時點擊按鈕 (ScrollView 不會攔截點擊)
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerSection}>
            <Text style={[styles.title, { color: colors.text }]}>註冊</Text>
            <Text style={[styles.subtitle, { color: colors.subText }]}>
              建立 EasySplit 帳戶以開始您的數位支付體驗。
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>名稱</Text>
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
                  placeholder="Alex Chen"
                  placeholderTextColor={isDark ? "#555" : "#999"}
                  value={name}
                  onChangeText={setName}
                  // 5. iOS 防干擾設定 (所有 Input 都加上)
                  textContentType="none"
                  autoComplete="off"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                />
                <Feather
                  name="user"
                  size={20}
                  color={colors.subText}
                  style={styles.inputIcon}
                />
              </View>
            </View>

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
                  // iOS 防干擾
                  textContentType="none"
                  autoComplete="off"
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

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>電話</Text>
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
                  placeholder="0912345678"
                  placeholderTextColor={isDark ? "#555" : "#999"}
                  value={phone}
                  onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                  keyboardType="phone-pad"
                  maxLength={10}
                  // iOS 防干擾
                  textContentType="none"
                  autoComplete="off"
                  selectionColor={colors.primary}
                />
                <Feather
                  name="phone"
                  size={20}
                  color={colors.subText}
                  style={styles.inputIcon}
                />
              </View>
            </View>

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
                  placeholder="至少 6 位字元"
                  placeholderTextColor={isDark ? "#555" : "#999"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  // iOS 防干擾 (密碼欄位更需要關閉自動建議)
                  textContentType="none"
                  autoComplete="off"
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

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                二次確認密碼
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
                  placeholder="再次輸入密碼"
                  placeholderTextColor={isDark ? "#555" : "#999"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  // iOS 防干擾
                  textContentType="none"
                  autoComplete="off"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color={colors.subText}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  { borderColor: colors.primary },
                  isAgreed && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsAgreed(!isAgreed);
                }}
              >
                {isAgreed && (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                )}
              </TouchableOpacity>
              <View style={styles.checkboxTextContainer}>
                <Text style={[styles.checkboxText, { color: colors.subText }]}>
                  我已同意 EasySplit{" "}
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    服務條款
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.checkboxText, { color: colors.subText }]}>
                  {" "}
                  與{" "}
                </Text>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    隱私權政策
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.mainButton,
                {
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.mainButtonText}>立即註冊</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginLinkContainer}>
            <Text style={[styles.footerText, { color: colors.subText }]}>
              已經有帳號了嗎？{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={[styles.loginLinkText, { color: colors.primary }]}>
                登入
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 25, paddingBottom: 40 },
  headerSection: { marginTop: 20, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  formSection: { marginBottom: 20 },
  inputGroup: { marginBottom: 18 },
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxTextContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  checkboxText: { fontSize: 13 },
  linkText: { fontSize: 13, fontWeight: "700" },
  mainButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  mainButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  footerText: { fontSize: 14 },
  loginLinkText: { fontSize: 14, fontWeight: "bold" },
});
