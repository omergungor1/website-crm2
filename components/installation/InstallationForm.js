"use client";

import { useState, useRef } from "react";
import WorkingHours from "./WorkingHours";
import ColorPalette from "./ColorPalette";
import LogoSection from "./LogoSection";
import PageSelector from "./PageSelector";
import PromptModal from "./PromptModal";
import { createClient } from "@/lib/supabase/client";

const BRAND_TONES = [
  { value: "formal", label: "Resmi" },
  { value: "friendly", label: "Samimi" },
  { value: "young", label: "Genç" },
  { value: "premium", label: "Premium" },
];
const SIMILARITY_LEVELS = [
  { value: "low", label: "Az" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Çok" },
];
const MAIN_GOALS = [
  { value: "search", label: "Arama (SEO)" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "reservation", label: "Rezervasyon" },
  { value: "order", label: "Sipariş" },
];

function formatPhone(raw, type) {
  const digits = raw.replace(/\D/g, "");
  if (type === "mobile") {
    if (digits.length === 0) return "";
    const d = digits.startsWith("0") ? digits : "0" + digits;
    const t = d.slice(0, 11);
    let result = "";
    if (t.length <= 4) result = t;
    else if (t.length <= 7) result = `${t.slice(0, 4)} ${t.slice(4)}`;
    else if (t.length <= 9) result = `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7)}`;
    else result = `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 9)} ${t.slice(9)}`;
    return result;
  } else {
    const d = digits.startsWith("0") ? digits : "0" + digits;
    const t = d.slice(0, 11);
    let result = "";
    if (t.length <= 4) result = t;
    else if (t.length <= 7) result = `${t.slice(0, 4)} ${t.slice(4)}`;
    else if (t.length <= 10) result = `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7)}`;
    else result = `${t.slice(0, 4)} ${t.slice(4, 7)} ${t.slice(7, 10)} ${t.slice(10)}`;
    return result;
  }
}

function useFieldList(initial = []) {
  const [items, setItems] = useState(initial);
  const [input, setInput] = useState("");
  const add = () => {
    if (!input.trim()) return;
    setItems((p) => [...p, input.trim()]);
    setInput("");
  };
  const remove = (i) => setItems((p) => p.filter((_, idx) => idx !== i));
  return { items, setItems, input, setInput, add, remove };
}

export default function InstallationForm({
  initialData,
  projectId,
  isAdmin,
  onSave,
  apiUrl,
  method = "PUT",
  isPublic = false,
}) {
  const supabase = createClient();
  const [form, setForm] = useState({
    business_name: initialData?.business_name || "",
    contact_phone: initialData?.contact_phone || "",
    contact_phone_has_whatsapp: initialData?.contact_phone_has_whatsapp || false,
    landline_phone: initialData?.landline_phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    google_maps_link: initialData?.google_maps_link || "",
    sector: initialData?.sector || "",
    logo_url: initialData?.logo_url || "",
    about_text: initialData?.about_text || "",
    about_generate: initialData?.about_generate || false,
    slogan: initialData?.slogan || "",
    brand_tone: initialData?.brand_tone || "",
    competitor_website: initialData?.competitor_website || "",
    similarity_level: initialData?.similarity_level || "",
    main_goal: initialData?.main_goal || "",
    kvkk_required: initialData?.kvkk_required || false,
    privacy_required: initialData?.privacy_required || false,
    authorized_person_phone: initialData?.authorized_person_phone || "",
    color_palette: initialData?.color_palette || null,
    working_hours: initialData?.working_hours || null,
    pages: Array.isArray(initialData?.pages) ? initialData.pages : [],
    social_links: initialData?.social_links || {},
    gallery_images: initialData?.gallery_images || [],
    is_completed: initialData?.is_completed || false,
  });

  const [services, setServices] = useState(
    Array.isArray(initialData?.services) ? initialData.services : []
  );
  const [serviceInput, setServiceInput] = useState({ name: "", description: "" });

  const [regions, setRegions] = useState(
    Array.isArray(initialData?.service_regions) ? initialData.service_regions : []
  );
  const [regionInput, setRegionInput] = useState("");

  const [menuItems, setMenuItems] = useState(
    Array.isArray(initialData?.menu_items) ? initialData.menu_items : []
  );
  const [menuInput, setMenuInput] = useState({ title: "", description: "" });

  const [requestedDomains, setRequestedDomains] = useState(
    Array.isArray(initialData?.requested_domains) ? initialData.requested_domains : []
  );
  const [domainInput, setDomainInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [aiLoading, setAiLoading] = useState({});
  const [confirmModal, setConfirmModal] = useState(false);
  const [promptModal, setPromptModal] = useState(false);
  const [promptText, setPromptText] = useState("");
  const galleryInputRef = useRef(null);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setSocial = (key, val) =>
    setForm((p) => ({ ...p, social_links: { ...p.social_links, [key]: val } }));

  // Telefon formatı
  const isMobile = (phone) => {
    const d = phone.replace(/\D/g, "");
    return d.startsWith("05");
  };

  async function handleSave(markCompleted = false) {
    setSaving(true);
    setSaveMsg("");
    const payload = {
      ...form,
      services,
      service_regions: regions,
      menu_items: menuItems,
      requested_domains: requestedDomains,
      is_completed: markCompleted ? true : form.is_completed,
    };

    const headers = { "Content-Type": "application/json" };
    let url = apiUrl;
    let fetchMethod = method;

    if (isPublic) {
      url = apiUrl;
      fetchMethod = "PUT";
    }

    const res = await fetch(url, {
      method: fetchMethod,
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setSaveMsg("Hata: " + (data.error || "Bilinmeyen hata"));
      return;
    }
    setSaveMsg(markCompleted ? "Gönderildi!" : "Kaydedildi!");
    setTimeout(() => setSaveMsg(""), 3000);
    onSave?.(data);
  }

  async function handleAI(type) {
    setAiLoading((p) => ({ ...p, [type]: true }));
    try {
      const res = await fetch(`/api/ai/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: form.business_name,
          sector: form.sector,
          brand_tone: form.brand_tone,
          main_goal: form.main_goal,
          services,
          service_regions: regions,
          color_palette: form.color_palette,
        }),
      });
      const data = await res.json();
      if (type === "about") set("about_text", data.text || "");
      if (type === "colors") set("color_palette", data.palettes?.[0]?.colors || null);
      if (type === "logo") set("logo_url", data.url || "");
    } finally {
      setAiLoading((p) => ({ ...p, [type]: false }));
    }
  }

  async function handlePrompt() {
    setAiLoading((p) => ({ ...p, prompt: true }));
    try {
      const res = await fetch("/api/ai/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          services,
          service_regions: regions,
          menu_items: menuItems,
          requested_domains: requestedDomains,
        }),
      });
      const data = await res.json();
      setPromptText(data.prompt || "");
      setPromptModal(true);
    } finally {
      setAiLoading((p) => ({ ...p, prompt: false }));
    }
  }

  // Galeri yükleme
  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, 20 - form.gallery_images.length);
    const uploaded = [];
    for (const file of files) {
      if (file.size > 3 * 1024 * 1024) continue;
      const path = `${projectId || "public"}/gallery/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("crm-uploads").upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from("crm-uploads").getPublicUrl(data.path);
        uploaded.push(urlData.publicUrl);
      }
    }
    set("gallery_images", [...form.gallery_images, ...uploaded]);
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || file.size > 3 * 1024 * 1024) return;
    const path = `${projectId || "public"}/logo/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from("crm-uploads").upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from("crm-uploads").getPublicUrl(data.path);
      set("logo_url", urlData.publicUrl);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";
  const labelCls = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const sectionCls = "space-y-4 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="space-y-4">
      {/* ===== TEMEL BİLGİLER ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Temel Bilgiler</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>İşletme Adı</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              className={inputCls}
              placeholder="ABC Çilingir"
            />
          </div>
          <div>
            <label className={labelCls}>Sektör</label>
            <input
              type="text"
              value={form.sector}
              onChange={(e) => set("sector", e.target.value)}
              className={inputCls}
              placeholder="Çilingir, Restoran, Hukuk…"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Cep Telefonu</label>
            <input
              type="tel"
              value={form.contact_phone}
              onChange={(e) =>
                set("contact_phone", formatPhone(e.target.value, "mobile"))
              }
              className={inputCls}
              placeholder="05XX XXX XX XX"
              maxLength={14}
            />
            <label className="mt-1.5 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={form.contact_phone_has_whatsapp}
                onChange={(e) => set("contact_phone_has_whatsapp", e.target.checked)}
                className="rounded"
              />
              WhatsApp butonu siteye eklensin
            </label>
          </div>
          <div>
            <label className={labelCls}>Sabit Hat (opsiyonel)</label>
            <input
              type="tel"
              value={form.landline_phone}
              onChange={(e) =>
                set("landline_phone", formatPhone(e.target.value, "landline"))
              }
              className={inputCls}
              placeholder="0XXX XXX XX XX"
              maxLength={14}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls}
              placeholder="info@example.com"
            />
          </div>
          <div>
            <label className={labelCls}>Yetkili Telefonu (CRM iç iletişim)</label>
            <input
              type="tel"
              value={form.authorized_person_phone}
              onChange={(e) =>
                set(
                  "authorized_person_phone",
                  formatPhone(e.target.value, isMobile(e.target.value) ? "mobile" : "landline")
                )
              }
              className={inputCls}
              placeholder="05XX XXX XX XX"
              maxLength={14}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Adres</label>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className={`${inputCls} resize-none`}
            placeholder="Mahalle, Sokak, No, İlçe / İl"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Google Maps Linki</label>
            <input
              type="url"
              value={form.google_maps_link}
              onChange={(e) => set("google_maps_link", e.target.value)}
              className={inputCls}
              placeholder="https://maps.google.com/…"
            />
          </div>
          <div>
            <label className={labelCls}>Google İşletme Profil Linki</label>
            <input
              type="url"
              value={form.social_links?.google_business || ""}
              onChange={(e) => setSocial("google_business", e.target.value)}
              className={inputCls}
              placeholder="https://g.page/…"
            />
          </div>
        </div>
      </section>

      {/* ===== ÇALIŞMA SAATLERİ ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Çalışma Saatleri</h3>
        <WorkingHours
          value={form.working_hours}
          onChange={(v) => set("working_hours", v)}
        />
      </section>

      {/* ===== LOGO ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Logo</h3>
        <LogoSection
          logoUrl={form.logo_url}
          sector={form.sector}
          businessName={form.business_name}
          brandTone={form.brand_tone}
          colorPalette={form.color_palette}
          onLogoChange={(url) => set("logo_url", url)}
          onUpload={handleLogoUpload}
          isPublic={isPublic}
        />
      </section>

      {/* ===== GALERİ ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
          Site Görselleri
          <span className="ml-1 text-xs font-normal text-zinc-400">
            (max 20 görsel, 3 MB)
          </span>
        </h3>
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-6 text-center hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"
          onClick={() => galleryInputRef.current?.click()}
        >
          <p className="text-sm text-zinc-500">Görselleri buraya sürükleyin veya tıklayın</p>
          <p className="mt-1 text-xs text-zinc-400">PNG, JPG, WEBP — maks. 3 MB her biri</p>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleGalleryUpload}
          />
        </div>
        {form.gallery_images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {form.gallery_images.map((url, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() =>
                    set("gallery_images", form.gallery_images.filter((_, idx) => idx !== i))
                  }
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== HİZMETLER ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Hizmetler</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={serviceInput.name}
            onChange={(e) => setServiceInput((p) => ({ ...p, name: e.target.value }))}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Hizmet adı"
          />
          <input
            type="text"
            value={serviceInput.description}
            onChange={(e) => setServiceInput((p) => ({ ...p, description: e.target.value }))}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Kısa açıklama (opsiyonel)"
          />
          <button
            onClick={() => {
              if (!serviceInput.name.trim()) return;
              setServices((p) => [...p, { ...serviceInput }]);
              setServiceInput({ name: "", description: "" });
            }}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            + Ekle
          </button>
        </div>
        {services.length > 0 && (
          <ul className="space-y-1.5">
            {services.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
                <span className="text-sm text-zinc-800 dark:text-zinc-200">
                  <strong>{s.name}</strong>
                  {s.description ? ` — ${s.description}` : ""}
                </span>
                <button
                  onClick={() => setServices((p) => p.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== HİZMET BÖLGELERİ ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Hizmet Bölgeleri</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={regionInput}
            onChange={(e) => setRegionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (!regionInput.trim()) return;
                setRegions((p) => [...p, regionInput.trim()]);
                setRegionInput("");
              }
            }}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="İstanbul, Kadıköy…"
          />
          <button
            onClick={() => {
              if (!regionInput.trim()) return;
              setRegions((p) => [...p, regionInput.trim()]);
              setRegionInput("");
            }}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            + Ekle
          </button>
        </div>
        {regions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {regions.map((r, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs dark:border-zinc-700"
              >
                {r}
                <button
                  onClick={() => setRegions((p) => p.filter((_, idx) => idx !== i))}
                  className="text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ===== MENÜ / ÜRÜNLER ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Menü ve Ürünler</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={menuInput.title}
            onChange={(e) => setMenuInput((p) => ({ ...p, title: e.target.value }))}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Başlık"
          />
          <input
            type="text"
            value={menuInput.description}
            onChange={(e) => setMenuInput((p) => ({ ...p, description: e.target.value }))}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Açıklama"
          />
          <button
            onClick={() => {
              if (!menuInput.title.trim()) return;
              setMenuItems((p) => [...p, { ...menuInput }]);
              setMenuInput({ title: "", description: "" });
            }}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            + Ekle
          </button>
        </div>
        {menuItems.length > 0 && (
          <ul className="space-y-1.5">
            {menuItems.map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700">
                <span className="text-sm">
                  <strong className="text-zinc-800 dark:text-zinc-200">{m.title}</strong>
                  {m.description ? (
                    <span className="text-zinc-500"> — {m.description}</span>
                  ) : null}
                </span>
                <button
                  onClick={() => setMenuItems((p) => p.filter((_, idx) => idx !== i))}
                  className="text-xs text-red-500"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ===== SOSYAL MEDYA ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Sosyal Medya</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
            { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
            { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/…" },
            { key: "other", label: "Diğer", placeholder: "https://…" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                type="url"
                value={form.social_links?.[key] || ""}
                onChange={(e) => setSocial(key, e.target.value)}
                className={inputCls}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ===== ALAN ADI TALEPLERI ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">İstenen Domain Adayları</h3>
        <p className="text-xs text-zinc-500">Türkçe karakter kullanmayın (ç, ğ, ı, ö, ş, ü)</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="example.com"
          />
          <button
            onClick={() => {
              if (!domainInput.trim()) return;
              if (/[çğıöşüÇĞİÖŞÜ]/.test(domainInput)) {
                alert("Domain Türkçe karakter içeremez!");
                return;
              }
              setRequestedDomains((p) => [...p, domainInput.trim().toLowerCase()]);
              setDomainInput("");
            }}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            + Domain Ekle
          </button>
        </div>
        {requestedDomains.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {requestedDomains.map((d, i) => (
              <span
                key={i}
                className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 font-mono text-xs dark:border-zinc-700"
              >
                {d}
                <button
                  onClick={() => setRequestedDomains((p) => p.filter((_, idx) => idx !== i))}
                  className="text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ===== RENK PALETİ ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Renk Paleti</h3>
        <ColorPalette
          value={form.color_palette}
          onChange={(v) => set("color_palette", v)}
          sector={form.sector}
          brandTone={form.brand_tone}
          mainGoal={form.main_goal}
        />
      </section>

      {/* ===== MARKA DİLİ & HEDEF ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Marka Kimliği</h3>

        <div>
          <label className={labelCls}>Marka Dili</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {BRAND_TONES.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  form.brand_tone === t.value
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                <input
                  type="radio"
                  name="brand_tone"
                  value={t.value}
                  checked={form.brand_tone === t.value}
                  onChange={() => set("brand_tone", t.value)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Ana Hedef</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {MAIN_GOALS.map((g) => (
              <label
                key={g.value}
                className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  form.main_goal === g.value
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400"
                }`}
              >
                <input
                  type="radio"
                  name="main_goal"
                  value={g.value}
                  checked={form.main_goal === g.value}
                  onChange={() => set("main_goal", g.value)}
                  className="sr-only"
                />
                {g.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Rakip / Referans Site</label>
            <input
              type="url"
              value={form.competitor_website}
              onChange={(e) => set("competitor_website", e.target.value)}
              className={inputCls}
              placeholder="https://rakip.com"
            />
          </div>
          <div>
            <label className={labelCls}>Ne Kadar Benzesin?</label>
            <div className="mt-2 flex gap-2">
              {SIMILARITY_LEVELS.map((s) => (
                <label
                  key={s.value}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    form.similarity_level === s.value
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="similarity_level"
                    value={s.value}
                    checked={form.similarity_level === s.value}
                    onChange={() => set("similarity_level", s.value)}
                    className="sr-only"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HAKKIMIZDA & SLOGAN ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">İçerik</h3>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelCls}>Slogan / Kısa Açıklama</label>
          </div>
          <input
            type="text"
            value={form.slogan}
            onChange={(e) => set("slogan", e.target.value)}
            className={inputCls}
            placeholder="Güvenilir ve hızlı hizmet…"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className={labelCls}>Hakkımızda Metni</label>
            <button
              type="button"
              disabled={aiLoading.about}
              onClick={() => handleAI("about")}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {aiLoading.about ? "Yazılıyor…" : "AI ile Yaz"}
            </button>
          </div>
          <textarea
            rows={5}
            value={form.about_text}
            onChange={(e) => set("about_text", e.target.value)}
            className={`${inputCls} resize-y`}
            placeholder="İşletmenizi kısaca anlatın…"
          />
        </div>
      </section>

      {/* ===== SAYFALAR ===== */}
      <section className={sectionCls}>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Sitede Olacak Sayfalar</h3>
        <PageSelector
          value={form.pages}
          onChange={(v) => set("pages", v)}
        />
        <div className="mt-3 flex gap-2">
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={form.kvkk_required}
              onChange={(e) => set("kvkk_required", e.target.checked)}
              className="rounded"
            />
            KVKK sayfası eklensin
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={form.privacy_required}
              onChange={(e) => set("privacy_required", e.target.checked)}
              className="rounded"
            />
            Gizlilik Sözleşmesi eklensin
          </label>
        </div>
      </section>

      {/* ===== ADMIN: PROMPT BUTONU ===== */}
      {isAdmin && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">AI Proje Prompt&apos;u</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                Bu formu kullanarak AI edit&ouml;r&uuml; için site yapım prompt&apos;u oluşturun.
              </p>
            </div>
            <button
              onClick={handlePrompt}
              disabled={aiLoading.prompt}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {aiLoading.prompt ? "Üretiliyor…" : "Prompt Oluştur"}
            </button>
          </div>
        </div>
      )}

      {/* ===== Kaydet butonları (sticky) ===== */}
      <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-zinc-200 bg-white/95 py-3 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span
              className={`text-sm font-medium ${saveMsg.startsWith("Hata") ? "text-red-600" : "text-emerald-600"}`}
            >
              {saveMsg}
            </span>
          )}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {saving ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              onClick={() => setConfirmModal(true)}
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Kaydet ve Gönder
            </button>
          </div>
        </div>
      </div>

      {/* ===== Kaydet ve Gönder onay modal ===== */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Kurulum Formunu Gönder
            </h3>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Formu kaydedip site yapımına göndermek istediğinize emin misiniz?             Form gönderildikten sonra
              düzenleme kilitlenmez ancak &ldquo;gönderildi&rdquo; olarak işaretlenir.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmModal(false)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium dark:border-zinc-700"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  setConfirmModal(false);
                  await handleSave(true);
                }}
                className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Evet, Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Prompt modal ===== */}
      {promptModal && (
        <PromptModal
          text={promptText}
          onClose={() => setPromptModal(false)}
        />
      )}
    </div>
  );
}
