import { useUser } from "@/context/UserContext"; // ★ 引入 UserContext 取得 userId
import { supabase } from "@/lib/supabase"; // ★ 引入 supabase
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

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface CardData {
  id: string;
  user_id: string; // 對應 Supabase profiles.id
  cardNumber: string;
  expiry: string;
  cvv: string;
  totalLimit: number;
  availableBalance: number;
  carrier: string;
  name: string;
  backgroundColor: string;
  type: string;
  isEnabled: boolean;
  isLimitAlertEnabled: boolean;
  isNfcEnabled: boolean;
  transactions: Transaction[];
}

interface CardContextType {
  cards: CardData[];
  loading: boolean;
  addCard: (
    card: Omit<
      CardData,
      | "id"
      | "user_id"
      | "transactions"
      | "availableBalance"
      | "isEnabled"
      | "isLimitAlertEnabled"
      | "isNfcEnabled"
    >
  ) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  updateCard: (id: string, updates: Partial<CardData>) => Promise<void>;
  addTransaction: (
    cardId: string,
    transaction: Omit<Transaction, "id">
  ) => Promise<void>;
  cardColors: {
    overlay: string;
    shadow: string;
    text: string;
  };
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export function CardProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useUser(); // ★ 取得當前登入者資訊
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const cardColors = useMemo(
    () => ({
      overlay: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.1)",
      shadow: isDark ? "#000000" : "#888888",
      text: "#FFFFFF",
    }),
    [isDark]
  );

  // ★ 從雲端載入卡片與其交易紀錄
  const loadCards = useCallback(async () => {
    if (!userInfo?.id) return;
    setLoading(true);

    try {
      // 一次抓取卡片以及關聯的交易紀錄
      const { data, error } = await supabase
        .from("cards")
        .select(
          `
          *,
          transactions ( * )
        `
        )
        .eq("user_id", userInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // 格式化資料以符合前端介面 (Supabase 使用 snake_case, 我們前端用 camelCase)
        // ★★★ 修正處：明確指定 formattedCards 的型別為 CardData[] ★★★
        const formattedCards: CardData[] = data.map((card: any) => ({
          id: card.id,
          user_id: card.user_id,
          cardNumber: card.card_number,
          expiry: card.expiry,
          cvv: card.cvv,
          totalLimit: Number(card.total_limit),
          availableBalance: Number(card.available_balance),
          carrier: card.carrier || "", // 確保 carrier 有預設值
          name: card.name,
          backgroundColor: card.background_color,
          type: card.type,
          isEnabled: card.is_enabled,
          isLimitAlertEnabled: card.is_limit_alert_enabled,
          isNfcEnabled: card.is_nfc_enabled,
          // ★★★ 修正處：強制轉型 transactions 為 Transaction[] ★★★
          transactions: ((card.transactions || []) as any[]).sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          ) as Transaction[],
        }));
        setCards(formattedCards);
      }
    } catch (e) {
      console.error("Load cards error:", e);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  // ★ 雲端新增卡片
  const addCard = useCallback(
    async (cardInput: any) => {
      if (!userInfo?.id) return;

      try {
        const { error } = await supabase.from("cards").insert([
          {
            user_id: userInfo.id,
            card_number: cardInput.cardNumber,
            expiry: cardInput.expiry,
            cvv: cardInput.cvv,
            total_limit: cardInput.totalLimit,
            available_balance: cardInput.totalLimit, // 初始餘額 = 總額度
            name: cardInput.name,
            background_color: cardInput.backgroundColor,
            type: cardInput.type,
          },
        ]);

        if (error) throw error;
        await loadCards(); // 重新整理清單
      } catch (e) {
        console.error("Add card error:", e);
        throw e;
      }
    },
    [userInfo?.id, loadCards]
  );

  const deleteCard = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("cards").delete().eq("id", id);
      if (error) throw error;
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("Delete card error:", e);
    }
  }, []);

  const updateCard = useCallback(
    async (id: string, updates: Partial<CardData>) => {
      try {
        // 將 camelCase 轉回 snake_case 供 Supabase 使用 (視需要擴充)
        const { error } = await supabase
          .from("cards")
          .update({
            is_enabled: updates.isEnabled,
            name: updates.name,
          })
          .eq("id", id);

        if (error) throw error;
        await loadCards();
      } catch (e) {
        console.error("Update card error:", e);
      }
    },
    [loadCards]
  );

  // ★ 核心交易邏輯：寫入交易紀錄並更新餘額
  const addTransaction = useCallback(
    async (cardId: string, transaction: Omit<Transaction, "id">) => {
      if (!userInfo?.id) return;

      try {
        const amount = Number(transaction.amount);

        // 1. 取得最新卡片餘額
        const { data: cardData } = await supabase
          .from("cards")
          .select("available_balance")
          .eq("id", cardId)
          .single();

        const newBalance = (cardData?.available_balance || 0) - amount;

        // 2. 同步更新：新增交易紀錄 + 更新卡片可用餘額
        const { error: txError } = await supabase.from("transactions").insert([
          {
            card_id: cardId,
            user_id: userInfo.id,
            description: transaction.description,
            amount: amount,
            date: new Date().toISOString(),
          },
        ]);

        if (txError) throw txError;

        const { error: cardError } = await supabase
          .from("cards")
          .update({ available_balance: newBalance })
          .eq("id", cardId);

        if (cardError) throw cardError;

        await loadCards(); // 刷新本地狀態
      } catch (e) {
        console.error("Transaction error:", e);
        throw e;
      }
    },
    [userInfo?.id, loadCards]
  );

  const value = useMemo(
    () => ({
      cards,
      loading,
      addCard,
      deleteCard,
      updateCard,
      addTransaction,
      cardColors,
    }),
    [
      cards,
      loading,
      addCard,
      deleteCard,
      updateCard,
      addTransaction,
      cardColors,
    ]
  );

  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

export function useCards() {
  const context = useContext(CardContext);
  if (!context) throw new Error("useCards must be used within a CardProvider");
  return context;
}
