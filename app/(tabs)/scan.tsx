import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ScanScreen() {
  const { userInfo, colors } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<"scan" | "code">("scan");
  const [isScanning, setIsScanning] = useState(true);

  // ★ 構造錢包交易用 QR Code 資料
  const qrData = useMemo(() => {
    if (!userInfo) return "";
    return JSON.stringify({
      type: "EasySplit_TRANSFER",
      name: userInfo.name,
      walletId: userInfo.phone || "GP-888888",
      timestamp: Date.now(),
    });
  }, [userInfo]);

  // 掃描線動畫
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(240, { duration: 2500 }),
        withTiming(0, { duration: 2500 })
      ),
      -1,
      false
    );
  }, []);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!permission) return <View style={styles.loadingContainer} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#555" />
        <Text style={styles.permissionText}>
          我們需要相機權限來完成支付與掃描
        </Text>
        <TouchableOpacity
          style={styles.permissionBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permissionBtnText}>開啟權限</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
  if (!isScanning) return;
  setIsScanning(false);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  try {
    const parsedData = JSON.parse(data);

    if (parsedData.type === "EasySplit_TRANSFER" || parsedData.type === "PAYMENT_CODE") {
      
      router.push({
        pathname: "/confirm-payment",
        params: {
          receiver: parsedData.name || "未知對象",
          // ★★★ 新增這行：將錢包ID (手機號) 傳給下一頁 ★★★
          receiverId: parsedData.walletId || "", 
          amount: parsedData.amount || "0",
          type: parsedData.type,
          cardId: parsedData.cardId || "" 
        }
      });

      setTimeout(() => setIsScanning(true), 2000);
      
    } else {
      throw new Error("Invalid Type");
    }
  } catch (e) {
    Alert.alert("無效的條碼", "請掃描 EasySplit 專屬條碼", [
      { text: "確定", onPress: () => setIsScanning(true) },
    ]);
  }
};

  if (!userInfo) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {mode === "scan" ? (
        // ★★★ 修正處：增加外層 View，讓 CameraView 和 Overlay 變成兄弟關係 ★★★
        <View style={{ flex: 1 }}>
          {/* 1. 相機層：放在底層，絕對定位填滿 */}
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />

          {/* 2. UI 遮罩層：放在上層，蓋住相機 */}
          <View style={styles.maskOverlay}>
            <View style={styles.maskTop} />
            <View style={styles.maskCenterRow}>
              <View style={styles.maskSide} />
              <View style={styles.scanBox}>
                <Animated.View style={[styles.scanLine, lineStyle]} />
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </View>
              <View style={styles.maskSide} />
            </View>
            <View style={styles.maskBottom}>
              <Text style={styles.scanHintText}>
                將 QR Code 置於框內，自動掃描支付
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.myCodeContainer}>
          <View style={styles.codeCard}>
            <Text style={styles.myCodeTitle}>EasySplit 收款碼</Text>

            <View style={styles.qrWrapper}>
              <QRCode
                value={qrData}
                size={200}
                color="#000"
                backgroundColor="#fff"
              />
              <View style={styles.qrLogoBox}>
                <Ionicons name="flash" size={24} color="#0052FF" />
              </View>
            </View>

            <Text style={styles.myCodeDesc}>掃描此碼向我支付</Text>

            <View style={styles.userInfoMini}>
              <Image
                source={{
                  uri:
                    userInfo.avatar_url ||
                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                }}
                style={styles.avatarMini}
              />
              <View>
                <Text style={styles.userNameMini}>
                  {userInfo.name || "使用者"}
                </Text>
                <Text style={styles.balanceText}>
                  目前餘額：
                  <Text style={styles.balanceAmount}>
                    ${userInfo.balance.toLocaleString()}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 控制列與切換鈕 (保持在最上層) */}
      <View style={[styles.topControls, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>
          {mode === "scan" ? "掃描支付" : "我的收款碼"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={[styles.bottomTabs, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setMode("scan")}
        >
          <Ionicons
            name="scan-outline"
            size={20}
            color={mode === "scan" ? "#0052FF" : "#666"}
          />
          <Text
            style={[styles.tabText, mode === "scan" && styles.tabTextActive]}
          >
            掃描
          </Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setMode("code")}
        >
          <Ionicons
            name="qr-code-outline"
            size={20}
            color={mode === "code" ? "#0052FF" : "#666"}
          />
          <Text
            style={[styles.tabText, mode === "code" && styles.tabTextActive]}
          >
            收款碼
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingContainer: { flex: 1, backgroundColor: "#000" },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  permissionText: {
    color: "#fff",
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  permissionBtn: {
    backgroundColor: "#0052FF",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  permissionBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  maskOverlay: { flex: 1 },
  maskTop: { flex: 1.2, backgroundColor: "rgba(0,0,0,0.7)" },
  maskCenterRow: { flexDirection: "row", height: 260 },
  maskSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  maskBottom: {
    flex: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    paddingTop: 30,
  },
  scanBox: {
    width: 260,
    height: 260,
    position: "relative",
    overflow: "hidden",
  },
  scanLine: { width: "100%", height: 2, backgroundColor: "#0052FF" },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#0052FF",
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#0052FF",
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#0052FF",
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#0052FF",
    borderBottomRightRadius: 12,
  },
  topControls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  topTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  scanHintText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "500",
  },
  bottomTabs: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: "rgba(26,26,26,0.95)",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tabItem: { alignItems: "center", width: 100, gap: 4 },
  tabText: { color: "#666", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#0052FF" },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#333",
    marginHorizontal: 15,
  },
  myCodeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    paddingHorizontal: 30,
  },
  codeCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 30,
    alignItems: "center",
  },
  myCodeTitle: {
    color: "#1A1A1A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
  },
  qrWrapper: { backgroundColor: "#fff", padding: 10, position: "relative" },
  qrLogoBox: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -18,
    marginTop: -18,
    width: 36,
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  myCodeDesc: { color: "#999", marginTop: 20, fontSize: 13, fontWeight: "500" },
  userInfoMini: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
    width: "100%",
    justifyContent: "center",
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E0E0",
    marginRight: 12,
  },
  userNameMini: { color: "#333", fontSize: 17, fontWeight: "700" },
  balanceText: { color: "#666", fontSize: 13, marginTop: 2 },
  balanceAmount: { color: "#0052FF", fontWeight: "700" },
});
