import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";

export async function GET(request) {
  const supabase = await createClient();
  const { user, admin } = await getCurrentUser(supabase);

  if (!user || !admin) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD

  const [
    { count: total },
    { count: positive },
    { count: negative },
    { count: callback },
  ] = await Promise.all([
    supabase.from("crm_customers").select("*", { count: "exact", head: true }),
    supabase.from("crm_customers").select("*", { count: "exact", head: true }).eq("status", "positive"),
    supabase.from("crm_customers").select("*", { count: "exact", head: true }).eq("status", "negative"),
    supabase.from("crm_customers").select("*", { count: "exact", head: true }).eq("status", "callback"),
  ]);

  let callbackToday = callback ?? 0;
  if (date) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const { count } = await supabase
      .from("crm_customers")
      .select("*", { count: "exact", head: true })
      .gte("callback_date", date)
      .lt("callback_date", nextDay.toISOString().slice(0, 10));
    callbackToday = count ?? 0;
  }

  return NextResponse.json({
    total: total ?? 0,
    positive: positive ?? 0,
    negative: negative ?? 0,
    callback: callback ?? 0,
    callbackToday,
    date,
  });
}
