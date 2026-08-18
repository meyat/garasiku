"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createWorkshop(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!name) redirect("/workshop/new?error=Nama bengkel wajib diisi");

  const { data: workshop, error } = await supabase
    .from("workshops")
    .insert({ owner_id: user!.id, name, address, phone })
    .select("id")
    .single();

  if (error || !workshop) {
    redirect(`/workshop/new?error=${encodeURIComponent(error?.message ?? "Gagal membuat bengkel")}`);
  }

  // Owner is automatically a member with role 'owner'
  await supabase.from("workshop_members").insert({
    workshop_id: workshop!.id,
    user_id: user!.id,
    role: "owner",
  });

  redirect(`/workshop/${workshop!.id}`);
}

export async function addWorkshopStaff(workshopId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "mechanic");

  if (!email) {
    redirect(`/workshop/${workshopId}/staff?error=Isi email staf`);
  }

  // Only the workshop owner can invite staff — enforced again here for a clean error
  // message (RLS on workshop_members also enforces this at the DB layer).
  const { data: workshop } = await supabase
    .from("workshops")
    .select("owner_id")
    .eq("id", workshopId)
    .single();

  if (workshop?.owner_id !== user!.id) {
    redirect(`/workshop/${workshopId}/staff?error=Hanya owner yang bisa menambah staf`);
  }

  // Looking up a user by email requires the service role (not exposed to RLS/anon key).
  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();

  let targetUserId: string | null = null;
  try {
    // list + filter is the portable approach across supabase-js versions for a small user base.
    const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const match = usersPage?.users?.find((u: any) => u.email?.toLowerCase() === email);
    targetUserId = match?.id ?? null;
  } catch {
    redirect(`/workshop/${workshopId}/staff?error=Gagal mencari user. Coba lagi.`);
  }

  if (!targetUserId) {
    redirect(`/workshop/${workshopId}/staff?error=${encodeURIComponent(`Tidak ada akun GarasiKu dengan email ${email}. Minta mereka daftar dulu.`)}`);
  }

  const { error } = await supabase.from("workshop_members").insert({
    workshop_id: workshopId,
    user_id: targetUserId,
    role,
  });

  if (error) {
    redirect(`/workshop/${workshopId}/staff?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/workshop/${workshopId}/staff`);
}

export async function addInventoryItem(workshopId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const sku = String(formData.get("sku") || "").trim() || null;
  const unit = String(formData.get("unit") || "pcs");
  const quantity = Number(formData.get("quantity") || 0);
  const unitCost = Number(formData.get("unitCost") || 0);
  const unitPrice = Number(formData.get("unitPrice") || 0);
  const reorderThreshold = Number(formData.get("reorderThreshold") || 0);

  if (!name) {
    redirect(`/workshop/${workshopId}/inventory?error=Nama barang wajib diisi`);
  }

  const { data: item, error } = await supabase
    .from("inventory_items")
    .insert({
      workshop_id: workshopId, name, sku, unit,
      quantity_on_hand: 0, unit_cost: unitCost, unit_price: unitPrice,
      reorder_threshold: reorderThreshold,
    })
    .select("id")
    .single();

  if (error || !item) {
    redirect(`/workshop/${workshopId}/inventory?error=${encodeURIComponent(error?.message ?? "Gagal menyimpan")}`);
  }

  if (quantity > 0) {
    await supabase.from("inventory_movements").insert({
      item_id: item!.id,
      workshop_id: workshopId,
      change_qty: quantity,
      reason: "purchase",
      note: "Stok awal",
      created_by: user!.id,
    });
  }

  revalidatePath(`/workshop/${workshopId}/inventory`);
}

export async function adjustStock(workshopId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const itemId = String(formData.get("itemId") || "");
  const changeQty = Number(formData.get("changeQty") || 0);
  const reason = String(formData.get("reason") || "adjustment");
  const note = String(formData.get("note") || "") || null;

  if (!itemId || changeQty === 0) {
    redirect(`/workshop/${workshopId}/inventory?error=Isi jumlah perubahan stok`);
  }

  await supabase.from("inventory_movements").insert({
    item_id: itemId, workshop_id: workshopId, change_qty: changeQty,
    reason, note, created_by: user!.id,
  });

  revalidatePath(`/workshop/${workshopId}/inventory`);
}

export async function createInvoice(workshopId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const invoiceNumber = String(formData.get("invoiceNumber") || "").trim();
  const customerName = String(formData.get("customerName") || "").trim() || null;
  const customerPhone = String(formData.get("customerPhone") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  const descriptions = formData.getAll("itemDescription") as string[];
  const quantities = formData.getAll("itemQuantity") as string[];
  const prices = formData.getAll("itemPrice") as string[];

  if (!invoiceNumber || descriptions.length === 0) {
    redirect(`/workshop/${workshopId}/invoices/new?error=Nomor invoice dan minimal 1 item wajib diisi`);
  }

  const items = descriptions
    .map((desc, i) => ({
      description: desc.trim(),
      quantity: Number(quantities[i] || 1),
      unit_price: Number(prices[i] || 0),
    }))
    .filter((it) => it.description.length > 0);

  if (items.length === 0) {
    redirect(`/workshop/${workshopId}/invoices/new?error=Isi minimal 1 item invoice`);
  }

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      workshop_id: workshopId,
      invoice_number: invoiceNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      subtotal,
      tax: 0,
      notes,
      created_by: user!.id,
    })
    .select("id")
    .single();

  if (error || !invoice) {
    redirect(`/workshop/${workshopId}/invoices/new?error=${encodeURIComponent(error?.message ?? "Gagal membuat invoice")}`);
  }

  await supabase.from("invoice_items").insert(
    items.map((it) => ({ invoice_id: invoice!.id, ...it }))
  );

  redirect(`/workshop/${workshopId}/invoices`);
}

export async function markInvoicePaid(invoiceId: string, workshopId: string) {
  const supabase = createClient();
  await supabase.from("invoices").update({ status: "paid" }).eq("id", invoiceId);
  revalidatePath(`/workshop/${workshopId}/invoices`);
}
