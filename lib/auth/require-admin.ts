import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side guard for admin-only pages/actions.
 * RLS is still the real enforcement layer (admin_write policies check is_admin()),
 * but we also gate the UI so non-admins never see admin screens or waste a round-trip.
 */
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return { supabase, user };
}
