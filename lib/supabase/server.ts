import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client bound to the user's session (anon key + cookies).
 * This respects RLS — use this for almost everything.
 *
 * NOTE: Not using the `Database` generic yet — see comment in lib/supabase/client.ts.
 * Once real generated types exist, swap to `createServerClient<Database>(...)`.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component without a writable cookie store — safe to ignore
            // because middleware refreshes the session on every request.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service role key. NEVER import this in client components.
 * Only use inside server-only code (API routes / server actions) for tasks RLS
 * cannot express, e.g. admin master-data management after verifying is_admin().
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must never be called from the browser");
  }
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
