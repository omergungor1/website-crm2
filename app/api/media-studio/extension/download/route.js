import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import path from "path";
import fs from "fs/promises";
import { spawnSync } from "child_process";

export async function GET() {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const extDir = path.join(process.cwd(), "extensions", "media-studio");
  const tmpDir = path.join(process.cwd(), ".tmp", `media-studio-ext-${Date.now()}`);
  const zipPath = `${tmpDir}.zip`;

  try {
    await fs.mkdir(tmpDir, { recursive: true });
    const entries = await fs.readdir(extDir);
    for (const name of entries) {
      if (name === "config.example.js") continue;
      const src = path.join(extDir, name);
      const dest = path.join(tmpDir, name);
      const stat = await fs.stat(src);
      if (stat.isDirectory()) continue;
      let content = await fs.readFile(src, "utf8");
      if (name === "config.js") {
        content = `export const APP_ORIGIN = ${JSON.stringify(process.env.NEXT_PUBLIC_APP_URL || "")};
export const SUPABASE_URL = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL || "")};
export const SUPABASE_ANON_KEY = ${JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")};
`;
      }
      await fs.writeFile(dest, content, "utf8");
    }

    const zip = spawnSync("zip", ["-r", zipPath, "."], { cwd: tmpDir });
    if (zip.status !== 0) {
      // fallback: tar.gz
      const tarPath = `${tmpDir}.tar.gz`;
      const tar = spawnSync("tar", ["-czf", tarPath, "-C", tmpDir, "."]);
      if (tar.status !== 0) {
        throw new Error("Arşiv oluşturulamadı (zip/tar yok)");
      }
      const buf = await fs.readFile(tarPath);
      await fs.rm(tmpDir, { recursive: true, force: true });
      await fs.rm(tarPath, { force: true });
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/gzip",
          "Content-Disposition": 'attachment; filename="media-studio-extension.tar.gz"',
        },
      });
    }

    const buf = await fs.readFile(zipPath);
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.rm(zipPath, { force: true });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="media-studio-extension.zip"',
      },
    });
  } catch (err) {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(zipPath, { force: true }).catch(() => {});
    return NextResponse.json({ error: err?.message || "İndirme başarısız" }, { status: 500 });
  }
}
