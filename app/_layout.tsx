import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import "react-native-reanimated";

import { BankProvider } from "@/context/BankContext";
import { CardProvider } from "@/context/CardContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { UserProvider, useUser } from "@/context/UserContext";

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const navigationState = useRootNavigationState();
  const { session, loading } = useUser();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!navigationState?.key || loading) {
      return;
    }

    const checkNavigation = async () => {
      try {
        const hasSetupPin = await SecureStore.getItemAsync("hasSetupPin");
        // 判斷當前是否在認證頁面 (登入或註冊)
        const inAuthGroup = segments[0] === "register" || segments[0] === "login";

        if (!session) {
          // --- 情境 A: 沒有登入 ---
          // 如果不在登入/註冊頁，強制踢回登入頁
          if (!inAuthGroup) {
            router.replace("/login");
          }
        } else {
          // --- 情境 B: 已登入 (session 存在) ---
          
          if (inAuthGroup) {
            // ★★★ 關鍵修改 1：用戶剛完成 "登入" 或 "註冊" 動作 ★★★
            // 因為剛輸入過密碼，不需要再驗證 PIN，直接進去
            if (hasSetupPin === "true") {
              router.replace("/(tabs)"); // 直接進主頁
            } else {
              router.replace("/set-transaction-pin"); // 沒設過 PIN，去設定
            }
          } else if (segments.length === 0) { // 或者是檢查是否在根目錄
             // ★★★ 關鍵修改 2：App 冷啟動 (還沒導航到任何頁面) ★★★
             // 這時候才需要強制 PIN 碼驗證
             if (hasSetupPin === "true") {
                router.replace("/pin-login");
             } else {
                router.replace("/set-transaction-pin");
             }
          }
          
          // 如果已經在 (tabs) 或其他頁面，就不做任何事，避免無限迴圈
        }
      } catch (e) {
        console.error("Navigation guard error:", e);
        // router.replace("/login"); // 出錯時暫時不強制登出，避免閃退
      } finally {
        // 隱藏 Splash Screen
        if (!isReady) {
          setIsReady(true);
          setTimeout(async () => {
            await SplashScreen.hideAsync();
          }, 300);
        }
      }
    };

    checkNavigation();
    // ★★★ 依賴加入 segments，這樣當路由改變時也會重新檢查
  }, [navigationState?.key, session, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="set-transaction-pin" />
      <Stack.Screen name="biometric-auth" />
      <Stack.Screen name="pin-login" />
      <Stack.Screen name="confirm-payment" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <UserProvider>
      <CardProvider>
        <CategoryProvider>
          <BankProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <NavigationGuard />
              <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            </ThemeProvider>
          </BankProvider>
        </CategoryProvider>
      </CardProvider>
    </UserProvider>
  );
}