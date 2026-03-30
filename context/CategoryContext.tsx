import AsyncStorage from "@react-native-async-storage/async-storage";
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

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
  isCustom?: boolean;
  color?: string;
}

// ★★★ 修改處：新增 "收款" 類別 ★★★
const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "食物", icon: "fast-food-outline", type: "Ionicons" },
  { id: "2", name: "購物", icon: "shopping-bag", type: "Feather" },
  { id: "3", name: "運輸", icon: "bicycle-outline", type: "Ionicons" },
  { id: "4", name: "收款", icon: "cash-outline", type: "Ionicons" }, // 新增這行
];

interface CategoryContextType {
  categories: Category[];
  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  resetCategories: () => Promise<void>;
  categoryTheme: {
    itemBg: string;
    selectedBg: string;
    text: string;
    unselectedIcon: string;
  };
}

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined
);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // ★ 1. 分類項目專屬的主題配色
  const categoryTheme = useMemo(
    () => ({
      itemBg: isDark ? "#1E1E1E" : "#F7F8FA",
      selectedBg: "#2962FF",
      text: isDark ? "#FFFFFF" : "#333333",
      unselectedIcon: isDark ? "#AAAAAA" : "#555555",
    }),
    [isDark]
  );

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const stored = await AsyncStorage.getItem("custom_categories");
      if (stored) {
        const customCategories = JSON.parse(stored);
        // 這邊會將預設類別 (包含新的收款) 與使用者自訂的類別合併
        setCategories([...DEFAULT_CATEGORIES, ...customCategories]);
      } else {
        // 如果沒有儲存的資料，直接使用最新的預設值
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const saveCustomOnly = async (allCategories: Category[]) => {
    const customOnly = allCategories.filter((c) => c.isCustom);
    await AsyncStorage.setItem("custom_categories", JSON.stringify(customOnly));
  };

  // ★ 2. 使用 useCallback 優化操作函式
  const addCategory = useCallback(async (newCat: Omit<Category, "id">) => {
    const categoryToAdd: Category = {
      ...newCat,
      id: Date.now().toString(),
      isCustom: true,
    };

    setCategories((prev) => {
      const next = [...prev, categoryToAdd];
      saveCustomOnly(next);
      return next;
    });
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    setCategories((prev) => {
      // 確保不刪除預設類別
      const next = prev.filter((c) => c.id !== id || !c.isCustom);
      saveCustomOnly(next);
      return next;
    });
  }, []);

  const resetCategories = useCallback(async () => {
    await AsyncStorage.removeItem("custom_categories");
    setCategories(DEFAULT_CATEGORIES);
  }, []);

  // ★ 3. 使用 useMemo 封裝 Value
  const value = useMemo(
    () => ({
      categories,
      addCategory,
      deleteCategory,
      resetCategories,
      categoryTheme,
    }),
    [categories, addCategory, deleteCategory, resetCategories, categoryTheme]
  );

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategory must be used within a CategoryProvider");
  }
  return context;
}