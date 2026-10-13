import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { createZip } from "@/lib/mediaStudio/zip";
import path from "path";
import fs from "fs/promises";

const ROOT_FOLDER = "media-studio-extension";

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  const extDir = path.join(process.cwd(), "extensions", "media-studio");

  try {
    const entries = await fs.readdir(extDir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      if (!entry.isFile() || entry.name === "config.example.js") continue;
      let data = await fs.readFile(path.join(extDir, entry.name));

      if (entry.name === "manifest.json" && appUrl) {
        const manifest = JSON.parse(data.toString("utf8"));
        const hosts = new Set(manifest.host_permissions || []);
        hosts.add(`${new URL(appUrl).origin}/*`);
        manifest.host_permissions = [...hosts];
        data = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
      }

      if (entry.name === "config.js") {
        data = Buffer.from(
          `export const APP_ORIGIN = ${JSON.stringify(appUrl)};
export const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};
export const SUPABASE_ANON_KEY = ${JSON.stringify(anonKey)};
`,
          "utf8"
        );
      }

      files.push({ name: `${ROOT_FOLDER}/${entry.name}`, data });
    }

    if (!files.length) throw new Error("Eklenti dosyaları bulunamadı");

    return new NextResponse(createZip(files), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${ROOT_FOLDER}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err?.message || "İndirme başarısız" }, { status: 500 });
  }
}
