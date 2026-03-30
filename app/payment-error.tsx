import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function PaymentErrorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // --- 1. Parse Parameters ---
  const amount = params.amount as string;
  const receiver = (params.receiver as string) || "Unknown Merchant";
  const date = (params.date as string) || new Date().toISOString();
  const paymentMethodLabel = (params.paymentMethodLabel as string) || "Wallet";
  const failureReason = (params.reason as string) || "Connection Timeout";

  // Format Date
  const formattedDate = new Date(date).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const handleRetry = () => {
    // Go back to home on retry
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- Red Curved Header --- */}
      <View style={styles.redHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="close" size={45} color="#DC2626" />
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 80, // Push content down to overlap header
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* --- White Information Card --- */}
          <View style={styles.card}>
            <Text style={styles.headerTitle}>交易失敗</Text>
            <Text style={styles.subMessage}>交易錯誤，請重新嘗試</Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>

            <View style={{ width: "100%" }}>
              {/* Merchant */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>交易商家</Text>
                <Text style={styles.valueBold} numberOfLines={1}>
                  {receiver}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Amount */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>交易金額</Text>
                <Text style={styles.amountValue}>
                  $ {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Payment Method */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>交易方式</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {paymentMethodLabel}
                </Text>
              </View>

              <View style={styles.divider} />

              {/* Failure Reason (Red) */}
              <View style={styles.infoRow}>
                <Text style={styles.label}>失敗原因</Text>
                <Text style={styles.errorText} numberOfLines={2}>
                  {failureReason}
                </Text>
              </View>
            </View>

            {/* Retry Button */}
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>確認</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9", // Light gray background
  },
  // Red Curved Header
  redHeader: {
    height: 180,
    backgroundColor: "#DC2626", 
    borderBottomLeftRadius: 250,
    borderBottomRightRadius: 250,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 20,
    transform: [{ scaleX: 1.5 }],
    marginBottom: -60,
    zIndex: 0,
  },
  // Icon Circle (Floating)
  iconCircle: {
    width: 90,
    height: 90,
    backgroundColor: "#FFF",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    transform: [{ scaleX: 0.67 }], // Revert scaling
    position: "absolute",
    bottom: -40, // Float above card
  },
  // White Card
  card: {
    // backgroundColor: "#FFF",
    borderRadius: 24,
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: "center",
    // elevation: 5,
    // shadowColor: "#000",
    // shadowOpacity: 0.1,
    // shadowRadius: 10,
    // shadowOffset: { width: 0, height: 5 },
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937", // Dark gray
    marginTop: 20, // Space for icon
  },
  subMessage: {
    fontSize: 14,
    color: "#EF4444", // Red text
    marginTop: 5,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 13,
    color: "#9CA3AF", // Light gray
    marginTop: 5,
    marginBottom: 30,
    fontWeight: "500",
  },
  // Info Rows
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  label: {
    fontSize: 15,
    color: "#6B7280", // Gray Label
    fontWeight: "600",
  },
  value: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  valueBold: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  amountValue: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "900",
    // fontStyle: "italic", // Match design style
  },
  errorText: {
    fontSize: 15,
    color: "#DC2626", // Red error text
    fontWeight: "700",
    maxWidth: "60%",
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6", // Very light gray divider
    width: "100%",
  },
  // Retry Button
  retryButton: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
    backgroundColor: "#DC2626", // Red button
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
});