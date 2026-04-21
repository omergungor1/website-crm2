import Link from "next/link";

function CountBadge({ n }) {
  return (
    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {n}
    </span>
  );
}

const cardClass =
  "group flex min-h-[5.5rem] flex-col justify-between gap-2 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-5";

export default function DashboardFeatureGrid({
  admin,
  pendingUpdates,
  pendingInstallations,
  paymentPending,
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {admin && (
        <Link href="/crm" className={cardClass}>
          <div className="flex min-w-0 items-start gap-3 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl dark:bg-zinc-800">
              👥
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Müşteri CRM</p>
              <p className="text-sm text-zinc-500">Müşteri gruplarını yönet, aramaları takip et</p>
            </div>
          </div>
          <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
            →
          </span>
        </Link>
      )}

      <Link href="/dashboard/pending-updates" className={cardClass}>
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl dark:bg-amber-950/50">
            📝
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Güncelleme talepleri</p>
              <CountBadge n={pendingUpdates} />
            </div>
            <p className="text-sm text-zinc-500">Onay bekleyen site güncelleme istekleri</p>
          </div>
        </div>
        <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
          →
        </span>
      </Link>

      <Link href="/dashboard/pending-installations" className={cardClass}>
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-xl dark:bg-sky-950/50">
            📋
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Kurulum formları</p>
              <CountBadge n={pendingInstallations} />
            </div>
            <p className="text-sm text-zinc-500">Tamamlanmamış kurulum formları</p>
          </div>
        </div>
        <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
          →
        </span>
      </Link>

      <Link href="/dashboard/payment-pending" className={cardClass}>
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-xl dark:bg-yellow-950/40">
            💳
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Ödeme beklenen</p>
              <CountBadge n={paymentPending} />
            </div>
            <p className="text-sm text-zinc-500">Ödemesi bekleyen projeler</p>
          </div>
        </div>
        <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
          →
        </span>
      </Link>

      <Link href="/dashboard/copyfast" className={cardClass}>
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xl dark:bg-violet-950/40">
            ⚡
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">CopyFast</p>
            <p className="text-sm text-zinc-500">Görüntüden site prompt üretimi (yakında)</p>
          </div>
        </div>
        <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
          →
        </span>
      </Link>

      <Link href="/dashboard/keyword-explorer" className={cardClass}>
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950/40">
            🔍
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">Keyword Explorer</p>
            <p className="text-sm text-zinc-500">Longtail keyword explorer (yakında)</p>
          </div>
        </div>
        <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
          →
        </span>
      </Link>

      <Link href="/dashboard/logo-generator" className={cardClass}>
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50 text-xl dark:bg-pink-950/40">
            ✨
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">Logo generator</p>
            <p className="text-sm text-zinc-500">Logo üretimi (yakında)</p>
          </div>
        </div>
        <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
          →
        </span>
      </Link>

      <Link href="/dashboard/ai-title-generator" className={cardClass}>
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl dark:bg-indigo-950/40">
            🧠
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">AI Title Generator</p>
            <p className="text-sm text-zinc-500">Başlık önerileri (yakında)</p>
          </div>
        </div>
        <span className="self-end text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 sm:self-center">
          →
        </span>
      </Link>
    </div>
  );
}
