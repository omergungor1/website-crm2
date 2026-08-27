"use client";

import { useEffect, useState } from "react";
import { NODE_COLORS } from "@/lib/roadmap/constants";
import { NOTE_COLORS, isLineType, getAnnotationTypeDef } from "@/lib/roadmap/annotations";
import RoadmapDeleteConfirmModal from "./RoadmapDeleteConfirmModal";

export default function AnnotationSettingsModal({ annotation, onClose, onChange, onDelete }) {
  const [draft, setDraft] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [underlineOpen, setUnderlineOpen] = useState(false);

  useEffect(() => {
    if (annotation) {
      setDraft({ ...annotation });
      setShowDeleteConfirm(false);
      setUnderlineOpen(Boolean(annotation.underlineEnabled));
    } else {
      setDraft(null);
      setShowDeleteConfirm(false);
      setUnderlineOpen(false);
    }
  }, [annotation]);

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
            {!isLine && draft.type !== "frame" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Metin</label>
                <textarea
                  rows={draft.type === "note" ? 4 : 2}
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
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
