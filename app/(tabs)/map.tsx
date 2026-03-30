import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 標準 Google Maps 深色樣式 JSON
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
];

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { isDark, colors } = useUser(); // 🛑 從 Expo 原生 Hook 取得的狀態

  const [region, setRegion] = useState({
    latitude: 25.033,
    longitude: 121.5654,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const getCurrentLocation = useCallback(async (shouldAnimate = false) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("權限不足", "請至設定開啟位置權限以使用地圖功能");
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      if (shouldAnimate && mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      } else {
        setRegion(newRegion);
      }
    } catch (error) {
      console.error("定位失敗:", error);
    }
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        loadingEnabled={true}
        // ✅ 核心設定：Expo 原生切換邏輯
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
        userInterfaceStyle={isDark ? "dark" : "light"}
      />

      {/* 搜尋列 - 背景與文字顏色自動隨系統變動 */}
      <View style={[styles.topContainer, { paddingTop: insets.top + 10 }]}>
        <View
          style={[styles.searchBar, { backgroundColor: colors.cardBackground }]}
        >
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu-outline" size={26} color={colors.text} />
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="搜尋地點"
            placeholderTextColor={colors.subText}
          />
        </View>
      </View>

      {/* 定位按鈕 */}
      <TouchableOpacity
        style={[
          styles.floatingBtn,
          { top: insets.top + 80, backgroundColor: colors.cardBackground },
        ]}
        onPress={() => getCurrentLocation(true)}
      >
        <Ionicons name="locate" size={24} color={colors.primary} />
      </TouchableOpacity>

      {/* 底部卡片 */}
      <View
        style={[
          styles.bottomCard,
          {
            backgroundColor: colors.cardBackground,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
        <View style={styles.cardContent}>
          <View
            style={[
              styles.placeIconContainer,
              { backgroundColor: isDark ? "#2C2C2E" : "#F8F9FA" },
            ]}
          >
            <Ionicons name="location" size={24} color={colors.primary} />
          </View>
          <View style={styles.placeInfo}>
            <Text style={[styles.placeName, { color: colors.text }]}>
              已定位到您的位置
            </Text>
            <Text style={[styles.placeMeta, { color: colors.subText }]}>
              正在搜尋附近熱門地點...
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  topContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInput: { flex: 1, marginHorizontal: 10, fontSize: 16 },
  floatingBtn: {
    position: "absolute",
    right: 15,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    elevation: 5,
    zIndex: 10,
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  cardContent: { flexDirection: "row", alignItems: "center" },
  placeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  placeMeta: { fontSize: 13 },
});
