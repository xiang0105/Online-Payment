import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

export interface UserData {
  id: string;
  email: string;
  name: string;
  phone: string;
  address?: string;
  avatar_url?: string;
  balance: number; // 確保有這個欄位
}

interface UserContextType {
  userInfo: UserData | null;
  session: Session | null;
  loading: boolean;
  updateUser: (updates: Partial<UserData>) => Promise<void>;
  logout: () => Promise<void>;
  colors: any;
  isDark: boolean;
  refreshUser: () => Promise<void>; // 新增手動刷新功能
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = useMemo(
    () => ({
      primary: "#2962FF",
      text: isDark ? "#FFFFFF" : "#1A1A1A",
      subText: isDark ? "#A0A0A0" : "#666666",
      background: isDark ? "#121212" : "#F8F9FA",
      cardBackground: isDark ? "#1E1E1E" : "#FFFFFF",
      border: isDark ? "#333333" : "#E8E8E8",
    }),
    [isDark]
  );

  // 1. 初始化檢查登入狀態
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserInfo(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ★★★ 新增：即時監聽餘額變化 (Realtime Subscription) ★★★
  useEffect(() => {
    if (!userInfo?.id) return;

    console.log("開啟即時監聽:", userInfo.id);

    // 建立監聽頻道
    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // 監聽更新事件
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userInfo.id}`, // 只監聽自己的 ID
        },
        (payload) => {
          console.log("收到資料庫更新:", payload.new);
          // 將新的資料合併到現有狀態中
          setUserInfo((prev) =>
            prev ? { ...prev, ...(payload.new as UserData) } : null
          );
        }
      )
      .subscribe();

    // 組件卸載時取消訂閱
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userInfo?.id]); // 當用戶 ID 改變時重新訂閱

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Fetch profile error:", error);
      } else {
        setUserInfo(data);
      }
    } catch (e) {
      console.error("Profile load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = useCallback(
    async (updates: Partial<UserData>) => {
      if (!userInfo?.id) return;

      // 樂觀更新 (先改本地，讓 UI 變快)
      setUserInfo((prev) => (prev ? { ...prev, ...updates } : null));

      try {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", userInfo.id);

        if (error) throw error;
      } catch (e) {
        console.error("Update user error:", e);
        // 如果失敗，最好重新抓取正確資料
        fetchProfile(userInfo.id);
      }
    },
    [userInfo]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync("hasSetupPin");
    setUserInfo(null);
    setSession(null);
  }, []);

  // 手動刷新功能 (備用)
  const refreshUser = useCallback(async () => {
    if (session?.user.id) {
      await fetchProfile(session.user.id);
    }
  }, [session]);

  const value = useMemo(
    () => ({
      userInfo,
      session,
      loading,
      updateUser,
      logout,
      colors,
      isDark,
      refreshUser,
    }),
    [
      userInfo,
      session,
      loading,
      updateUser,
      logout,
      colors,
      isDark,
      refreshUser,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
