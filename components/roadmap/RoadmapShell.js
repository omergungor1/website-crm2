"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import {
  ANCHORS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_COLOR,
  emptyCanvasData,
  getNodeTypeDef,
  migrateAnchor,
} from "@/lib/roadmap/constants";
import {
  buildArrowPath,
  buildLinePath,
  createAnnotation,
  isLineType,
} from "@/lib/roadmap/annotations";
import {
  buildEdgePath,
  canvasFingerprint,
  getAnchorButtonPosition,
  getAnchorPoint,
  getCanvasCenter,
  normalizeCanvasData,
} from "@/lib/roadmap/utils";
import AnnotationSettingsModal from "./AnnotationSettingsModal";
import NodeSettingsModal from "./NodeSettingsModal";
import RoadmapAnnotationView from "./RoadmapAnnotationView";
import RoadmapNodeBox from "./RoadmapNodeBox";
import RoadmapToolbox from "./RoadmapToolbox";

function countAnchorUsage(edges, nodeId, anchor) {
  return edges.filter(
    (e) =>
      (e.fromNodeId === nodeId && migrateAnchor(e.fromAnchor) === anchor) ||
      (e.toNodeId === nodeId && migrateAnchor(e.toAnchor) === anchor)
  ).length;
}

export default function RoadmapShell({ projectId = null, onBack, projectName }) {
  const apiUrl = projectId ? `/api/projects/${projectId}/roadmap` : "/api/roadmap";
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [annotations, setAnnotations] = useState([]);
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
  const [settingsAnnotationId, setSettingsAnnotationId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [hoveredLineId, setHoveredLineId] = useState(null);
  const canvasRef = useRef(null);
  const saveTimerRef = useRef(null);

  const canvasData = { viewport, nodes, edges, annotations };
  const isDirty = savedFingerprint !== canvasFingerprint(canvasData);
  const settingsNode = nodes.find((n) => n.id === settingsNodeId) || null;
  const settingsAnnotation = annotations.find((a) => a.id === settingsAnnotationId) || null;

  const frameAnnotations = annotations.filter((a) => a.type === "frame");
  const lineAnnotations = annotations.filter((a) => isLineType(a.type));
  const frontAnnotations = annotations.filter((a) =>
    ["heading", "text", "note"].includes(a.type)
  );

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
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Yüklenemedi");
        if (cancelled) return;
        const normalized = normalizeCanvasData(data.canvas_data);
        setNodes(normalized.nodes);
        setEdges(normalized.edges);
        setAnnotations(normalized.annotations);
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
          setAnnotations(empty.annotations);
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
  }, [apiUrl]);

  const saveCanvas = useCallback(async (data) => {
    setSaving(true);
    setSaveMsg("");
    try {
      const normalized = normalizeCanvasData(data);
      const res = await fetch(apiUrl, {
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
  }, [apiUrl]);

  const saveNow = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const el = canvasRef.current;
    const vp = el ? { scrollX: el.scrollLeft, scrollY: el.scrollTop } : viewport;
    saveCanvas({ viewport: vp, nodes, edges, annotations });
  }, [nodes, edges, annotations, viewport, saveCanvas]);

  useEffect(() => {
    if (loading) return;
    if (!isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const el = canvasRef.current;
      const vp = el
        ? { scrollX: el.scrollLeft, scrollY: el.scrollTop }
        : viewport;
      saveCanvas({ viewport: vp, nodes, edges, annotations });
    }, 900);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges, annotations, viewport, loading, isDirty, saveCanvas]);

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
      if (inField) return;

      if (selectedAnnotationId) {
        e.preventDefault();
        setAnnotations((prev) => prev.filter((a) => a.id !== selectedAnnotationId));
        setSelectedAnnotationId(null);
        setSettingsAnnotationId(null);
        return;
      }

      if (selectedEdgeId) {
        e.preventDefault();
        setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedEdgeId, selectedAnnotationId, linking, saveNow]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e) {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;

      if (dragging.target === "node") {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === dragging.id
              ? {
                  ...n,
                  x: Math.max(0, dragging.orig.x + dx),
                  y: Math.max(0, dragging.orig.y + dy),
                }
              : n
          )
        );
        return;
      }

      if (dragging.target === "annotation-box") {
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === dragging.id
              ? {
                  ...a,
                  x: Math.max(0, dragging.orig.x + dx),
                  y: Math.max(0, dragging.orig.y + dy),
                }
              : a
          )
        );
        return;
      }

      if (dragging.target === "annotation-line") {
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === dragging.id
              ? {
                  ...a,
                  x1: dragging.orig.x1 + dx,
                  y1: dragging.orig.y1 + dy,
                  x2: dragging.orig.x2 + dx,
                  y2: dragging.orig.y2 + dy,
                }
              : a
          )
        );
        return;
      }

      if (dragging.target === "annotation-line-end") {
        setAnnotations((prev) =>
          prev.map((a) => {
            if (a.id !== dragging.id) return a;
            if (dragging.endpoint === "start") {
              return {
                ...a,
                x1: dragging.orig.x1 + dx,
                y1: dragging.orig.y1 + dy,
              };
            }
            return {
              ...a,
              x2: dragging.orig.x2 + dx,
              y2: dragging.orig.y2 + dy,
            };
          })
        );
      }
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

  function addAnnotation(typeId) {
    const center = getCanvasCenter(canvasRef.current);
    setAnnotations((prev) => [
      ...prev,
      createAnnotation(typeId, center, prev.length, nanoid(10)),
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
    setSelectedAnnotationId(null);
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
    if (e.target.closest("[data-roadmap-annotation]")) return;
    if (e.target.closest("[data-roadmap-edge]")) return;
    if (e.target.closest("[data-roadmap-anchor]")) return;
    if (e.target.closest("[data-roadmap-frame-handle]")) return;
    if (e.target.closest("[data-roadmap-line-handle]")) return;
    if (e.target.closest("button")) return;
    setSelectedEdgeId(null);
    setSelectedAnnotationId(null);
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

  function startNodeDrag(e, node) {
    if (linking) return;
    if (e.target.closest("button")) return;
    e.stopPropagation();
    setSelectedAnnotationId(null);
    setDragging({
      target: "node",
      id: node.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: node.x, y: node.y },
    });
  }

  function startAnnotationDrag(e, ann) {
    if (linking) return;
    e.stopPropagation();
    setSelectedAnnotationId(ann.id);
    setSelectedEdgeId(null);

    if (isLineType(ann.type)) {
      setDragging({
        target: "annotation-line",
        id: ann.id,
        startX: e.clientX,
        startY: e.clientY,
        orig: { x1: ann.x1, y1: ann.y1, x2: ann.x2, y2: ann.y2 },
      });
    } else {
      setDragging({
        target: "annotation-box",
        id: ann.id,
        startX: e.clientX,
        startY: e.clientY,
        orig: { x: ann.x, y: ann.y },
      });
    }
  }

  function startLineEndpointDrag(e, ann, endpoint) {
    if (linking) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedAnnotationId(ann.id);
    setSelectedEdgeId(null);
    setDragging({
      target: "annotation-line-end",
      id: ann.id,
      endpoint,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x1: ann.x1, y1: ann.y1, x2: ann.x2, y2: ann.y2 },
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

  function applyAnnotationDraft(annotationId, patch) {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotationId ? { ...a, ...patch } : a))
    );
  }

  function deleteNode(nodeId) {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
    setSettingsNodeId(null);
  }

  function deleteAnnotation(annotationId) {
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    setSettingsAnnotationId(null);
    setSelectedAnnotationId(null);
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

  function renderBoxAnnotation(ann) {
    const selected = selectedAnnotationId === ann.id;
    return (
      <div
        key={ann.id}
        data-roadmap-annotation=""
        className="absolute select-none"
        style={{
          left: ann.x,
          top: ann.y,
          width: ann.width,
          height: ann.height,
          zIndex: 30,
        }}
        onPointerDown={(e) => startAnnotationDrag(e, ann)}
      >
        <RoadmapAnnotationView
          annotation={ann}
          selected={selected}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setSettingsAnnotationId(ann.id);
          }}
        />
      </div>
    );
  }

  function renderFrameVisual(ann) {
    const selected = selectedAnnotationId === ann.id;
    return (
      <div
        key={`frame-visual-${ann.id}`}
        className="pointer-events-none absolute select-none"
        style={{
          left: ann.x,
          top: ann.y,
          width: ann.width,
          height: ann.height,
          zIndex: 1,
        }}
      >
        <RoadmapAnnotationView annotation={ann} selected={selected} />
      </div>
    );
  }

  function renderFrameChrome(ann) {
    const edge = 10;

    function onChromePointerDown(e) {
      startAnnotationDrag(e, ann);
    }

    function onChromeDoubleClick(e) {
      e.stopPropagation();
      setSettingsAnnotationId(ann.id);
    }

    const edgeClass =
      "absolute z-[15] cursor-grab active:cursor-grabbing";

    return (
      <div key={`frame-chrome-${ann.id}`}>
        <div
          data-roadmap-annotation=""
          data-roadmap-frame-handle=""
          className={edgeClass}
          style={{ left: ann.x, top: ann.y, width: ann.width, height: edge }}
          onPointerDown={onChromePointerDown}
          onDoubleClick={onChromeDoubleClick}
        />
        <div
          data-roadmap-annotation=""
          data-roadmap-frame-handle=""
          className={edgeClass}
          style={{
            left: ann.x,
            top: ann.y + ann.height - edge,
            width: ann.width,
            height: edge,
          }}
          onPointerDown={onChromePointerDown}
          onDoubleClick={onChromeDoubleClick}
        />
        <div
          data-roadmap-annotation=""
          data-roadmap-frame-handle=""
          className={edgeClass}
          style={{ left: ann.x, top: ann.y, width: edge, height: ann.height }}
          onPointerDown={onChromePointerDown}
          onDoubleClick={onChromeDoubleClick}
        />
        <div
          data-roadmap-annotation=""
          data-roadmap-frame-handle=""
          className={edgeClass}
          style={{
            left: ann.x + ann.width - edge,
            top: ann.y,
            width: edge,
            height: ann.height,
          }}
          onPointerDown={onChromePointerDown}
          onDoubleClick={onChromeDoubleClick}
        />
      </div>
    );
  }

  function renderLineHandles(ann) {
    const show =
      selectedAnnotationId === ann.id ||
      hoveredLineId === ann.id ||
      dragging?.id === ann.id;
    if (!show) return null;

    const handleClass =
      "absolute z-[35] h-3.5 w-3.5 cursor-grab rounded-full border-2 border-indigo-500 bg-white shadow active:cursor-grabbing";

    return (
      <div key={`line-handles-${ann.id}`}>
        <div
          data-roadmap-line-handle=""
          className={handleClass}
          style={{ left: ann.x1 - 7, top: ann.y1 - 7 }}
          onPointerDown={(e) => startLineEndpointDrag(e, ann, "start")}
        />
        <div
          data-roadmap-line-handle=""
          className={handleClass}
          style={{ left: ann.x2 - 7, top: ann.y2 - 7 }}
          onPointerDown={(e) => startLineEndpointDrag(e, ann, "end")}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-400">RoadMap yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      <RoadmapToolbox onAddNode={addNode} onAddAnnotation={addAnnotation} />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex min-w-0 items-center gap-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
                </svg>
                Geri
              </button>
            ) : null}
            {projectName ? (
              <span className="truncate font-medium text-zinc-700 dark:text-zinc-200">{projectName}</span>
            ) : null}
            <p className="hidden text-zinc-500 sm:block">
              ⌘S kaydet · Boş alan: kaydır · Çift tık: ayarlar · Node +: bağla · Delete: sil · Esc: iptal
            </p>
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            {saving && <span>Kaydediliyor…</span>}
            {!saving && saveMsg && (
              <span className="text-emerald-600 dark:text-emerald-400">{saveMsg}</span>
            )}
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
            {frameAnnotations.map(renderFrameVisual)}

            <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible">
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
                      className="pointer-events-auto cursor-pointer"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeId(edge.id);
                        setSelectedAnnotationId(null);
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

            <svg className="pointer-events-none absolute inset-0 z-[8] h-full w-full overflow-visible">
              {lineAnnotations.map((ann) => {
                const selected = selectedAnnotationId === ann.id;
                const path =
                  ann.type === "arrow"
                    ? buildArrowPath(ann.x1, ann.y1, ann.x2, ann.y2)
                    : buildLinePath(ann.x1, ann.y1, ann.x2, ann.y2);
                return (
                  <g key={ann.id} data-roadmap-annotation="">
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={Math.max(14, ann.strokeWidth + 10)}
                      className="pointer-events-auto cursor-pointer"
                      onPointerDown={(e) => startAnnotationDrag(e, ann)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSettingsAnnotationId(ann.id);
                      }}
                      onMouseEnter={() => setHoveredLineId(ann.id)}
                      onMouseLeave={() => setHoveredLineId((id) => (id === ann.id ? null : id))}
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke={selected ? "#6366f1" : ann.color}
                      strokeWidth={ann.strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none"
                    />
                  </g>
                );
              })}
            </svg>

            {nodes.map((node) => {
              const isHovered = hoveredNodeId === node.id;

              return (
                <div
                  key={node.id}
                  data-roadmap-node=""
                  className="absolute z-10 select-none"
                  style={{ left: node.x, top: node.y, width: node.width, height: node.height }}
                  onPointerDown={(e) => startNodeDrag(e, node)}
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
                          linking?.fromNodeId === node.id &&
                          linking?.fromAnchor === anchor &&
                          idx === 0;
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

            {frontAnnotations.map(renderBoxAnnotation)}

            {frameAnnotations.map(renderFrameChrome)}

            {lineAnnotations.map(renderLineHandles)}
          </div>
        </div>
      </div>

      <NodeSettingsModal
        node={settingsNode}
        onClose={() => setSettingsNodeId(null)}
        onChange={applyNodeDraft}
        onDelete={deleteNode}
      />

      <AnnotationSettingsModal
        annotation={settingsAnnotation}
        onClose={() => setSettingsAnnotationId(null)}
        onChange={applyAnnotationDraft}
        onDelete={deleteAnnotation}
      />
    </div>
  );
}
