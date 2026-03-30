import { useUser } from "@/context/UserContext"; // ★ 引入主題配色
import {
  AntDesign,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics"; // ★ 引入觸覺回饋
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type ActionItem = {
  icon: React.ReactNode;
  label: string;
  bgColor?: string;
  route?: string;
};

export default function OthersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useUser(); // ★ 取得動態配色

  // 1. 頂部功能列 (加入主題判斷)
  const topActions: ActionItem[] = [
    {
      icon: (
        <MaterialCommunityIcons
          name="swap-horizontal"
          size={28}
          color="#4A90E2"
        />
      ),
      label: "轉帳",
      bgColor: isDark ? "#1A2A44" : "#EAF2FF",
    },
    {
      icon: <Ionicons name="wallet-outline" size={28} color="#27AE60" />,
      label: "儲值",
      bgColor: isDark ? "#0D2D1A" : "#EAFBF1",
    },
    {
      icon: <Ionicons name="receipt-outline" size={28} color="#F39C12" />,
      label: "帳單",
      bgColor: isDark ? "#3D2A0D" : "#FEF5E7",
    },
    {
      icon: <AntDesign name="gift" size={28} color="#E91E63" />,
      label: "獎勵",
      bgColor: isDark ? "#3D0D1F" : "#FCE4EC",
    },
  ];

  // 2. 服務區塊
  const serviceItems: ActionItem[] = [
    {
      icon: <Ionicons name="card-outline" size={26} color={colors.text} />,
      label: "卡片",
      route: "/manage-cards",
    },
    {
      icon: <Feather name="settings" size={26} color={colors.text} />,
      label: "設定",
      route: "/profile",
    },
    {
      icon: <MaterialIcons name="category" size={24} color={colors.text} />,
      label: "類別",
      route: "/category-select",
    },
    {
      icon: <MaterialIcons name="account-balance" size={24} color={colors.text} />,
      label: "帳戶",
      route: "/manage-banks",
    },
    {
      icon: <Ionicons name="home-outline" size={26} color={colors.text} />,
      label: "貸款",
    },
    {
      icon: (
        <Ionicons name="swap-vertical-outline" size={26} color={colors.text} />
      ),
      label: "交換",
    },
    {
      icon: (
        <MaterialCommunityIcons
          name="file-document-outline"
          size={26}
          color={colors.text}
        />
      ),
      label: "稅務",
    },
    {
      icon: (
        <Ionicons name="trending-up-outline" size={26} color={colors.text} />
      ),
      label: "投資",
    },
    // {
    //   icon: (
    //     <MaterialCommunityIcons
    //       name="file-chart-outline"
    //       size={26}
    //       color={colors.text}
    //     />
    //   ),
    //   label: "表述",
    // },
  ];

  // 3. 日常生活
  const dailyLifeItems: ActionItem[] = [
    {
      icon: (
        <MaterialCommunityIcons
          name="movie-open-outline"
          size={26}
          color={colors.text}
        />
      ),
      label: "電影",
    },
    {
      icon: <Ionicons name="airplane-outline" size={26} color={colors.text} />,
      label: "旅遊",
    },
    {
      icon: <Feather name="shopping-bag" size={26} color={colors.text} />,
      label: "商店",
    },
    {
      icon: <AntDesign name="customer-service" size={26} color={colors.text} />,
      label: "客服",
    },
  ];

  // 抽離 Grid 組件以維持代碼整潔
  const GridItem = ({ item }: { item: ActionItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (item.route) router.push(item.route as any);
      }}
    >
      <View
        style={[
          styles.gridIconCircle,
          { backgroundColor: colors.cardBackground },
        ]}
      >
        {item.icon}
      </View>
      <Text style={[styles.gridLabel, { color: colors.text }]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            其他功能
          </Text>
        </View>

        {/* 頂部功能列 */}
        <View style={styles.topActionContainer}>
          {topActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.topActionItem}
              onPress={() => Haptics.selectionAsync()}
            >
              <View
                style={[
                  styles.topActionIconBox,
                  { backgroundColor: item.bgColor },
                ]}
              >
                {item.icon}
              </View>
              <Text style={[styles.topActionLabel, { color: colors.text }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 橫幅廣告 (使用更豐富的色彩) */}
        <TouchableOpacity activeOpacity={0.9} style={styles.bannerWrapper}>
          <LinearGradient
            colors={isDark ? ["#1A2A44", "#0D1A2D"] : ["#4A90E2", "#357ABD"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerGradient}
          >
            <View style={styles.bannerDecorator} />
            <View style={styles.bannerContent}>
              <View
                style={[
                  styles.bannerTag,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <Text style={styles.bannerTagText}>課程專案</Text>
              </View>
              <Text style={styles.bannerTitle}>系統分析與設計</Text>
              <Text style={styles.bannerSubtitle}>資財三甲</Text>
              <Text style={styles.bannerButtonText}>查看詳情 {">"}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* 服務區塊 */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            服務
          </Text>
          <View style={styles.gridContainer}>
            {serviceItems.map((item, i) => (
              <GridItem key={i} item={item} />
            ))}
          </View>
        </View>

        {/* 特別區塊 */}
        <TouchableOpacity
          style={[
            styles.dealCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={() =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          }
        >
          <View
            style={[
              styles.dealIconBox,
              { backgroundColor: isDark ? "#3D2A0D" : "#FFF5E0" },
            ]}
          >
            <FontAwesome5 name="graduation-cap" size={22} color="#F39C12" />
          </View>
          <View style={styles.dealContent}>
            <Text style={[styles.dealTitle, { color: colors.text }]}>
              系統分析與設計
            </Text>
            <Text style={[styles.dealSubtitle, { color: colors.subText }]}>
              黃晨峰害怕被當，老師請撈撈菜菜
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subText} />
        </TouchableOpacity>

        {/* 日常生活區塊 */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            日常生活
          </Text>
          <View style={styles.gridContainer}>
            {dailyLifeItems.map((item, i) => (
              <GridItem key={i} item={item} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginTop: 20, marginBottom: 25 },
  headerTitle: { fontSize: 28, fontWeight: "bold" },
  topActionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  topActionItem: { alignItems: "center", width: (width - 40) / 4 },
  topActionIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  topActionLabel: { fontSize: 13, fontWeight: "600" },
  bannerWrapper: {
    marginBottom: 30,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
  },
  bannerGradient: { padding: 24, height: 160, position: "relative" },
  bannerDecorator: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  bannerContent: { flex: 1, justifyContent: "center" },
  bannerTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  bannerTagText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bannerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  bannerSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
  },
  bannerButtonText: { fontSize: 13, color: "#fff", fontWeight: "700" },
  sectionContainer: { marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "25%", alignItems: "center", marginBottom: 25 },
  gridIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 1,
  },
  gridLabel: { fontSize: 12, fontWeight: "500" },
  dealCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 35,
  },
  dealIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  dealContent: { flex: 1 },
  dealTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  dealSubtitle: { fontSize: 13 },
});
