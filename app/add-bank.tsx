import { useBank } from "@/context/BankContext";
import { useUser } from "@/context/UserContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddBankScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useUser();
  const { addAccount } = useBank();

  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleSave = async () => {
    if (!bankName || !accountNumber) {
      Alert.alert("提示", "請輸入銀行名稱與帳號");
      return;
    }

    try {
      await addAccount({
        bankName,
        bankCode,
        accountNumber,
        color: "#2C3E50", // 可以自訂或隨機給一個顏色
      });
      Alert.alert("成功", "銀行帳戶已新增，初始餘額為 $0");
      router.back();
    } catch (e) {
      Alert.alert("錯誤", "新增失敗，請稍後再試");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>新增銀行帳戶</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text
            style={{ color: colors.primary, fontWeight: "bold", fontSize: 16 }}
          >
            儲存
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.text }]}>銀行名稱</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.cardBackground, color: colors.text },
          ]}
          placeholder="例如：中國信託"
          placeholderTextColor={colors.subText}
          value={bankName}
          onChangeText={setBankName}
        />

        <Text style={[styles.label, { color: colors.text }]}>
          銀行代碼 (選填)
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.cardBackground, color: colors.text },
          ]}
          placeholder="例如：822"
          placeholderTextColor={colors.subText}
          keyboardType="number-pad"
          value={bankCode}
          onChangeText={setBankCode}
        />

        <Text style={[styles.label, { color: colors.text }]}>銀行帳號</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.cardBackground, color: colors.text },
          ]}
          placeholder="輸入帳號號碼"
          placeholderTextColor={colors.subText}
          keyboardType="number-pad"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />

        <View style={styles.note}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.subText}
          />
          <Text style={{ color: colors.subText, marginLeft: 5 }}>
            新增後預設餘額為 $0，您可以在管理頁面進行金額調整。
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 5 },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 15, fontSize: 16 },
  note: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    opacity: 0.8,
  },
});
