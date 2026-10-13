import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

const MAX_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12000;

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "127.0.0.1" || host.startsWith("127.")) return true;
  if (host === "::1" || host === "[::1]") return true;
  if (host.startsWith("10.")) return true;
  if (host.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (host.endsWith(".local")) return true;
  return false;
}

function isAllowedImageUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return false;
  if (isPrivateHost(parsed.hostname)) return false;
  return true;
}

export async function GET(request) {
  const supabase = await createClient();
  const { user } = await getCurrentUser(supabase);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl || !isAllowedImageUrl(rawUrl)) {
    return NextResponse.json({ error: "Geçersiz görsel URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(rawUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "website-crm2-image-proxy/1.0",
      },
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Görsel alınamadı" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Dosya bir görsel değil" }, { status: 400 });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: "Boş görsel" }, { status: 400 });
    }
    if (buffer.length > MAX_BYTES) {
      return NextResponse.json({ error: "Görsel çok büyük" }, { status: 413 });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Görsel alınamadı" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
