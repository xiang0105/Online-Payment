import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  balance: number;
  color: string;
}

interface BankContextType {
  accounts: BankAccount[];
  loading: boolean;
  addAccount: (account: Omit<BankAccount, "id" | "balance">) => Promise<void>;
  updateBalance: (id: string, newBalance: number) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

export function BankProvider({ children }: { children: ReactNode }) {
  const { userInfo } = useUser();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 載入帳戶
  const loadAccounts = useCallback(async () => {
    if (!userInfo?.id) return;
    try {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", userInfo.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setAccounts(
          data.map((item: any) => ({
            id: item.id,
            bankName: item.bank_name,
            bankCode: item.bank_code,
            accountNumber: item.account_number,
            balance: Number(item.balance),
            color: item.color,
          }))
        );
      }
    } catch (e) {
      console.error("Load banks error:", e);
    } finally {
      setLoading(false);
    }
  }, [userInfo?.id]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // 2. 新增帳戶 (預設金額為 0)
  const addAccount = useCallback(
    async (newAccount: Omit<BankAccount, "id" | "balance">) => {
      if (!userInfo?.id) return;
      try {
        const { error } = await supabase.from("bank_accounts").insert([
          {
            user_id: userInfo.id,
            bank_name: newAccount.bankName,
            bank_code: newAccount.bankCode,
            account_number: newAccount.accountNumber,
            balance: 0, // ★ 強制預設為 0
            color: newAccount.color,
          },
        ]);
        if (error) throw error;
        await loadAccounts();
      } catch (e) {
        console.error("Add bank error:", e);
        throw e;
      }
    },
    [userInfo?.id, loadAccounts]
  );

  // 3. 更新金額 (可根據後面去變動)
  const updateBalance = useCallback(
    async (id: string, newBalance: number) => {
      try {
        const { error } = await supabase
          .from("bank_accounts")
          .update({ balance: newBalance })
          .eq("id", id);
        if (error) throw error;
        await loadAccounts();
      } catch (e) {
        console.error("Update balance error:", e);
        throw e;
      }
    },
    [loadAccounts]
  );

  // 4. 刪除帳戶
  const deleteAccount = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Delete bank error:", e);
    }
  }, []);

  return (
    <BankContext.Provider
      value={{ accounts, loading, addAccount, updateBalance, deleteAccount }}
    >
      {children}
    </BankContext.Provider>
  );
}

export const useBank = () => {
  const context = useContext(BankContext);
  if (!context) throw new Error("useBank must be used within BankProvider");
  return context;
};
