import { useCategory } from "@/context/CategoryContext";
import { useUser } from "@/context/UserContext"; // 1. 引入 UserContext
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const GAP = 15;
const PADDING = 25;
const ITEM_WIDTH = (width - PADDING * 2 - GAP * 2) / 3;

export default function CategorySelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, deleteCategory } = useCategory();
  const { colors, isDark } = useUser(); // 2. 取得主題顏色與狀態

  const [selectedId, setSelectedId] = useState(categories[0]?.id || "");
  const [isEditing, setIsEditing] = useState(false);

  const renderIcon = (type: string, name: any, color: string) => {
    const size = 28;
    const props = { name, size, color };
    switch (type) {
      case "MaterialCommunityIcons":
        return <MaterialCommunityIcons {...props} />;
      case "Feather":
        return <Feather {...props} />;
      case "Ionicons":
        return <Ionicons {...props} />;
      default:
        return (
          <MaterialCommunityIcons
            name="help-circle-outline"
            size={size}
            color={color}
          />
        );
    }
  };

  const handleSelect = (id: string) => {
    if (isEditing) return;
    setSelectedId(id);
  };

  const confirmDelete = (category: any) => {
    Alert.alert("刪除類別", `確定要刪除「${category.name}」嗎？`, [
      { text: "取消", style: "cancel" },
      {
        text: "確認刪除",
        style: "destructive",
        onPress: async () => {
          await deleteCategory(category.id);
          if (category.id === selectedId) {
            setSelectedId(categories[0]?.id || "");
          }
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header - 隨主題換色 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          選擇類別
        </Text>

        <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
          <Text style={[styles.headerRightAction, { color: colors.primary }]}>
            {isEditing ? "完成" : "管理"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <View style={styles.gridContainer}>
          {categories.map((item: any) => {
            const isSelected = selectedId === item.id;
            const canDelete = isEditing && item.isCustom;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={isEditing ? 1 : 0.7}
                style={[
                  styles.itemContainer,
                  isSelected
                    ? {
                        backgroundColor: colors.primary,
                        shadowColor: colors.primary,
                      }
                    : {
                        backgroundColor: isDark
                          ? colors.cardBackground
                          : "#F1F5F9",
                      },
                ]}
                onPress={() => handleSelect(item.id)}
              >
                {renderIcon(
                  item.type,
                  item.icon,
                  isSelected ? "#FFF" : isDark ? colors.subText : "#475569"
                )}
                <Text
                  numberOfLines={1}
                  style={[
                    styles.itemText,
                    { color: isSelected ? "#FFF" : colors.text },
                  ]}
                >
                  {item.name}
                </Text>

                {/* 刪除按鈕 - 優化深色模式視覺 */}
                {canDelete && (
                  <TouchableOpacity
                    style={[
                      styles.deleteBadge,
                      { backgroundColor: colors.cardBackground },
                    ]}
                    onPress={() => confirmDelete(item)}
                  >
                    <Ionicons name="remove-circle" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                )}

                {/* 選中標記 */}
                {isSelected && !isEditing && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* 新增按鈕 - 樣式隨主題變動 */}
          {!isEditing && (
            <TouchableOpacity
              style={[
                styles.itemContainer,
                styles.addItem,
                {
                  borderColor: colors.border,
                  backgroundColor: isDark ? colors.cardBackground : "#F8FAFC",
                },
              ]}
              onPress={() => router.push("/add-category")}
            >
              <Ionicons name="add" size={32} color={colors.subText} />
              <Text style={[styles.addText, { color: colors.subText }]}>
                新增
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  headerRightAction: {
    fontWeight: "600",
    fontSize: 16,
    width: 40,
    textAlign: "right",
  },
  backButton: { width: 40 },

  scrollContainer: { paddingHorizontal: PADDING },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    marginTop: 10,
  },

  itemContainer: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    // 陰影僅在選中或淺色模式較明顯
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  itemText: { marginTop: 10, fontSize: 13, fontWeight: "600" },

  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  deleteBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    borderRadius: 12,
  },

  addItem: {
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addText: { marginTop: 8, fontSize: 13, fontWeight: "600" },
});
