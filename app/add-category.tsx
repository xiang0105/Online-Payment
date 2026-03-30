import { useCategory } from "@/context/CategoryContext";
import { useUser } from "@/context/UserContext"; // 1. 引入 UserContext
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 5;

const COMMON_ICONS = [
  "silverware-fork-knife",
  "food",
  "food-apple",
  "hamburger",
  "coffee",
  "cup",
  "glass-cocktail",
  "glass-wine",
  "beer",
  "cart",
  "shopping",
  "tshirt-crew",
  "shoe-heel",
  "home",
  "laptop",
  "cellphone",
  "television",
  "bed",
  "sofa",
  "lamp",
  "car",
  "bus",
  "train",
  "airplane",
  "bike",
  "gas-station",
  "parking",
  "cash",
  "credit-card",
  "gift",
];

const OTHER_ICONS = [
  "dog",
  "cat",
  "paw",
  "basketball",
  "soccer",
  "tennis",
  "run",
  "dumbbell",
  "gamepad-variant",
  "controller-classic",
  "music-note",
  "guitar",
  "piano",
  "headphones",
  "book-open-variant",
  "briefcase",
  "paperclip",
  "pill",
  "hospital",
  "stethoscope",
  "baby-carriage",
  "heart",
  "star",
  "alert-circle",
  "check-circle",
];

export default function AddCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addCategory } = useCategory();
  const { colors, isDark } = useUser(); // 2. 取得主題顏色與狀態

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("silverware-fork-knife");
  const [activeTab, setActiveTab] = useState<"common" | "others">("common");

  // 使用你的主色調或從 colors.primary 取得
  const THEME_COLOR = colors.primary;

  const currentIcons = useMemo(
    () => (activeTab === "common" ? COMMON_ICONS : OTHER_ICONS),
    [activeTab]
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "請輸入類別名稱");
      return;
    }
    await addCategory({
      name: name.trim(),
      icon: selectedIcon,
      color: THEME_COLOR,
      type: "MaterialCommunityIcons",
      isCustom: true,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.background },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header - 隨主題換色 */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.cardBackground,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIcon}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            新增類別
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveAction}>
            <Text style={[styles.saveActionText, { color: colors.primary }]}>
              儲存
            </Text>
          </TouchableOpacity>
        </View>

        {/* 輸入區域 - 隨主題換色 */}
        <View
          style={[
            styles.inputSection,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconPreview,
              { backgroundColor: `${THEME_COLOR}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={selectedIcon as any}
              size={32}
              color={THEME_COLOR}
            />
          </View>

          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            placeholder="點擊輸入名稱"
            placeholderTextColor={colors.subText}
            value={name}
            onChangeText={setName}
            maxLength={10}
          />
        </View>

        {/* 圖示分頁切換 */}
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: colors.cardBackground,
              borderBottomColor: colors.border,
            },
          ]}
        >
          {(["common", "others"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && { borderBottomColor: colors.primary },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === tab ? colors.primary : colors.subText,
                  },
                ]}
              >
                {tab === "common" ? "常用圖示" : "其他圖示"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 圖示網格 */}
        <FlatList
          data={currentIcons}
          numColumns={COLUMN_COUNT}
          keyExtractor={(item) => item}
          contentContainerStyle={[
            styles.gridContent,
            { backgroundColor: colors.cardBackground },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item === selectedIcon;
            return (
              <TouchableOpacity
                style={[
                  styles.gridItem,
                  isSelected && { backgroundColor: `${THEME_COLOR}15` },
                ]}
                onPress={() => setSelectedIcon(item)}
              >
                <MaterialCommunityIcons
                  name={item as any}
                  size={26}
                  color={
                    isSelected ? THEME_COLOR : isDark ? "#A0A0A0" : "#48484A"
                  }
                />
                {isSelected && (
                  <View style={styles.miniCheck}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={THEME_COLOR}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 17, fontWeight: "600" },
  headerIcon: { width: 40 },
  saveAction: { paddingHorizontal: 8 },
  saveActionText: { fontSize: 17, fontWeight: "600" },

  inputSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconPreview: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
  },

  tabBar: {
    flexDirection: "row",
    marginTop: 24,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    marginRight: 24,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 15, fontWeight: "500" },

  gridContent: { paddingBottom: 40 },
  gridItem: {
    width: width / COLUMN_COUNT,
    height: width / COLUMN_COUNT,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  miniCheck: {
    position: "absolute",
    bottom: 8,
    right: 8,
  },
});
