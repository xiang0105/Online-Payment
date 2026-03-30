import { useCards } from "@/context/CardContext";
import { useCategory } from "@/context/CategoryContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const CHART_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8AC926",
  "#1982C4",
  "#6A4C93",
  "#F15BB5",
];

// Helper Functions
const renderCategoryIcon = (
  iconName: string,
  iconType: string = "Ionicons",
  color: string = "#333",
  size: number = 20
) => {
  switch (iconType) {
    case "Feather":
      return <Feather name={iconName as any} size={size} color={color} />;
    case "FontAwesome5":
      return <FontAwesome5 name={iconName as any} size={size} color={color} />;
    case "MaterialIcons":
      return <MaterialIcons name={iconName as any} size={size} color={color} />;
    case "MaterialCommunityIcons":
      return (
        <MaterialCommunityIcons
          name={iconName as any}
          size={size}
          color={color}
        />
      );
    case "AntDesign":
      return <AntDesign name={iconName as any} size={size} color={color} />;
    case "Entypo":
      return <Entypo name={iconName as any} size={size} color={color} />;
    case "Ionicons":
    default:
      return <Ionicons name={iconName as any} size={size} color={color} />;
  }
};

const MiniCardIcon = ({ color, type }: { color: string; type: string }) => (
  <View style={[styles.miniCard, { backgroundColor: color || "#333" }]}>
    {type === "WALLET" ? (
      <Ionicons name="wallet" size={12} color="#fff" />
    ) : (
      <FontAwesome5
        name={type === "VISA" ? "cc-visa" : "cc-mastercard"}
        size={12}
        color="#fff"
      />
    )}
  </View>
);

