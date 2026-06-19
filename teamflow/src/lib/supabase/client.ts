import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

// Client Supabase pour Client Components ('use client').
// Frontière de données (AR10) : instanciation centralisée ici uniquement.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
