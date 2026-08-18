"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = String(formData.get("fullName") || "").trim();
  if (!fullName) {
    redirect("/profile?error=Nama tidak boleh kosong");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user!.id);

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/profile?success=Profil berhasil diperbarui");
}

/**
 * Permanently deletes the current user's account and ALL associated data
 * (vehicles, service records, fuel logs, expenses, everything — enforced by
 * `on delete cascade` foreign keys from profiles down through every owned table).
 * This cannot be undone.
 */
export async function deleteAccount(formData: FormData) {
  const confirmation = String(formData.get("confirmation") || "").trim();
  if (confirmation !== "HAPUS") {
    redirect("/profile/delete-account?error=Ketik HAPUS persis untuk konfirmasi");
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Deleting an auth.users row requires the service role — the anon/session key
  // cannot do this even for your own account, by design.
  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(user!.id);

  if (error) {
    redirect(`/profile/delete-account?error=${encodeURIComponent(error.message)}`);
  }

  // Session cookie is now stale since the user no longer exists — clear it before redirecting.
  await supabase.auth.signOut();
  redirect("/login?error=Akun kamu sudah dihapus permanen. Sampai jumpa!");
}
