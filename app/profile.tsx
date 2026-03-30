import { useUser } from "@/context/UserContext";
import { FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons"; // ★ 加入 FontAwesome
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { memo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 子組件
const SettingItem = memo(
  ({
    iconName,
    iconColor,
    label,
    value,
    isSwitch = false,
    switchValue,
    onSwitchChange,
    onPress,
    colors,
  }: any) => (
    <TouchableOpacity
      style={[
        styles.itemContainer,
        {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={isSwitch ? undefined : onPress}
      activeOpacity={0.6}
    >
      {/* 左側：圖示 + 標題 (加入 flexShrink 防止擠壓右邊) */}
      <View style={[styles.itemLeft, { flexShrink: 0 }]}>
        <View
          style={[styles.iconCircle, { backgroundColor: `${iconColor}15` }]}
        >
          <FontAwesome5 name={iconName} size={14} color={iconColor} solid />
        </View>
        <Text style={[styles.itemLabel, { color: colors.text }]}>{label}</Text>
      </View>

      {/* 右側：內容 (移除行數限制，確保顯示完整) */}
      <View style={styles.itemRight}>
        {isSwitch ? (
          <Switch
            trackColor={{ false: "#E9E9EA", true: "#34C759" }}
            thumbColor={"#FFFFFF"}
            onValueChange={onSwitchChange}
            value={switchValue}
          />
        ) : (
          <>
            <Text
              style={[styles.itemValue, { color: colors.subText }]}
              // ★★★ 移除 numberOfLines={1}，避免錯誤截斷 ★★★
              // numberOfLines={1} 
              // ellipsizeMode="tail"
            >
              {value || <Text style={{ color: "#CCC" }}>未設定</Text>}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.subText}
              style={{ marginLeft: 6 }}
            />
          </>
        )}
      </View>
    </TouchableOpacity>
  )
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userInfo, updateUser, logout, colors, isDark } = useUser();

  // 控制狀態
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal 狀態
  const [modalVisible, setModalVisible] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState("");
  const [tempValue, setTempValue] = useState("");

  const openEditModal = (key: string, title: string) => {
    setEditKey(key);
    setModalTitle(title);
    setTempValue(
      userInfo ? (userInfo[key as keyof typeof userInfo] || "").toString() : ""
    );
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (editKey && userInfo) {
      setIsUpdating(true);
      try {
        await updateUser({ [editKey]: tempValue.trim() });
        setModalVisible(false);
      } catch (error) {
        Alert.alert("更新失敗", "請檢查網路連線");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleAvatarPicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && userInfo) {
      try {
        await updateUser({ avatar_url: result.assets[0].uri });
      } catch (e) {
        Alert.alert("頭像更新失敗");
      }
    }
  };

  if (!userInfo)
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>設定</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 頭像區域 */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleAvatarPicker}
            activeOpacity={0.7}
          >
            <View style={styles.avatarWrapper}>
              {userInfo.avatar_url ? (
                <Image
                  source={{ uri: userInfo.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                // ★ 修改處：使用 FontAwesome user-circle 作為預設頭像
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <FontAwesome
                    name="user-circle"
                    size={90} // 稍微調大一點填滿圓形
                    color={isDark ? "#555" : "#CCC"}
                  />
                </View>
              )}

              {/* 相機圖標 */}
              <View
                style={[
                  styles.cameraBadge,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.background,
                  },
                ]}
              >
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </View>

            {/* ★ 修改處：新增文字提示，解決不顯眼的問題 */}
            <View style={styles.editAvatarLabelBox}>
              <Text style={[styles.editAvatarText, { color: colors.primary }]}>
                更換頭貼
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.profileName, { color: colors.text }]}>
            {userInfo.name}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.subText }]}>
            {userInfo.email}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>個人資訊</Text>
        <SettingItem
          iconName="user-alt"
          iconColor="#007AFF"
          label="姓名"
          value={userInfo.name}
          onPress={() => openEditModal("name", "姓名")}
          colors={colors}
        />
        <SettingItem
          iconName="mobile-alt"
          iconColor="#34C759"
          label="電話"
          value={userInfo.phone}
          onPress={() => openEditModal("phone", "電話")}
          colors={colors}
        />

        <Text style={[styles.sectionTitle, { marginTop: 25 }]}>
          安全性與偏好
        </Text>
        <SettingItem
          iconName="fingerprint"
          iconColor="#AF52DE"
          label="指紋/面容啟用"
          isSwitch
          switchValue={isBiometricEnabled}
          onSwitchChange={setIsBiometricEnabled}
          colors={colors}
        />
        <SettingItem
          iconName="bell"
          iconColor="#FF3B30"
          label="推播通知"
          isSwitch
          switchValue={isNotificationEnabled}
          onSwitchChange={setIsNotificationEnabled}
          colors={colors}
        />

        {/* 登出按鈕 */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: isDark ? "#2C1515" : "#FFF5F5" },
          ]}
          onPress={() =>
            Alert.alert("確認登出", "登出後將返回註冊頁面。", [
              { text: "取消", style: "cancel" },
              {
                text: "確定",
                style: "destructive",
                onPress: logout,
              },
            ])
          }
        >
          <Text style={styles.logoutButtonText}>登出帳號</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>EasySplit v1.2.0 Cloud Edition</Text>
      </ScrollView>

      {/* Modal */}
      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              修改{modalTitle}
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={tempValue}
              onChangeText={setTempValue}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => setModalVisible(false)}
                disabled={isUpdating}
              >
                <Text style={{ color: colors.subText, fontWeight: "600" }}>
                  取消
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>儲存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: { paddingBottom: 60 },

  // Profile Section Styles
  profileSection: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  avatarContainer: { alignItems: "center", marginBottom: 15 }, // 增加容器以便置中文字
  avatarWrapper: { position: "relative" },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  defaultAvatar: {
    backgroundColor: "transparent", // 改為透明，因為 FontAwesome user-circle 自帶背景感
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32, // 稍微加大
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    elevation: 4, // Android 陰影
    shadowColor: "#000", // iOS 陰影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  editAvatarLabelBox: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editAvatarText: {
    fontSize: 14,
    fontWeight: "600",
  },

  profileName: { fontSize: 22, fontWeight: "700" },
  profileEmail: { fontSize: 14, marginTop: 4 },
  sectionTitle: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
    marginLeft: 20,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemLabel: { fontSize: 16, fontWeight: "500" },

  // ★ 修改 Item Right 以支援長文字
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // 讓右側區域佔據剩餘空間
    justifyContent: "flex-end",
    marginLeft: 10, // 與左側 Label 保持距離
  },
  itemValue: {
    fontSize: 15,
    textAlign: "right",
    flex: 1, // 讓文字可以填滿空間
    // maxWidth: 180, // ★ 移除這個限制
  },

  logoutButton: {
    marginHorizontal: 20,
    marginTop: 40,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButtonText: { fontSize: 16, color: "#FF3B30", fontWeight: "700" },
  versionText: {
    textAlign: "center",
    color: "#BBB",
    fontSize: 12,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  modalContent: { borderRadius: 28, padding: 25 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
