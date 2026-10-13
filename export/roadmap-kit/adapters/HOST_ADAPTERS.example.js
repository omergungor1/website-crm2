/**
 * Host uygulama adaptör stub'ları.
 * Bu dosyaları hedef projedeki gerçek implementasyonlarla değiştirin
 * veya import path'lerini kendi `@/lib/supabase/*` ve `@/lib/isAdmin` dosyalarınıza yönlendirin.
 *
 * Roadmap API route'ları şu import'ları bekler:
 *   import { createClient } from "@/lib/supabase/server";
 *   import { createAdminClient } from "@/lib/supabase/admin";
 *   import { getCurrentUser } from "@/lib/isAdmin";
 */

// --- Örnek: @/lib/supabase/server.js ---
// import { createServerClient } from "@supabase/ssr";
// import { cookies } from "next/headers";
// export async function createClient() { ... }

// --- Örnek: @/lib/supabase/admin.js ---
// import { createClient } from "@supabase/supabase-js";
// export function createAdminClient() {
//   return createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.SUPABASE_SERVICE_ROLE_KEY,
//     { auth: { persistSession: false } }
//   );
// }

// --- Örnek: @/lib/isAdmin.js ---
// export async function getCurrentUser(supabase) {
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) return { user: null, admin: false };
//   // admin: kendi rol tablonuz / email allowlist
//   return { user, admin: false };
// }

export {};
