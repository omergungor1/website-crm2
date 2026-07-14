/**
 * Deep Work Board şemasını uygulama Supabase DB'sine uygular.
 * Kullanım: node --env-file=.env.local scripts/apply-deep-work-schema.js
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "deep-work-board-migration.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Prefer exec_sql RPC if available; otherwise print instructions
  const { error } = await supabase.rpc("exec_sql", { query: sql }).maybeSingle?.() 
    ?? await supabase.rpc("exec_sql", { query: sql });

  if (error) {
    console.error("RPC exec_sql çalışmadı (beklenen). SQL dosyasını SQL Editor'da çalıştırın:");
    console.error(sqlPath);
    console.error(error.message);
    process.exit(2);
  }

  console.log("Migration uygulandı.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