export default function AccountingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, userInfo } = useUser();
  const { cards } = useCards();
  const { categories } = useCategory();

  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [isTimeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string>("wallet");
  const [isCardDropdownOpen, setCardDropdownOpen] = useState(false);
  const [dbTransactions, setDbTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const activeCardInfo = useMemo(() => {
    if (selectedCardId === "wallet") {
      return {
        id: "wallet",
        name: "我的錢包",
        type: "WALLET",
        backgroundColor: "#F2C94C",
        cardNumber: "Wallet",
      };
    }
    return cards.find((c) => c.id === selectedCardId);
  }, [selectedCardId, cards]);

  useFocusEffect(
    useCallback(() => {
      const fetchTransactions = async () => {
        if (!userInfo?.id) return;
        setIsLoading(true);
        try {
          let query = supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userInfo.id)
            .order("date", { ascending: false });

          if (selectedCardId === "wallet") {
            query = query.is("card_id", null);
          } else {
            query = query.eq("card_id", selectedCardId);
          }

          const { data, error } = await query;
          if (error) throw error;
          setDbTransactions(data || []);
        } catch (err) {
          console.error("Fetch transactions error:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransactions();
    }, [selectedCardId, userInfo?.id])
  );

  // ★★★ 資料計算邏輯修改 (使用 description 判斷) ★★★
  const { barData, pieData, totalExpense, filteredTransactions } =
    useMemo(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let transactions: any[] = [];
      let calculatedBarData: { label: string; value: number }[] = [];

      // --- 時間篩選 ---
      if (timeRange === "week") {
        const day = now.getDay() || 7;
        if (day !== 1) now.setHours(-24 * (day - 1));
        const startOfWeek = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
        calculatedBarData = weekDays.map((label) => ({ label, value: 0 }));

        dbTransactions.forEach((tx) => {
          const txDate = new Date(tx.date);
          if (txDate >= startOfWeek && txDate < endOfWeek) {
            // A. 列表：收入支出都要
            transactions.push(tx);

            // B. 圖表：排除收入 (判斷 description 是否包含 "收到")
            const isIncome = tx.description && tx.description.includes("收到");
            if (!isIncome) {
              let dayIndex = txDate.getDay() - 1;
              if (dayIndex === -1) dayIndex = 6;
              if (dayIndex >= 0 && dayIndex < 7) {
                calculatedBarData[dayIndex].value += Number(tx.amount);
              }
            }
          }
        });
      } else if (timeRange === "month") {
        const months = [
          "1月",
          "2月",
          "3月",
          "4月",
          "5月",
          "6月",
          "7月",
          "8月",
          "9月",
          "10月",
          "11月",
          "12月",
        ];
        calculatedBarData = months.map((label) => ({ label, value: 0 }));

        dbTransactions.forEach((tx) => {
          const txDate = new Date(tx.date);
          if (txDate.getFullYear() === currentYear) {
            if (txDate.getMonth() === currentMonth) {
              transactions.push(tx);
            }
            // B. 圖表 (排除收入)
            const isIncome = tx.description && tx.description.includes("收到");
            if (!isIncome) {
              calculatedBarData[txDate.getMonth()].value += Number(tx.amount);
            }
          }
        });
      } else if (timeRange === "year") {
        for (let i = 4; i >= 0; i--) {
          calculatedBarData.push({ label: String(currentYear - i), value: 0 });
        }
        dbTransactions.forEach((tx) => {
          const txDate = new Date(tx.date);
          const yearDiff = currentYear - txDate.getFullYear();
          if (yearDiff === 0) {
            transactions.push(tx);
          }
          // B. 圖表 (排除收入)
          const isIncome = tx.description && tx.description.includes("收到");
          if (!isIncome) {
            if (yearDiff >= 0 && yearDiff <= 4) {
              const index = 4 - yearDiff;
              calculatedBarData[index].value += Number(tx.amount);
            }
          }
        });
      }

      // --- 圓餅圖計算 (只算支出) ---
      const categoryTotals = transactions.reduce((acc: any, tx: any) => {
        // ★ 排除收入
        const isIncome = tx.description && tx.description.includes("收到");
        if (isIncome) return acc;

        const catId = tx.category_id || tx.categoryId || "uncategorized";
        acc[catId] = (acc[catId] || 0) + Number(tx.amount);
        return acc;
      }, {});

      const totalSum = Object.values(categoryTotals).reduce(
        (a: any, b: any) => a + b,
        0
      ) as number;

      const calculatedPieData = categories
        .map((cat, index) => {
          // 先檢查這個類別是否有金額 (因為我們已经在 categoryTotals 排除收入了，所以如果是純收入類別，這裡金額會是 0)
          const amount = categoryTotals[cat.id] || 0;
          if (amount <= 0) return null; // 直接過濾掉沒有支出的類別

          const sliceColor =
            cat.color || CHART_COLORS[index % CHART_COLORS.length];
          const percentage =
            totalSum > 0 ? ((amount / totalSum) * 100).toFixed(1) : "0";

          return {
            ...cat,
            name: `${cat.name}`,
            total: amount,
            population: amount,
            color: sliceColor,
            legendFontColor: colors.subText,
            legendFontSize: 12,
          };
        })
        .filter((item) => item !== null) // 過濾掉 null
        .sort((a: any, b: any) => b.total - a.total);

      // 未分類
      if (categoryTotals["uncategorized"] > 0) {
        const amount = categoryTotals["uncategorized"];
        const percentage =
          totalSum > 0 ? ((amount / totalSum) * 100).toFixed(1) : "0";
        calculatedPieData.push({
          id: "uncategorized",
          name: `未分類 (${percentage}%)`,
          icon: "help-circle",
          type: "expense",
          total: amount,
          population: amount,
          color: "#999999",
          legendFontColor: colors.subText,
          legendFontSize: 12,
        });
      }

      const calculatedTotalExpense = calculatedPieData.reduce(
        (sum: any, item: any) => sum + item.total,
        0
      );
      const maxValue = Math.max(...calculatedBarData.map((d) => d.value)) || 1;

      return {
        barData: calculatedBarData.map((d) => ({
          ...d,
          heightPercent: (d.value / maxValue) * 100,
        })),
        pieData: calculatedPieData,
        totalExpense: calculatedTotalExpense,
        filteredTransactions: transactions,
      };
    }, [dbTransactions, categories, timeRange, colors]);

  const toggleChartType = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChartType((prev) => (prev === "bar" ? "pie" : "bar"));
  };

  const handleCardSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedCardId(id);
    setCardDropdownOpen(false);
  };

  const handleTimeSelect = (range: "week" | "month" | "year") => {
    Haptics.selectionAsync();
    setTimeRange(range);
    setTimeDropdownOpen(false);
  };

  const getTransactionCategory = (id?: string) => {
    const catId = id || "uncategorized";
    return (
      categories.find((c) => c.id === catId) || {
        name: "未分類",
        icon: "help-circle",
        color: "#ccc",
        type: "Ionicons",
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${String(
      date.getHours()
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const chartConfig = {
    backgroundGradientFrom: "#1E2923",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#08130D",
    backgroundGradientToOpacity: 0.5,
    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            記帳分析
          </Text>
        </View>

        {/* 圖表區塊 */}
        <View
          style={[
            styles.chartSection,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.chartHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {timeRange === "week"
                ? "本週"
                : timeRange === "month"
                ? "年度月"
                : "近五年"}{" "}
              支出{chartType === "bar" ? "趨勢" : "分佈"}
            </Text>
            <View style={{ zIndex: 20 }}>
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F5F7FA" },
                ]}
                onPress={() => setTimeDropdownOpen(!isTimeDropdownOpen)}
              >
                <Text style={[styles.dropdownText, { color: colors.text }]}>
                  {timeRange === "week"
                    ? "一周"
                    : timeRange === "month"
                    ? "一月"
                    : "一年"}
                </Text>
                <Ionicons
                  name={isTimeDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={14}
                  color={colors.subText}
                />
              </TouchableOpacity>
              {isTimeDropdownOpen && (
                <View
                  style={[
                    styles.timeDropdownList,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {["week", "month", "year"].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={styles.timeDropdownItem}
                      onPress={() => handleTimeSelect(t as any)}
                    >
                      <Text style={{ color: colors.text }}>
                        {t === "week"
                          ? "一周"
                          : t === "month"
                          ? "一月"
                          : "一年"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {isLoading ? (
            <View
              style={{
                height: 160,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator color={colors.primary} />
              <Text
                style={{ color: colors.subText, marginTop: 10, fontSize: 12 }}
              >
                載入資料中...
              </Text>
            </View>
          ) : (
            <View style={styles.chartCarouselContainer}>
              <TouchableOpacity
                onPress={toggleChartType}
                style={styles.arrowBtn}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={colors.subText}
                />
              </TouchableOpacity>
              <View style={styles.chartContent}>
                {chartType === "bar" ? (
                  <View style={styles.barChartWrapper}>
                    <View style={styles.barsContainer}>
                      {barData.map((data, i) => (
                        <View
                          key={i}
                          style={[
                            styles.barWrapper,
                            { width: timeRange === "month" ? "8%" : "14%" },
                          ]}
                        >
                          <View
                            style={[
                              styles.emptyBar,
                              {
                                height: Math.max(
                                  4,
                                  (data.heightPercent / 100) * 100
                                ),
                                backgroundColor:
                                  data.value > 0
                                    ? colors.primary
                                    : colors.border,
                                width: timeRange === "month" ? 8 : 14,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.axisLabel,
                              {
                                color: colors.subText,
                                fontSize: timeRange === "month" ? 9 : 10,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {data.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.pieChartWrapper}>
                    {pieData.length > 0 ? (
                      <PieChart
                        data={pieData}
                        width={width - 100}
                        height={100}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"0"}
                        center={[10, 0]}
                        absolute={false} // 百分比
                        
                      />
                    ) : (
                      <View
                        style={[
                          styles.piePlaceholder,
                          { backgroundColor: isDark ? "#2C2C2E" : "#F0F0F0" },
                        ]}
                      >
                        <Text style={{ color: colors.subText, fontSize: 12 }}>
                          暫無數據
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={toggleChartType}
                style={styles.arrowBtn}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.subText}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 卡片選擇器 */}
        <View style={styles.cardSelectorContainer}>
          <TouchableOpacity
            style={[
              styles.cardDropdownTrigger,
              {
                backgroundColor: colors.cardBackground,
                borderColor: isCardDropdownOpen
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => setCardDropdownOpen(!isCardDropdownOpen)}
          >
            <MiniCardIcon
              color={activeCardInfo?.backgroundColor || "#ccc"}
              type={activeCardInfo?.type || "VISA"}
            />
            <Text style={[styles.cardDropdownText, { color: colors.text }]}>
              {activeCardInfo
                ? activeCardInfo.id === "wallet"
                  ? "我的錢包"
                  : `${
                      activeCardInfo.name
                    } •••• ${activeCardInfo.cardNumber.slice(-4)}`
                : "未選取"}
            </Text>
            <Ionicons
              name={isCardDropdownOpen ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.subText}
            />
          </TouchableOpacity>
          {isCardDropdownOpen && (
            <View
              style={[
                styles.dropdownListContainer,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.dropdownListItem}
                onPress={() => handleCardSelect("wallet")}
              >
                <MiniCardIcon color="#F2C94C" type="WALLET" />
                <Text style={[styles.dropdownListText, { color: colors.text }]}>
                  我的錢包
                </Text>
                {selectedCardId === "wallet" && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
              {cards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.dropdownListItem}
                  onPress={() => handleCardSelect(card.id)}
                >
                  <MiniCardIcon color={card.backgroundColor} type={card.type} />
                  <Text
                    style={[styles.dropdownListText, { color: colors.text }]}
                  >
                    {card.name}
                  </Text>
                  {selectedCardId === card.id && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 交易明細列表 */}
        <View style={styles.categoryListSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, marginBottom: 15 },
            ]}
          >
            {timeRange === "week"
              ? "本週"
              : timeRange === "month"
              ? "本月"
              : "今年"}{" "}
            交易明細
          </Text>
          {isLoading ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 20 }}
            />
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, index) => {
              const category = getTransactionCategory(
                tx.category_id || tx.categoryId
              );
              // ★ 判斷標題是否包含 "收到"
              const isIncome =
                tx.description && tx.description.includes("收到");

              return (
                <View key={tx.id || index}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/transaction-details",
                        params: {
                          id: tx.id,
                          amount: tx.amount,
                          receiver: tx.description,
                          date: tx.date,
                          categoryId: tx.category_id,
                          cardId: tx.card_id,
                        },
                      })
                    }
                  >
                    <View
                      style={[
                        styles.categoryRow,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: isDark ? "#2C2C2E" : "#F5F7FA" },
                        ]}
                      >
                        {renderCategoryIcon(
                          category.icon,
                          category.type,
                          isDark ? "#fff" : "#333",
                          20
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.categoryName, { color: colors.text }]}
                        >
                          {tx.description || category.name}
                        </Text>
                        <Text
                          style={[
                            styles.categoryPercent,
                            { color: colors.subText },
                          ]}
                        >
                          {formatDate(tx.date)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.categoryAmount,
                          { color: isIncome ? "#4CAF50" : colors.text },
                        ]}
                      >
                        {isIncome ? "+" : "-"}$
                        {Number(tx.amount).toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyBox}>
              <MaterialIcons
                name="receipt-long"
                size={48}
                color={colors.border}
              />
              <Text style={{ color: colors.subText, marginTop: 10 }}>
                本期尚無交易紀錄
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { marginVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: "bold" },
  chartSection: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 25,
    minHeight: 220,
    zIndex: 10,
  },
  chartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    zIndex: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dropdownText: { fontSize: 13, fontWeight: "600", marginRight: 4 },
  timeDropdownList: {
    position: "absolute",
    top: 35,
    right: 0,
    width: 100,
    borderWidth: 1,
    borderRadius: 12,
    padding: 5,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  timeDropdownItem: { paddingVertical: 10, alignItems: "center" },
  chartCarouselContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 180,
    zIndex: 1,
  },
  chartContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  barChartWrapper: { width: "100%" },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    width: "100%",
  },
  barWrapper: { alignItems: "center" },
  emptyBar: { borderRadius: 6 },
  axisLabel: { fontSize: 10, marginTop: 8 },
  pieChartWrapper: { width: "100%", alignItems: "center" },
  piePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  arrowBtn: { padding: 10 , zIndex: 10000},
  cardSelectorContainer: { zIndex: 5, marginBottom: 30 },
  cardDropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
  },
  miniCard: {
    width: 28,
    height: 18,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardDropdownText: { flex: 1, fontSize: 15, fontWeight: "700" },
  dropdownListContainer: {
    position: "absolute",
    top: "110%",
    left: 0,
    right: 0,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    elevation: 5,
  },
  dropdownListItem: { flexDirection: "row", alignItems: "center", padding: 12 },
  dropdownListText: { flex: 1, fontSize: 15, marginLeft: 12 },
  categoryListSection: { marginTop: 10, zIndex: 1 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  categoryName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  categoryPercent: { fontSize: 12 },
  categoryAmount: { fontSize: 16, fontWeight: "800" },
  emptyBox: { alignItems: "center", marginTop: 40, opacity: 0.5 },
});
