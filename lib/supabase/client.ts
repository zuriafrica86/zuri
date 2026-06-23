import { createBrowserClient } from "@supabase/ssr";

// Client Supabase utilisable côté navigateur (composants "use client").
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
