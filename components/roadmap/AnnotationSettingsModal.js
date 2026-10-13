"use client";

import { useEffect, useState } from "react";
import { NODE_COLORS } from "@/lib/roadmap/constants";
import {
  NOTE_COLORS,
  clampProgress,
  isLineType,
  getAnnotationTypeDef,
  normalizeLinkUrl,
} from "@/lib/roadmap/annotations";
import { NOTE_MARKDOWN_HINTS } from "@/lib/roadmap/noteMarkdown";
import NoteMarkdownContent from "./NoteMarkdownContent";
import RoadmapDeleteConfirmModal from "./RoadmapDeleteConfirmModal";

function ExpandIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
    </svg>
  );
}

export default function AnnotationSettingsModal({ annotation, onClose, onChange, onDelete }) {
  const [draft, setDraft] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [underlineOpen, setUnderlineOpen] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [noteEditorTab, setNoteEditorTab] = useState("edit");

  // Sadece annotation kimliği değişince formu sıfırla.
  // Her title patch'inde annotation referansı değişir; aksi halde büyütülmüş editör kapanır.
  useEffect(() => {
    if (!annotation) {
      setDraft(null);
      setShowDeleteConfirm(false);
      setUnderlineOpen(false);
      setNoteExpanded(false);
      setNoteEditorTab("edit");
      return;
    }
    setDraft({ ...annotation });
    setShowDeleteConfirm(false);
    setUnderlineOpen(Boolean(annotation.underlineEnabled));
    setNoteExpanded(false);
    setNoteEditorTab("edit");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-init when switching items
  }, [annotation?.id]);

  if (!annotation || !draft) return null;

  const typeDef = getAnnotationTypeDef(draft.type);
  const isLine = isLineType(draft.type);

  function patch(fields) {
    const next = { ...draft, ...fields };
    setDraft(next);
    onChange(annotation.id, fields);
  }

  function handleDeleteConfirm() {
    onDelete(annotation.id);
    setShowDeleteConfirm(false);
  }

  function deleteItemLabel() {
    if (draft.type === "frame") {
      const label = String(draft.title || "").trim();
      return label || "Etiketsiz çerçeve";
    }
    if (isLine) return draft.type === "arrow" ? "Ok" : "Çizgi";
    return draft.title || typeDef.label;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {typeDef.label} Ayarları
          </h2>
          <div className="mt-4 space-y-4">
            {!isLine &&
              draft.type !== "frame" &&
              draft.type !== "checkbox" &&
              draft.type !== "link" &&
              draft.type !== "progress" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  {draft.type === "note" ? "Not (Markdown)" : "Metin"}
                </label>
                <div className="relative">
                  <textarea
                    rows={draft.type === "note" ? 4 : 2}
                    value={draft.title || ""}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder={
                      draft.type === "note"
                        ? "# Başlık\n[] Görev\n- Madde\n> Detay"
                        : draft.type === "heading"
                          ? "Başlık yaz…"
                          : "Metin yaz…"
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-9 text-sm placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                  {draft.type === "note" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setNoteEditorTab("edit");
                        setNoteExpanded(true);
                      }}
                      title="Büyüt"
                      aria-label="Not alanını büyüt"
                      className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
                    >
                      <ExpandIcon className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                {draft.type === "note" ? (
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Markdown destekli · büyütmek için köşe ikonuna tıkla
                  </p>
                ) : null}
              </div>
            )}

            {draft.type === "link" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Görünen metin</label>
                  <input
                    value={draft.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="Bağlantı başlığı"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">URL</label>
                  <input
                    type="url"
                    value={draft.url || ""}
                    onChange={(e) => patch({ url: e.target.value })}
                    onBlur={(e) => {
                      const normalized = normalizeLinkUrl(e.target.value);
                      if (normalized && normalized !== e.target.value) patch({ url: normalized });
                    }}
                    placeholder="https://ornek.com"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <p className="mt-1 text-[11px] text-zinc-400">Tıklanınca yeni sekmede açılır</p>
                </div>
              </>
            )}

            {draft.type === "progress" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Başlık</label>
                  <input
                    value={draft.title || ""}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="Hedef adı"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Açıklama</label>
                  <textarea
                    rows={3}
                    value={draft.description || ""}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="Hedef detayı…"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    İlerleme (%{clampProgress(draft.progress)})
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={clampProgress(draft.progress)}
                    onChange={(e) => patch({ progress: clampProgress(e.target.value) })}
                    className="w-full"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={clampProgress(draft.progress)}
                    onChange={(e) => patch({ progress: clampProgress(e.target.value) })}
                    className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                  />
                </div>
              </>
            )}

            {draft.type === "frame" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Etiket (opsiyonel)</label>
                <input
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Boş bırakılabilir"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            )}

            {draft.type === "checkbox" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Metin</label>
                  <input
                    value={draft.title || ""}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="Görev metni"
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.checked)}
                    onChange={(e) => patch({ checked: e.target.checked })}
                    className="rounded border-zinc-300"
                  />
                  İşaretli
                </label>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">
                    Punto ({draft.fontSize}px)
                  </label>
                  <input
                    type="range"
                    min={12}
                    max={28}
                    value={draft.fontSize}
                    onChange={(e) => patch({ fontSize: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </>
            )}

            {(draft.type === "text" || draft.type === "heading") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Punto ({draft.fontSize}px)
                </label>
                <input
                  type="range"
                  min={12}
                  max={48}
                  value={draft.fontSize}
                  onChange={(e) => patch({ fontSize: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {draft.type === "heading" ? (
              <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setUnderlineOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800/60"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-0.5 w-5 rounded-full"
                      style={{ backgroundColor: draft.color, height: Math.max(2, draft.underlineThickness || 2) }}
                    />
                    Alt çizgi
                  </span>
                  <span className="text-xs font-normal text-zinc-500">
                    {draft.underlineEnabled ? "Açık" : "Kapalı"}
                  </span>
                </button>

                {underlineOpen ? (
                  <div className="space-y-3 border-t border-zinc-200 px-3 py-3 dark:border-zinc-700">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={Boolean(draft.underlineEnabled)}
                        onChange={(e) => patch({ underlineEnabled: e.target.checked })}
                        className="rounded border-zinc-300"
                      />
                      Alt çizgi göster
                    </label>

                    {draft.underlineEnabled ? (
                      <>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium text-zinc-500">Uzunluk</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => patch({ underlineLengthMode: "auto" })}
                              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                                draft.underlineLengthMode !== "fixed"
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                                  : "border-zinc-200 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              Otomatik
                            </button>
                            <button
                              type="button"
                              onClick={() => patch({ underlineLengthMode: "fixed" })}
                              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                                draft.underlineLengthMode === "fixed"
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                                  : "border-zinc-200 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
                              }`}
                            >
                              Özel (px)
                            </button>
                          </div>
                          {draft.underlineLengthMode === "fixed" ? (
                            <input
                              type="number"
                              min={8}
                              value={Math.round(draft.underlineLength || 120)}
                              onChange={(e) =>
                                patch({ underlineLength: Math.max(8, Number(e.target.value) || 8) })
                              }
                              className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                            />
                          ) : (
                            <p className="mt-1.5 text-xs text-zinc-400">Metin genişliği kadar uzar</p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-zinc-500">
                            Kalınlık ({draft.underlineThickness || 2}px)
                          </label>
                          <input
                            type="range"
                            min={1}
                            max={12}
                            value={draft.underlineThickness || 2}
                            onChange={(e) => patch({ underlineThickness: Number(e.target.value) })}
                            className="w-full"
                          />
                        </div>

                        <div className="rounded-lg bg-zinc-50 px-3 py-3 dark:bg-zinc-950">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                            Önizleme
                          </p>
                          <div className="flex justify-center">
                            <div className="inline-flex max-w-full flex-col items-center">
                              <p
                                className="text-center font-bold leading-tight"
                                style={{ color: draft.color, fontSize: draft.fontSize }}
                              >
                                {draft.title || "Başlık"}
                              </p>
                              <span
                                className="mt-1 rounded-full"
                                style={{
                                  width:
                                    draft.underlineLengthMode === "fixed"
                                      ? `${Math.max(8, draft.underlineLength || 120)}px`
                                      : "100%",
                                  height: `${Math.max(1, draft.underlineThickness || 2)}px`,
                                  backgroundColor: draft.color,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {!isLine && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Genişlik</label>
                  <input
                    type="number"
                    min={40}
                    value={Math.round(draft.width)}
                    onChange={(e) => patch({ width: Number(e.target.value) || 40 })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500">Yükseklik</label>
                  <input
                    type="number"
                    min={24}
                    value={Math.round(draft.height)}
                    onChange={(e) => patch({ height: Number(e.target.value) || 24 })}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                  />
                </div>
              </div>
            )}

            {isLine && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Kalınlık ({draft.strokeWidth}px)
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={draft.strokeWidth}
                  onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {draft.type === "frame" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Kenar kalınlığı ({draft.strokeWidth}px)
                </label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  value={draft.strokeWidth}
                  onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}

            {draft.type === "note" ? (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">Not rengi</label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => patch({ backgroundColor: c.value, color: "#713f12" })}
                      className={`h-7 w-7 rounded-md border-2 transition ${
                        draft.backgroundColor === c.value
                          ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-2 dark:border-zinc-100 dark:ring-zinc-100"
                          : "border-zinc-200 dark:border-zinc-600"
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">Renk</label>
                <div className="flex flex-wrap gap-2">
                  {NODE_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      onClick={() => patch({ color: c.value })}
                      className={`h-7 w-7 rounded-full border-2 transition ${
                        draft.color === c.value
                          ? "border-zinc-900 ring-2 ring-zinc-900 ring-offset-2 dark:border-zinc-100 dark:ring-zinc-100"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                Sil
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      </div>

      {noteExpanded && draft.type === "note" ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-6"
          onClick={() => setNoteExpanded(false)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              e.preventDefault();
              setNoteExpanded(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Not düzenleyici"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 sm:px-5">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Not düzenle</h3>
                <p className="text-xs text-zinc-500">Markdown ile yapılandırılmış not yaz</p>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center rounded-lg bg-zinc-100 p-0.5 dark:bg-zinc-800"
                  role="tablist"
                  aria-label="Not görünümü"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={noteEditorTab === "edit"}
                    onClick={() => setNoteEditorTab("edit")}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      noteEditorTab === "edit"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={noteEditorTab === "preview"}
                    onClick={() => setNoteEditorTab("preview")}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      noteEditorTab === "preview"
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    Önizleme
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setNoteExpanded(false)}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Tamam
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_220px]">
              <div className="min-h-0 p-4 sm:p-5">
                {noteEditorTab === "edit" ? (
                  <textarea
                    autoFocus
                    value={draft.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder={"# Başlık\n\n[] Yapılacak\n- Madde\n1. Adım\n\n> Detaylar\n  Gizli içerik\n\n\"\" Alıntı\n\n---"}
                    className="h-[min(62vh,520px)] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm leading-relaxed text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                ) : (
                  <div
                    className="h-[min(62vh,520px)] overflow-auto rounded-xl border border-zinc-200 p-4 shadow-inner dark:border-zinc-700"
                    style={{ backgroundColor: draft.backgroundColor || "#fef08a" }}
                  >
                    <NoteMarkdownContent
                      source={draft.title}
                      color={draft.color || "#713f12"}
                      fontSize={draft.fontSize || 14}
                    />
                  </div>
                )}
              </div>

              <aside className="border-t border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60 md:border-l md:border-t-0">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  Kısayollar
                </p>
                <ul className="space-y-1.5">
                  {NOTE_MARKDOWN_HINTS.map((hint) => (
                    <li
                      key={hint.syn}
                      className="flex items-start gap-2 text-[11px] leading-snug text-zinc-600 dark:text-zinc-300"
                    >
                      <code className="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-100">
                        {hint.syn}
                      </code>
                      <span>{hint.desc}</span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        </div>
      ) : null}

      <RoadmapDeleteConfirmModal
        open={showDeleteConfirm}
        title={`${typeDef.label} silinsin mi?`}
        message="Bu işlem geri alınamaz. Öğe canvas'tan kaldırılacak."
        itemLabel={deleteItemLabel()}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
