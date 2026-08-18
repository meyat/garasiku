import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ExpenseRow {
  id: string;
  vehicle_id: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string | null;
}

export const EXPENSE_CATEGORIES = [
  "fuel", "service", "spare_parts", "tires", "tax",
  "insurance", "parking", "accessories", "wash", "other",
] as const;

export const CATEGORY_LABEL: Record<string, string> = {
  fuel: "Bensin", service: "Servis", spare_parts: "Spare Part", tires: "Ban",
  tax: "Pajak", insurance: "Asuransi", parking: "Parkir", accessories: "Aksesori",
  wash: "Cuci Motor", other: "Lainnya",
};

export async function getExpenses(vehicleId: string): Promise<ExpenseRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .order("expense_date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as ExpenseRow[]) ?? [];
}

export function summarizeByCategory(expenses: ExpenseRow[]) {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount));
  }
  return Array.from(map.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function summarizeThisMonth(expenses: ExpenseRow[]) {
  const now = new Date();
  return expenses
    .filter((e) => {
      const d = new Date(e.expense_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);
}
