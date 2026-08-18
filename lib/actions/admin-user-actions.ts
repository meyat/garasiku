"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient, createClient } from "@/lib/supabase/server";

function generateTempPassword(): string {
  // 12 random alphanumeric chars — shown once to the admin to hand off manually.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createUserByAdmin(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") || "").trim();
  const role = String(formData.get("role") || "user");

  if (!email || !fullName) {
    redirect("/admin/users?error=Email dan nama wajib diisi");
  }

  const tempPassword = generateTempPassword();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true, // skip email confirmation entirely — you're vouching for this user
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    redirect(`/admin/users?error=${encodeURIComponent(error?.message ?? "Gagal membuat user")}`);
  }

  // The handle_new_user() trigger already creates the profiles row; just set the role
  // if something other than the default 'user' was requested.
  if (role === "admin") {
    const supabase = createClient();
    await supabase.from("profiles").update({ role: "admin" }).eq("id", data.user!.id);
  }

  // Password shown once via query param so the admin can copy it to give to the user —
  // it is NOT stored anywhere and cannot be retrieved again after this redirect.
  redirect(`/admin/users?created=${encodeURIComponent(email)}&tempPassword=${encodeURIComponent(tempPassword)}`);
}

export async function setUserRole(userId: string, role: "user" | "admin") {
  await requireAdmin();
  const supabase = createClient();
  await supabase.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/admin/users");
}

export async function deleteUserByAdmin(userId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/admin/users");
}
