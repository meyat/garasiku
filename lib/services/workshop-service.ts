import { createClient } from "@/lib/supabase/server";

export interface WorkshopRow {
  id: string;
  owner_id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export async function getUserWorkshops(): Promise<(WorkshopRow & { role: string })[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("workshop_members")
    .select("role, workshops(id, owner_id, name, address, phone)")
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => ({ ...row.workshops, role: row.role }));
}

export async function getWorkshopById(id: string): Promise<WorkshopRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("workshops").select("*").eq("id", id).single();
  if (error) return null;
  return data as WorkshopRow;
}
