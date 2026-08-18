import { createBrowserClient } from "@supabase/ssr";

/**
 * NOTE: Not using the `Database` generic here yet. Supabase's generated types (via
 * `supabase gen types typescript`) produce a concrete Tables map that plays well with
 * strict mode; our hand-written placeholder in types/database.ts does not, because
 * index-signature-based Table maps resolve Insert/Update to `never` in strict TS.
 * Once real types are generated, swap to `createBrowserClient<Database>(...)`.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
