"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BrandKitSection from "@/components/project/media-studio/BrandKitSection";

function ExpandIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}

export default function SettingsTab({
  projectId,
  initialProjectName = "",
  initialProjectDescription = "",
  initialLogoUrl = "",
  initialIsArchived = false,
  initialAdminNote = "",
  initialProjectType = "landing_page",
}) {
  const router = useRouter();
  const logoInputRef = useRef(null);
  const [form, setForm] = useState({
    supabase_account: "",
    note: initialAdminNote || "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [projectName, setProjectName] = useState(initialProjectName);
  const [savedProjectName, setSavedProjectName] = useState(initialProjectName);
  const [projectDescription, setProjectDescription] = useState(initialProjectDescription || "");
  const [savedProjectDescription, setSavedProjectDescription] = useState(initialProjectDescription || "");
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl || "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoRemoving, setLogoRemoving] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");
  const [descExpanded, setDescExpanded] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState("");
  const [projectType, setProjectType] = useState(initialProjectType);
  const [savedProjectType, setSavedProjectType] = useState(initialProjectType);
  const [typeSaving, setTypeSaving] = useState(false);
  const [typeMsg, setTypeMsg] = useState("");
  const [isArchived, setIsArchived] = useState(initialIsArchived);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    fetch(`/api/settings/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          supabase_account: d.supabase_account || "",
          note: initialAdminNote || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId, initialAdminNote]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const [settingsRes, projectRes] = await Promise.all([
      fetch(`/api/settings/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabase_account: form.supabase_account }),
      }),
      fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_note: form.note.trim() || null }),
      }),
    ]);
    setSaving(false);
    if (settingsRes.ok && projectRes.ok) {
      setMsg("Kaydedildi!");
      router.refresh();
      setTimeout(() => setMsg(""), 3000);
    } else {
      setMsg("Hata oluştu");
    }
  }

  async function handleProjectInfoSave(e) {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      setNameMsg("Proje adı boş olamaz");
      return;
    }

    const desc = projectDescription.trim();
    const unchanged = trimmed === savedProjectName && desc === savedProjectDescription;
    if (unchanged) return;

    setNameSaving(true);
    setNameMsg("");
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, description: desc || null }),
    });
    const data = await res.json();
    setNameSaving(false);
    if (res.ok) {
      setProjectName(trimmed);
      setSavedProjectName(trimmed);
      setProjectDescription(desc);
      setSavedProjectDescription(desc);
      setNameMsg("Proje bilgileri güncellendi");
      router.refresh();
      setTimeout(() => setNameMsg(""), 3000);
    } else {
      setNameMsg(data.error || "Hata oluştu");
    }
  }

  async function handleTypeSave(e) {
    e.preventDefault();
    setTypeSaving(true);
    setTypeMsg("");
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: projectType }),
    });
    const data = await res.json();
    setTypeSaving(false);
    if (res.ok) {
      setSavedProjectType(projectType);
      setTypeMsg("Proje türü güncellendi");
      router.refresh();
      setTimeout(() => setTypeMsg(""), 3000);
    } else {
      setTypeMsg(data.error || "Hata oluştu");
    }
  }

  async function handleLogoUpload(file) {
    if (!file || logoUploading) return;
    setLogoUploading(true);
    setLogoMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/projects/${projectId}/logo`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setLogoMsg(data.error || "Logo yüklenemedi");
        return;
      }
      setLogoUrl(data.url || "");
      setLogoMsg("Logo güncellendi");
      router.refresh();
      setTimeout(() => setLogoMsg(""), 3000);
    } catch {
      setLogoMsg("Logo yüklenemedi");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  }

  async function handleLogoRemove() {
    if (!logoUrl || logoRemoving) return;
    setLogoRemoving(true);
    setLogoMsg("");
    try {
      const res = await fetch(`/api/projects/${projectId}/logo`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setLogoMsg(data.error || "Logo kaldırılamadı");
        return;
      }
      setLogoUrl("");
      setLogoMsg("Logo kaldırıldı");
      router.refresh();
      setTimeout(() => setLogoMsg(""), 3000);
    } catch {
      setLogoMsg("Logo kaldırılamadı");
    } finally {
      setLogoRemoving(false);
    }
  }

  async function handleArchiveToggle() {
    setArchiveLoading(true);
    setArchiveError("");
    const nextArchived = !isArchived;
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: nextArchived }),
    });
    const data = await res.json();
    setArchiveLoading(false);
    setConfirmArchive(false);

    if (!res.ok) {
      setArchiveError(data.error || "İşlem başarısız");
      return;
    }

    setIsArchived(nextArchived);
    if (nextArchived) {
      router.push("/dashboard");
    } else {
      router.refresh();
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  if (loading) return <div className="py-8 text-center text-sm text-zinc-400">Yükleniyor…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Site Ayarları</h2>
        <p className="text-sm text-zinc-500">
          Proje bilgilerini, türünü ve veritabanı detaylarını buradan yönetebilirsiniz.
        </p>
      </div>

      <form
        onSubmit={handleProjectInfoSave}
        className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Proje Bilgileri</h3>

          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Logo</label>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800/60">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Proje logosu" className="h-full w-full object-contain p-1.5" />
                ) : (
                  <span className="px-2 text-center text-[11px] leading-tight text-zinc-400">Logo yok</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  className="hidden"
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={logoUploading || logoRemoving}
                    onClick={() => logoInputRef.current?.click()}
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    {logoUploading ? "Yükleniyor…" : logoUrl ? "Değiştir" : "Logo yükle"}
                  </button>
                  {logoUrl ? (
                    <button
                      type="button"
                      disabled={logoUploading || logoRemoving}
                      onClick={handleLogoRemove}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:hover:bg-rose-950/40"
                    >
                      {logoRemoving ? "Kaldırılıyor…" : "Kaldır"}
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-zinc-500">PNG, JPG, WEBP, SVG veya GIF · max 3 MB</p>
                {logoMsg ? (
                  <p
                    className={`text-xs font-medium ${
                      logoMsg.includes("edilmedi") || logoMsg.includes("kaldırılamadı") || logoMsg.includes("Hata")
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {logoMsg}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <label className="mt-4 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ad
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className={inputCls}
            placeholder="Proje adı"
            required
          />
          <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Açıklama
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className={`${inputCls} resize-none pr-10`}
              placeholder="Proje hakkında kısa açıklama"
            />
            <button
              type="button"
              onClick={() => setDescExpanded(true)}
              title="Büyüt"
              aria-label="Açıklama alanını büyüt"
              className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
            >
              <ExpandIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            Dashboard listesinde ve proje özetinde görünür.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {nameMsg && (
            <span
              className={`text-sm font-medium ${nameMsg.includes("Hata") || nameMsg.includes("boş") ? "text-red-600" : "text-emerald-600"}`}
            >
              {nameMsg}
            </span>
          )}
          <button
            type="submit"
            disabled={
              nameSaving ||
              (projectName.trim() === savedProjectName &&
                projectDescription.trim() === savedProjectDescription)
            }
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:ml-auto sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:hover:text-zinc-900"
          >
            {nameSaving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>

      {descExpanded ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-6"
          onClick={() => setDescExpanded(false)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              e.preventDefault();
              setDescExpanded(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Proje açıklaması"
            className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Açıklama düzenle</h3>
                <p className="text-xs text-zinc-500">Uzun metin için geniş alan</p>
              </div>
              <button
                type="button"
                onClick={() => setDescExpanded(false)}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Tamam
              </button>
            </div>
            <div className="min-h-0 flex-1 p-4 sm:p-5">
              <textarea
                autoFocus
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Proje hakkında detaylı açıklama yazın…"
                className="h-[min(62vh,480px)] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      ) : null}

      <BrandKitSection projectId={projectId} projectName={savedProjectName || projectName} />

      <div>
        <form
          onSubmit={handleTypeSave}
          className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Proje Türü</h3>
            <label className="mt-3 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tür
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className={inputCls}
            >
              <option value="landing_page">Landing Page</option>
              <option value="saas">SaaS</option>
              <option value="mobile_app">Mobile App</option>
            </select>
            <p className="mt-1.5 text-xs text-zinc-500">
              Projenin genel kategorisini belirler; dashboard listesinde görünür.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {typeMsg && (
              <span
                className={`text-sm font-medium ${typeMsg.includes("Hata") ? "text-red-600" : "text-emerald-600"}`}
              >
                {typeMsg}
              </span>
            )}
            <button
              type="submit"
              disabled={typeSaving || projectType === savedProjectType}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 sm:ml-auto sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:hover:text-zinc-900"
            >
              {typeSaving ? "Kaydediliyor…" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">DB Detail</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Projenin veritabanı hesabını ve teknik notlarını saklayın.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Supabase Hesap
          </label>
          <input
            type="email"
            value={form.supabase_account}
            onChange={(e) => setForm((p) => ({ ...p, supabase_account: e.target.value }))}
            className={inputCls}
            placeholder="örn: proje@supabase.com"
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Projenin hangi Supabase e-posta hesabında tutulduğunu yazın.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Not
          </label>
          <textarea
            rows={5}
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            className={`${inputCls} resize-none`}
            placeholder="Veritabanı, bağlantı veya kurulumla ilgili notlar…"
          />
        </div>

        <div className="flex items-center gap-3">
          {msg && (
            <span
              className={`text-sm font-medium ${msg.startsWith("Hata") ? "text-red-600" : "text-emerald-600"}`}
            >
              {msg}
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:hover:text-zinc-900"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>

      {confirmArchive && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !archiveLoading && setConfirmArchive(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {isArchived ? "Arşivden çıkar" : "Projeyi arşivle"}
            </h3>
            <p className="mt-2 text-sm text-zinc-500">
              {isArchived
                ? "Proje tekrar ana listeye eklenecek. Devam etmek istiyor musunuz?"
                : "Proje ana listeden kaldırılacak ancak silinmeyecek. Devam etmek istiyor musunuz?"}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmArchive(false)}
                disabled={archiveLoading}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleArchiveToggle}
                disabled={archiveLoading}
                className={`flex-1 rounded-lg py-2 text-sm font-medium text-white disabled:opacity-60 ${isArchived
                    ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:hover:text-zinc-900"
                    : "bg-amber-600 hover:bg-amber-700"
                  }`}
              >
                {archiveLoading ? "İşleniyor…" : isArchived ? "Geri al" : "Arşivle"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Arşiv</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {isArchived
              ? "Bu proje arşivde. Ana listede görünmez; arşiv sayfasından erişilebilir."
              : "Projeyi arşivlerseniz ana listeden kaldırılır. Veriler silinmez, arşivden geri alabilirsiniz."}
          </p>
          {isArchived && (
            <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Arşivlenmiş
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setConfirmArchive(true)}
          disabled={archiveLoading}
          className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 sm:w-auto sm:self-end ${isArchived
              ? "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              : "border-amber-200 text-amber-800 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/40"
            }`}
        >
          {isArchived ? "Arşivden çıkar" : "Arşivle"}
        </button>
        {archiveError && (
          <p className="text-sm text-red-600">{archiveError}</p>
        )}
      </div>
    </div>
  );
}
