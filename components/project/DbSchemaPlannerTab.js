"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";

const TABLE_WIDTH = 220;
const HEADER_H = 40;
const ROW_H = 28;
const FOOTER_H = 36;
const COLUMN_TYPES = ["uuid", "text", "int4", "bool", "timestamptz", "jsonb"];

const INITIAL_TABLES = [
  {
    id: "t1",
    name: "profiles",
    x: 64,
    y: 72,
    columns: [
      { id: "c1", name: "id", type: "uuid", isPk: true },
      { id: "c2", name: "email", type: "text", isPk: false },
      { id: "c3", name: "created_at", type: "timestamptz", isPk: false },
    ],
  },
  {
    id: "t2",
    name: "posts",
    x: 380,
    y: 180,
    columns: [
      { id: "c4", name: "id", type: "uuid", isPk: true },
      {
        id: "c5",
        name: "user_id",
        type: "uuid",
        isPk: false,
        fkRef: { tableId: "t1", column: "id" },
      },
      { id: "c6", name: "title", type: "text", isPk: false },
      { id: "c7", name: "published", type: "bool", isPk: false },
    ],
  },
];

const INITIAL_CHAT = [
  {
    id: "m1",
    role: "assistant",
    content:
      "Merhaba. Bu alan şema planlama asistanı için ayrıldı. Tabloları soldaki tuvalde düzenleyebilir, ilişkileri görsel olarak takip edebilirsiniz.",
  },
  {
    id: "m2",
    role: "user",
    content: "profiles ve posts arasında user_id foreign key ilişkisi doğru mu?",
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "Evet — posts.user_id → profiles.id ilişkisi tuvalde çizgi ile gösteriliyor. MVP aşamasında yanıtlar örnek veridir; veritabanı bağlantısı henüz yok.",
  },
];

function tableHeight(table) {
  return HEADER_H + table.columns.length * ROW_H + FOOTER_H;
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
      />
    </svg>
  );
}

