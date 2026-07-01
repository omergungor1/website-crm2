"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import {
  ANCHORS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_COLOR,
  NODE_TYPES,
  emptyCanvasData,
  getNodeTypeDef,
  migrateAnchor,
} from "@/lib/roadmap/constants";
import {
  buildEdgePath,
  canvasFingerprint,
  getAnchorButtonPosition,
  getAnchorPoint,
  getCanvasCenter,
  normalizeCanvasData,
} from "@/lib/roadmap/utils";
import NodeSettingsModal from "./NodeSettingsModal";
import RoadmapNodeBox from "./RoadmapNodeBox";

function shapeClass(shape) {
  if (shape === "circle") return "rounded-full";
  if (shape === "diamond") return "rotate-45 rounded-lg";
  if (shape === "rectangle") return "rounded-md";
  return "rounded-xl";
}

function countAnchorUsage(edges, nodeId, anchor) {
  return edges.filter(
    (e) =>
      (e.fromNodeId === nodeId && migrateAnchor(e.fromAnchor) === anchor) ||
      (e.toNodeId === nodeId && migrateAnchor(e.toAnchor) === anchor)
  ).length;
}

export default function RoadmapShell() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [viewport, setViewport] = useState({ scrollX: 0, scrollY: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [dragging, setDragging] = useState(null);
  const [panning, setPanning] = useState(null);
  const [linking, setLinking] = useState(null);
  const [linkPointer, setLinkPointer] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [settingsNodeId, setSettingsNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const canvasRef = useRef(null);
  const saveTimerRef = useRef(null);

  const canvasData = { viewport, nodes, edges };
  const isDirty = savedFingerprint !== canvasFingerprint(canvasData);
  const settingsNode = nodes.find((n) => n.id === settingsNodeId) || null;

  const persistViewport = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    setViewport({ scrollX: el.scrollLeft, scrollY: el.scrollTop });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/roadmap");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Yüklenemedi");
        if (cancelled) return;
        const normalized = normalizeCanvasData(data.canvas_data);
        setNodes(normalized.nodes);
        setEdges(normalized.edges);
        setViewport(normalized.viewport);
        setSavedFingerprint(canvasFingerprint(normalized));
        requestAnimationFrame(() => {
          const el = canvasRef.current;
          if (el) {
            el.scrollLeft = normalized.viewport.scrollX;
            el.scrollTop = normalized.viewport.scrollY;
          }
        });
      } catch {
        if (!cancelled) {
          const empty = emptyCanvasData();
          setNodes(empty.nodes);
          setEdges(empty.edges);
          setViewport(empty.viewport);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveCanvas = useCallback(async (data) => {
    setSaving(true);
    setSaveMsg("");
    try {
      const normalized = normalizeCanvasData(data);
      const res = await fetch("/api/roadmap", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas_data: normalized }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Kaydedilemedi");
      setSavedFingerprint(canvasFingerprint(result.canvas_data));
      setSaveMsg("Kaydedildi");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) {
      setSaveMsg(e.message || "Hata");
    } finally {
      setSaving(false);
    }
  }, []);

  const saveNow = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const el = canvasRef.current;
    const vp = el ? { scrollX: el.scrollLeft, scrollY: el.scrollTop } : viewport;
    saveCanvas({ viewport: vp, nodes, edges });
  }, [nodes, edges, viewport, saveCanvas]);

  useEffect(() => {
    if (loading) return;
    if (!isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const el = canvasRef.current;
      const vp = el
        ? { scrollX: el.scrollLeft, scrollY: el.scrollTop }
        : viewport;
      saveCanvas({ viewport: vp, nodes, edges });
    }, 900);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges, viewport, loading, isDirty, saveCanvas]);

  useEffect(() => {
    function onKeyDown(e) {
      const tag = e.target?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || tag === "select";

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
        return;
      }

      if (e.key === "Escape" && linking) {
        e.preventDefault();
        setLinking(null);
        setLinkPointer(null);
        return;
      }

      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!selectedEdgeId || inField) return;
      e.preventDefault();
      setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEdgeId, linking, saveNow]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e) {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragging.nodeId
            ? { ...n, x: Math.max(0, dragging.origX + dx), y: Math.max(0, dragging.origY + dy) }
            : n
        )
      );
    }
    function onUp() {
      setDragging(null);
      persistViewport();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, persistViewport]);

  useEffect(() => {
    if (!panning) return;
    function onMove(e) {
      const el = canvasRef.current;
      if (!el) return;
      el.scrollLeft = panning.scrollLeft - (e.clientX - panning.startX);
      el.scrollTop = panning.scrollTop - (e.clientY - panning.startY);
    }
    function onUp() {
      setPanning(null);
      persistViewport();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [panning, persistViewport]);

  useEffect(() => {
    if (!linking) return;
    function onMove(e) {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setLinkPointer({
        x: e.clientX - rect.left + el.scrollLeft,
        y: e.clientY - rect.top + el.scrollTop,
      });
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [linking]);

  function addNode(typeId) {
    const def = getNodeTypeDef(typeId);
    const center = getCanvasCenter(canvasRef.current);
    setNodes((prev) => [
      ...prev,
      {
        id: nanoid(10),
        type: typeId,
        title: def.label,
        description: "",
        color: DEFAULT_COLOR,
        imageUrl: "",
        x: Math.max(40, center.x - def.width / 2 + prev.length * 12),
        y: Math.max(40, center.y - def.height / 2 + prev.length * 12),
        width: def.width,
        height: def.height,
      },
    ]);
  }

  function handleAnchorPointerDown(e, nodeId, anchor) {
    e.stopPropagation();
    e.preventDefault();

    if (linking) {
      if (linking.fromNodeId !== nodeId) {
        setEdges((prev) => [
          ...prev,
          {
            id: nanoid(10),
            fromNodeId: linking.fromNodeId,
            fromAnchor: linking.fromAnchor,
            toNodeId: nodeId,
            toAnchor: anchor,
          },
        ]);
        setLinking(null);
        setLinkPointer(null);
      }
      return;
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setLinking({ fromNodeId: nodeId, fromAnchor: anchor });
    setLinkPointer(getAnchorPoint(node, anchor));
    setSelectedEdgeId(null);
  }

  function startCanvasPan(e) {
    if (linking) {
      if (!e.target.closest("[data-roadmap-anchor]")) {
        setLinking(null);
        setLinkPointer(null);
      }
      return;
    }
    if (e.button !== 0) return;
    if (e.target.closest("[data-roadmap-node]")) return;
    if (e.target.closest("[data-roadmap-edge]")) return;
    if (e.target.closest("[data-roadmap-anchor]")) return;
    if (e.target.closest("button")) return;
    setSelectedEdgeId(null);
    const el = canvasRef.current;
    if (!el) return;
    setPanning({
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    });
    e.preventDefault();
  }

  function startDrag(e, node) {
    if (linking) return;
    if (e.target.closest("button")) return;
    e.stopPropagation();
    setDragging({
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: node.x,
      origY: node.y,
    });
  }

  function applyNodeDraft(nodeId, patch) {
    const def = patch.type ? getNodeTypeDef(patch.type) : null;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              ...patch,
              ...(def ? { width: def.width, height: def.height } : {}),
            }
          : n
      )
    );
  }

  function deleteNode(nodeId) {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
    setSettingsNodeId(null);
  }

  const linkFromAnchor = linking
    ? getAnchorPoint(
        nodes.find((n) => n.id === linking.fromNodeId),
        linking.fromAnchor
      )
    : null;

  const canvasCursor = linking
    ? "cursor-crosshair"
    : panning
      ? "cursor-grabbing"
      : dragging
        ? "cursor-grabbing"
        : "cursor-grab";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-400">RoadMap yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <aside className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-zinc-200 bg-white py-3 dark:border-zinc-800 dark:bg-zinc-900">
        {NODE_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.label}
            onClick={() => addNode(t.id)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-semibold leading-tight text-zinc-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
          >
            <span
              className={`flex items-center justify-center border-2 border-current ${shapeClass(t.shape)}`}
              style={{
                width: t.shape === "circle" || t.shape === "diamond" ? 22 : 26,
                height: t.shape === "circle" || t.shape === "diamond" ? 22 : 18,
              }}
            />
          </button>
        ))}
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-500">
            ⌘S kaydet · Boş alan: kaydır · Çift tık: ayarlar · Kenar +: bağla · Esc: iptal
          </p>
          <div className="flex items-center gap-2 text-zinc-500">
            {saving && <span>Kaydediliyor…</span>}
            {!saving && saveMsg && <span className="text-emerald-600 dark:text-emerald-400">{saveMsg}</span>}
            {!saving && !saveMsg && isDirty && <span>Kaydedilecek…</span>}
            {!saving && !saveMsg && !isDirty && <span>Kaydedildi</span>}
          </div>
        </div>

        <div
          ref={canvasRef}
          className={`relative flex-1 overflow-auto bg-[length:24px_24px] bg-zinc-100 dark:bg-zinc-950 ${canvasCursor}`}
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(161 161 170 / 0.35) 1px, transparent 1px)",
          }}
          onPointerDown={startCanvasPan}
        >
          <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <svg className="absolute inset-0 h-full w-full overflow-visible">
              {edges.map((edge) => {
                const fromNode = nodes.find((n) => n.id === edge.fromNodeId);
                const toNode = nodes.find((n) => n.id === edge.toNodeId);
                if (!fromNode || !toNode) return null;
                const from = getAnchorPoint(fromNode, edge.fromAnchor);
                const to = getAnchorPoint(toNode, edge.toAnchor);
                const selected = selectedEdgeId === edge.id;
                return (
                  <g key={edge.id}>
                    <path
                      data-roadmap-edge=""
                      d={buildEdgePath(from, to, edge.fromAnchor, edge.toAnchor)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                      className="cursor-pointer"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeId(edge.id);
                        setLinking(null);
                      }}
                    />
                    <path
                      d={buildEdgePath(from, to, edge.fromAnchor, edge.toAnchor)}
                      fill="none"
                      stroke={selected ? "#6366f1" : "#94a3b8"}
                      strokeWidth={selected ? 3 : 2}
                      className="pointer-events-none"
                    />
                  </g>
                );
              })}
              {linkFromAnchor && linkPointer && (
                <path
                  d={buildEdgePath(linkFromAnchor, linkPointer)}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                />
              )}
            </svg>

            {nodes.map((node) => {
              const isHovered = hoveredNodeId === node.id;

              return (
                <div
                  key={node.id}
                  data-roadmap-node=""
                  className="absolute select-none"
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  onPointerDown={(e) => startDrag(e, node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId((id) => (id === node.id ? null : id))}
                >
                  <RoadmapNodeBox
                    node={node}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSettingsNodeId(node.id);
                    }}
                  />

                  {(isHovered || linking) &&
                    ANCHORS.map((anchor) => {
                      const usage = countAnchorUsage(edges, node.id, anchor);
                      const plusCount = usage + 1;
                      return Array.from({ length: plusCount }).map((_, idx) => {
                        const isSource =
                          linking?.fromNodeId === node.id && linking?.fromAnchor === anchor && idx === 0;
                        const isTarget = linking && linking.fromNodeId !== node.id;
                        const pos = getAnchorButtonPosition(node, anchor, idx);
                        return (
                          <button
                            key={`${node.id}-${anchor}-${idx}`}
                            type="button"
                            data-roadmap-anchor=""
                            title={linking ? "Bağlantıyı buraya bağla" : "Bağlantı başlat"}
                            onPointerDown={(e) => handleAnchorPointerDown(e, node.id, anchor)}
                            className={`absolute z-20 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold shadow transition ${
                              isSource
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : isTarget
                                  ? "border-indigo-400 bg-white text-indigo-600 hover:scale-110 hover:bg-indigo-50"
                                  : "border-zinc-300 bg-white text-zinc-600 hover:border-indigo-400 hover:text-indigo-600 dark:border-zinc-600 dark:bg-zinc-800"
                            }`}
                            style={{ left: pos.left, top: pos.top }}
                          >
                            +
                          </button>
                        );
                      });
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NodeSettingsModal
        node={settingsNode}
        onClose={() => setSettingsNodeId(null)}
        onChange={applyNodeDraft}
        onDelete={deleteNode}
      />
    </div>
  );
}
