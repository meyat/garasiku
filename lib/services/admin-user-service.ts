import "server-only";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export interface UserWithRole {
  id: string;
  email: string | undefined;
  full_name: string | null;
  role: string;
  created_at: string;
}

export async function getAllUsers(): Promise<UserWithRole[]> {
  const admin = createAdminClient();
  const supabase = createClient();

  const { data: authData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const { data: profiles } = await supabase.from("profiles").select("id, full_name, role");

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return (authData?.users ?? [])
    .map((u: any) => ({
      id: u.id,
      email: u.email,
      full_name: profileMap.get(u.id)?.full_name ?? null,
      role: profileMap.get(u.id)?.role ?? "user",
      created_at: u.created_at,
    }))
    .sort((a: UserWithRole, b: UserWithRole) => a.created_at.localeCompare(b.created_at));
}