export default function DbSchemaPlannerTab({
  projectId,
  projectName,
  projectDescription = "",
}) {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [chatMessages, setChatMessages] = useState(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [projectDetails, setProjectDetails] = useState(
    projectDescription ||
      `${projectName} projesi için veritabanı şema taslağı. Hedef: müşteri portalı ve içerik yönetimi.`
  );
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [dragging, setDragging] = useState(null);
  const [editingTableId, setEditingTableId] = useState(null);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!dragging) return;

    function onMove(e) {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      setTables((prev) =>
        prev.map((t) =>
          t.id === dragging.tableId
            ? { ...t, x: Math.max(0, dragging.origX + dx), y: Math.max(0, dragging.origY + dy) }
            : t
        )
      );
    }

    function onUp() {
      setDragging(null);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  const getRelations = useCallback(() => {
    const lines = [];
    tables.forEach((source) => {
      source.columns.forEach((col, colIndex) => {
        if (!col.fkRef) return;
        const target = tables.find((t) => t.id === col.fkRef.tableId);
        if (!target) return;
        const targetColIndex = target.columns.findIndex((c) => c.name === col.fkRef.column);
        const srcY = source.y + HEADER_H + colIndex * ROW_H + ROW_H / 2;
        const tgtY =
          target.y + HEADER_H + (targetColIndex >= 0 ? targetColIndex : 0) * ROW_H + ROW_H / 2;
        const srcX = source.x + TABLE_WIDTH;
        const tgtX = target.x;
        const midX = (srcX + tgtX) / 2;
        lines.push({
          id: `${source.id}-${col.id}`,
          d: `M ${srcX} ${srcY} C ${midX} ${srcY}, ${midX} ${tgtY}, ${tgtX} ${tgtY}`,
        });
      });
    });
    return lines;
  }, [tables]);

  function handleAddTable(e) {
    e.preventDefault();
    const name = newTableName.trim().replace(/\s+/g, "_").toLowerCase();
    if (!name) return;
    if (tables.some((t) => t.name === name)) return;
    setTables((prev) => [
      ...prev,
      {
        id: nanoid(8),
        name,
        x: 120 + prev.length * 40,
        y: 120 + prev.length * 30,
        columns: [{ id: nanoid(8), name: "id", type: "uuid", isPk: true }],
      },
    ]);
    setNewTableName("");
  }

  function handleDeleteTable(tableId) {
    if (!confirm("Bu tabloyu silmek istediğinize emin misiniz?")) return;
    setTables((prev) =>
      prev
        .filter((t) => t.id !== tableId)
        .map((t) => ({
          ...t,
          columns: t.columns.map((c) =>
            c.fkRef?.tableId === tableId ? { ...c, fkRef: undefined } : c
          ),
        }))
    );
  }

  function handleRenameTable(tableId, name) {
    const safe = name.trim().replace(/\s+/g, "_").toLowerCase();
    if (!safe) return;
    setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, name: safe } : t)));
    setEditingTableId(null);
  }

  function handleAddColumn(tableId) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: [
                ...t.columns,
                { id: nanoid(8), name: "new_field", type: "text", isPk: false },
              ],
            }
          : t
      )
    );
  }

  function handleUpdateColumn(tableId, columnId, patch) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)),
            }
          : t
      )
    );
  }

  function handleDeleteColumn(tableId, columnId) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) } : t
      )
    );
  }

  function handleTogglePk(tableId, columnId) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.map((c) =>
                c.id === columnId
                  ? { ...c, isPk: !c.isPk }
                  : c.isPk
                    ? { ...c, isPk: false }
                    : c
              ),
            }
          : t
      )
    );
  }

  function handleChatSubmit(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [
      ...prev,
      { id: nanoid(8), role: "user", content: text },
      {
        id: nanoid(8),
        role: "assistant",
        content:
          "MVP modu: mesajınız kaydedildi ancak AI yanıtı henüz bağlı değil. Şema değişikliklerini soldaki tuvalden manuel yönetebilirsiniz.",
      },
    ]);
    setChatInput("");
  }

  function handleSaveSettings(e) {
    e.preventDefault();
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
    setShowSettings(false);
  }

  function startDrag(e, table) {
    if (e.target.closest("button,input,select,textarea")) return;
    setDragging({
      tableId: table.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: table.x,
      origY: table.y,
    });
  }

  const relations = getRelations();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">DB Schema Planner</h2>
          <p className="text-sm text-zinc-500">
            Supabase Schema Visualizer benzeri tuval — henüz veritabanına bağlı değil (MVP önizleme).
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Önizleme
        </span>
      </div>

      <div className="flex h-[calc(100vh-240px)] min-h-[520px] overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        {/* Sol: şema tuvali */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950">
            <form onSubmit={handleAddTable} className="flex items-center gap-2">
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="yeni_tablo"
                className="w-36 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                + Tablo
              </button>
            </form>
            <span className="text-xs text-zinc-400">Tabloları sürükleyerek konumlandırın</span>
          </div>

          <div
            ref={canvasRef}
            className="relative flex-1 overflow-auto bg-[radial-gradient(circle,_#d4d4d8_1px,_transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(circle,_#3f3f46_1px,_transparent_1px)]"
          >
            <svg className="pointer-events-none absolute inset-0 h-full min-h-[600px] w-full min-w-[800px]">
              {relations.map((line) => (
                <path
                  key={line.id}
                  d={line.d}
                  fill="none"
                  stroke="currentColor"
                  className="text-emerald-500/70 dark:text-emerald-400/60"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              ))}
            </svg>

            <div className="relative min-h-[600px] min-w-[800px]">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`absolute select-none rounded-lg border border-zinc-300 bg-white shadow-md dark:border-zinc-600 dark:bg-zinc-800 ${dragging?.tableId === table.id ? "z-20 ring-2 ring-zinc-400" : "z-10"}`}
                  style={{
                    left: table.x,
                    top: table.y,
                    width: TABLE_WIDTH,
                    height: tableHeight(table),
                  }}
                  onPointerDown={(e) => startDrag(e, table)}
                >
                  <div className="flex cursor-grab items-center justify-between gap-1 rounded-t-lg border-b border-zinc-200 bg-zinc-100 px-2 py-2 active:cursor-grabbing dark:border-zinc-600 dark:bg-zinc-700/80">
                    {editingTableId === table.id ? (
                      <input
                        autoFocus
                        defaultValue={table.name}
                        className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-1 py-0.5 font-mono text-xs dark:border-zinc-500 dark:bg-zinc-900"
                        onBlur={(e) => handleRenameTable(table.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameTable(table.id, e.currentTarget.value);
                          if (e.key === "Escape") setEditingTableId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <button
                        type="button"
                        className="truncate font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTableId(table.id);
                        }}
                        title="Tablo adını düzenle"
                      >
                        {table.name}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.id);
                      }}
                      className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                      title="Tabloyu sil"
                    >
                      ×
                    </button>
                  </div>

                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-700">
                    {table.columns.map((col) => (
                      <li
                        key={col.id}
                        className="flex items-center gap-1 px-2 py-1 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleTogglePk(table.id, col.id)}
                          className={`shrink-0 rounded px-0.5 font-mono text-[9px] font-bold ${col.isPk ? "text-amber-600" : col.fkRef ? "text-emerald-600" : "text-zinc-300"}`}
                          title={col.isPk ? "Primary key" : col.fkRef ? "Foreign key" : "PK yap"}
                        >
                          {col.isPk ? "PK" : col.fkRef ? "FK" : "··"}
                        </button>
                        <input
                          value={col.name}
                          onChange={(e) =>
                            handleUpdateColumn(table.id, col.id, {
                              name: e.target.value.replace(/\s+/g, "_"),
                            })
                          }
                          className="min-w-0 flex-1 rounded border-0 bg-transparent font-mono text-zinc-800 focus:bg-zinc-50 focus:ring-1 focus:ring-zinc-300 dark:text-zinc-200 dark:focus:bg-zinc-900"
                        />
                        <select
                          value={col.type}
                          onChange={(e) =>
                            handleUpdateColumn(table.id, col.id, { type: e.target.value })
                          }
                          className="max-w-[72px] shrink-0 rounded border border-zinc-200 bg-zinc-50 px-0.5 py-0 font-mono text-[10px] dark:border-zinc-600 dark:bg-zinc-900"
                        >
                          {COLUMN_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(table.id, col.id)}
                          className="shrink-0 text-zinc-300 hover:text-red-500"
                          title="Alanı sil"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddColumn(table.id);
                    }}
                    className="w-full rounded-b-lg border-t border-zinc-100 py-2 text-center text-[10px] text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-700/50"
                  >
                    + Alan ekle
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ: AI paneli */}
        <aside className="flex w-[min(100%,380px)] shrink-0 flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Şema Asistanı</span>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              title="Ayarlar"
              aria-label="Ayarlar"
            >
              <SettingsIcon />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "ml-4 bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "mr-2 border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                }`}
              >
                <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide opacity-50">
                  {msg.role === "user" ? "Siz" : "Asistan"}
                </p>
                {msg.content}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={handleChatSubmit}
            className="border-t border-zinc-200 p-3 dark:border-zinc-700"
          >
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Şema hakkında soru yazın… (MVP: yerel önizleme)"
              rows={3}
              className="mb-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-full rounded-xl bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Gönder
            </button>
          </form>
        </aside>
      </div>

      {/* Ayarlar modalı */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                DB Schema Planner Ayarları
              </h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            <p className="mb-3 text-xs text-zinc-500">
              Proje: <span className="font-medium text-zinc-700 dark:text-zinc-300">{projectName}</span>
              <span className="text-zinc-400"> · ID: {projectId}</span>
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Proje detayları
                </label>
                <textarea
                  value={projectDetails}
                  onChange={(e) => setProjectDetails(e.target.value)}
                  rows={8}
                  placeholder="İş kuralları, hedef tablolar, entegrasyon notları…"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <p className="mt-1 text-xs text-zinc-400">
                  AI asistanı için bağlam metni. MVP aşamasında yalnızca yerelde tutulur.
                </p>
              </div>

              {settingsSaved && (
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  Kaydedildi (önizleme — sunucuya gönderilmedi).
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
