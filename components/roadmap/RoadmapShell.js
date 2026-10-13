"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { nanoid } from "nanoid";
import {
  ANCHORS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_COLOR,
  getNodeTypeDef,
  migrateAnchor,
} from "@/lib/roadmap/constants";
import {
  buildArrowPath,
  buildLinePath,
  createAnnotation,
  isBackBoxType,
  isFrontBoxType,
  isLineType,
  isMediaBoxType,
  isResizableBoxType,
} from "@/lib/roadmap/annotations";
import { toggleNoteTodoAtLine } from "@/lib/roadmap/noteMarkdown";
import {
  buildEdgePath,
  contentFingerprint,
  getAnchorButtonPosition,
  getAnchorPoint,
  getCanvasCenter,
  normalizeCanvasData,
} from "@/lib/roadmap/utils";
import AnnotationSettingsModal from "./AnnotationSettingsModal";
import RoadmapImageModal from "./RoadmapImageModal";
import RoadmapVideoModal from "./RoadmapVideoModal";
import NodeSettingsModal from "./NodeSettingsModal";
import RoadmapAddTodoModal from "./RoadmapAddTodoModal";
import RoadmapAnnotationView from "./RoadmapAnnotationView";
import RoadmapNodeBox from "./RoadmapNodeBox";
import RoadmapRevisionsModal from "./RoadmapRevisionsModal";
import RoadmapSnapshotsModal from "./RoadmapSnapshotsModal";
import RoadmapToolbox from "./RoadmapToolbox";
import { captureRoadmapCanvas } from "@/lib/roadmap/captureViewport";
import { buildAlignableItems, computeAlignmentMoves } from "@/lib/roadmap/alignSelection";
import RoadmapAlignMenu from "./RoadmapAlignMenu";
import RoadmapContextMenu from "./RoadmapContextMenu";
import SiteTodoModal from "@/components/SiteTodoModal";

function TodoIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4" />
    </svg>
  );
}

function countAnchorUsage(edges, nodeId, anchor) {
  return edges.filter(
    (e) =>
      (e.fromNodeId === nodeId && migrateAnchor(e.fromAnchor) === anchor) ||
      (e.toNodeId === nodeId && migrateAnchor(e.toAnchor) === anchor)
  ).length;
}

const ZOOM_MIN = 0.4;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const DEFAULT_OPEN_ZOOM = 0.55;
const DUPLICATE_OFFSET = 24;
const MARQUEE_MIN_SIZE = 4;
const RESIZE_MIN_SIZE = 40;
const HISTORY_MAX = 40;

function rectsIntersect(a, b) {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

function getAnnotationBounds(annotation) {
  if (isLineType(annotation.type)) {
    const minX = Math.min(annotation.x1, annotation.x2);
    const minY = Math.min(annotation.y1, annotation.y2);
    const maxX = Math.max(annotation.x1, annotation.x2);
    const maxY = Math.max(annotation.y1, annotation.y2);
    const pad = Math.max(4, annotation.strokeWidth || 2);
    return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
  }
  return {
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
  };
}

export default function RoadmapShell({ projectId = null, onBack, projectName }) {
  const apiUrl = projectId ? `/api/projects/${projectId}/roadmap` : "/api/roadmap";
  const snapshotsApiUrl = projectId
    ? `/api/projects/${projectId}/roadmap/snapshots`
    : "/api/roadmap/snapshots";
  const revisionsApiUrl = projectId
    ? `/api/projects/${projectId}/roadmap/revisions`
    : "/api/roadmap/revisions";
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [viewport, setViewport] = useState({ scrollX: 0, scrollY: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [hydrated, setHydrated] = useState(false);
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
  const [imageSettingsId, setImageSettingsId] = useState(null);
  const [videoSettingsId, setVideoSettingsId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [selectedAnnotationIds, setSelectedAnnotationIds] = useState([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [hoveredLineId, setHoveredLineId] = useState(null);
  const [addTodoOpen, setAddTodoOpen] = useState(false);
  const [addTodoSaving, setAddTodoSaving] = useState(false);
  const [addTodoError, setAddTodoError] = useState("");
  const [siteTodoOpen, setSiteTodoOpen] = useState(false);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [snapshotCaptureMode, setSnapshotCaptureMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [modifierKeyHeld, setModifierKeyHeld] = useState(false);
  const [marquee, setMarquee] = useState(null);
  const [historyUi, setHistoryUi] = useState({ canUndo: false, canRedo: false });
  const canvasRef = useRef(null);
  const canvasCaptureRef = useRef(null);
  const saveTimerRef = useRef(null);
  const savingRef = useRef(false);
  const savedFingerprintRef = useRef("");
  const zoomRef = useRef(1);
  const pendingZoomScrollRef = useRef(null);
  const moreMenuRef = useRef(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const annotationsRef = useRef(annotations);
  const historyPastRef = useRef([]);
  const historyFutureRef = useRef([]);
  const historyCoalesceKeyRef = useRef(null);
  const applyingHistoryRef = useRef(false);
  const pendingDragHistoryRef = useRef(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  function syncHistoryUi() {
    setHistoryUi({
      canUndo: historyPastRef.current.length > 0,
      canRedo: historyFutureRef.current.length > 0,
    });
  }

  function cloneCanvasContent() {
    return {
      nodes: structuredClone(nodesRef.current),
      edges: structuredClone(edgesRef.current),
      annotations: structuredClone(annotationsRef.current),
    };
  }

  function pushHistory(coalesceKey = null) {
    if (applyingHistoryRef.current) return;
    if (coalesceKey != null && historyCoalesceKeyRef.current === coalesceKey) return;

    historyPastRef.current.push(cloneCanvasContent());
    if (historyPastRef.current.length > HISTORY_MAX) {
      historyPastRef.current.shift();
    }
    historyFutureRef.current = [];
    historyCoalesceKeyRef.current = coalesceKey;
    syncHistoryUi();
  }

  function pushHistoryDiscrete() {
    historyCoalesceKeyRef.current = null;
    pushHistory(null);
  }

  function commitPendingDragHistory() {
    if (!pendingDragHistoryRef.current || applyingHistoryRef.current) return;
    historyPastRef.current.push(pendingDragHistoryRef.current);
    if (historyPastRef.current.length > HISTORY_MAX) {
      historyPastRef.current.shift();
    }
    historyFutureRef.current = [];
    historyCoalesceKeyRef.current = null;
    pendingDragHistoryRef.current = null;
    syncHistoryUi();
  }

  function clearHistory() {
    historyPastRef.current = [];
    historyFutureRef.current = [];
    historyCoalesceKeyRef.current = null;
    syncHistoryUi();
  }

  function restoreHistorySnapshot(snapshot) {
    applyingHistoryRef.current = true;
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
    setAnnotations(snapshot.annotations);
    historyCoalesceKeyRef.current = null;
    syncHistoryUi();
    queueMicrotask(() => {
      applyingHistoryRef.current = false;
    });
  }

  function undo() {
    if (!historyPastRef.current.length) return;
    historyFutureRef.current.push(cloneCanvasContent());
    const prev = historyPastRef.current.pop();
    restoreHistorySnapshot(prev);
  }

  function redo() {
    if (!historyFutureRef.current.length) return;
    historyPastRef.current.push(cloneCanvasContent());
    const next = historyFutureRef.current.pop();
    restoreHistorySnapshot(next);
  }

  useEffect(() => {
    if (!moreMenuOpen) return;
    function onPointerDown(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setMoreMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [moreMenuOpen]);

  function clearSelection() {
    setSelectedNodeIds([]);
    setSelectedAnnotationIds([]);
    setSelectedEdgeId(null);
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function openItemContextMenu(e, { nodeId = null, annotationId = null } = {}) {
    e.preventDefault();
    e.stopPropagation();
    setMoreMenuOpen(false);

    let nodeIds = selectedNodeIds;
    let annotationIds = selectedAnnotationIds;

    if (nodeId) {
      if (!selectedNodeIds.includes(nodeId)) {
        nodeIds = [nodeId];
        annotationIds = [];
        setSelectedNodeIds(nodeIds);
        setSelectedAnnotationIds(annotationIds);
      }
    } else if (annotationId) {
      if (!selectedAnnotationIds.includes(annotationId)) {
        nodeIds = [];
        annotationIds = [annotationId];
        setSelectedNodeIds(nodeIds);
        setSelectedAnnotationIds(annotationIds);
      }
    } else {
      return;
    }

    setSelectedEdgeId(null);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeIds,
      annotationIds,
    });
  }

  function bringSelectionToFront(nodeIds, annotationIds) {
    if (nodeIds.length === 0 && annotationIds.length === 0) return;
    pushHistoryDiscrete();
    if (nodeIds.length > 0) {
      const ids = new Set(nodeIds);
      setNodes((prev) => {
        const moving = prev.filter((n) => ids.has(n.id));
        const rest = prev.filter((n) => !ids.has(n.id));
        return [...rest, ...moving];
      });
    }
    if (annotationIds.length > 0) {
      const ids = new Set(annotationIds);
      setAnnotations((prev) => {
        const moving = prev.filter((a) => ids.has(a.id));
        const rest = prev.filter((a) => !ids.has(a.id));
        return [...rest, ...moving];
      });
    }
  }

  function sendSelectionToBack(nodeIds, annotationIds) {
    if (nodeIds.length === 0 && annotationIds.length === 0) return;
    pushHistoryDiscrete();
    if (nodeIds.length > 0) {
      const ids = new Set(nodeIds);
      setNodes((prev) => {
        const moving = prev.filter((n) => ids.has(n.id));
        const rest = prev.filter((n) => !ids.has(n.id));
        return [...moving, ...rest];
      });
    }
    if (annotationIds.length > 0) {
      const ids = new Set(annotationIds);
      setAnnotations((prev) => {
        const moving = prev.filter((a) => ids.has(a.id));
        const rest = prev.filter((a) => !ids.has(a.id));
        return [...moving, ...rest];
      });
    }
  }

  function deleteSelectionItems(nodeIds, annotationIds) {
    if (nodeIds.length === 0 && annotationIds.length === 0) return;
    pushHistoryDiscrete();
    if (nodeIds.length > 0) {
      const ids = new Set(nodeIds);
      setNodes((prev) => prev.filter((n) => !ids.has(n.id)));
      setEdges((prev) =>
        prev.filter((edge) => !ids.has(edge.fromNodeId) && !ids.has(edge.toNodeId))
      );
      setSelectedNodeIds([]);
      setSettingsNodeId(null);
    }
    if (annotationIds.length > 0) {
      const ids = new Set(annotationIds);
      setAnnotations((prev) => prev.filter((a) => !ids.has(a.id)));
      setSelectedAnnotationIds([]);
      setSettingsAnnotationId(null);
      setImageSettingsId(null);
      setVideoSettingsId(null);
    }
  }

  function handleContextMenuAction(action) {
    if (!contextMenu) return;
    const { nodeIds, annotationIds } = contextMenu;
    if (action === "front") bringSelectionToFront(nodeIds, annotationIds);
    else if (action === "back") sendSelectionToBack(nodeIds, annotationIds);
    else if (action === "duplicate") duplicateSelection(nodeIds, annotationIds);
    else if (action === "delete") deleteSelectionItems(nodeIds, annotationIds);
    closeContextMenu();
  }

  const clientToCanvas = useCallback((clientX, clientY) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const z = zoomRef.current || 1;
    return {
      x: (clientX - rect.left + el.scrollLeft) / z,
      y: (clientY - rect.top + el.scrollTop) / z,
    };
  }, []);

  const finishMarqueeSelection = useCallback(
    (marqueeState) => {
      const rect = {
        x: Math.min(marqueeState.startX, marqueeState.currentX),
        y: Math.min(marqueeState.startY, marqueeState.currentY),
        width: Math.abs(marqueeState.currentX - marqueeState.startX),
        height: Math.abs(marqueeState.currentY - marqueeState.startY),
      };

      if (rect.width < MARQUEE_MIN_SIZE && rect.height < MARQUEE_MIN_SIZE) {
        if (!marqueeState.additive) clearSelection();
        return;
      }

      const hitNodeIds = nodes
        .filter((node) =>
          rectsIntersect(rect, { x: node.x, y: node.y, width: node.width, height: node.height })
        )
        .map((node) => node.id);

      const hitAnnotationIds = annotations
        .filter((ann) => rectsIntersect(rect, getAnnotationBounds(ann)))
        .map((ann) => ann.id);

      if (marqueeState.additive) {
        setSelectedNodeIds((prev) => [...new Set([...prev, ...hitNodeIds])]);
        setSelectedAnnotationIds((prev) => [...new Set([...prev, ...hitAnnotationIds])]);
      } else {
        setSelectedNodeIds(hitNodeIds);
        setSelectedAnnotationIds(hitAnnotationIds);
      }
      setSelectedEdgeId(null);
      setSettingsNodeId(null);
      setSettingsAnnotationId(null);
      setImageSettingsId(null);
      setVideoSettingsId(null);
    },
    [nodes, annotations]
  );

  useEffect(() => {
    if (!marquee) return;
    function onMove(e) {
      const pt = clientToCanvas(e.clientX, e.clientY);
      setMarquee((prev) =>
        prev ? { ...prev, currentX: pt.x, currentY: pt.y } : null
      );
    }
    function onUp() {
      setMarquee((prev) => {
        if (prev) finishMarqueeSelection(prev);
        return null;
      });
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [marquee, clientToCanvas, finishMarqueeSelection]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Meta" || e.key === "Control") setModifierKeyHeld(true);
    }
    function onKeyUp(e) {
      if (e.key === "Meta" || e.key === "Control") setModifierKeyHeld(false);
    }
    function onBlur() {
      setModifierKeyHeld(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  function applyOpenView() {
    zoomRef.current = DEFAULT_OPEN_ZOOM;
    setZoom(DEFAULT_OPEN_ZOOM);
    setViewport({ scrollX: 0, scrollY: 0 });
    requestAnimationFrame(() => {
      const el = canvasRef.current;
      if (el) {
        el.scrollLeft = 0;
        el.scrollTop = 0;
      }
    });
  }

  function applyCanvasData(canvasData) {
    const normalized = normalizeCanvasData(canvasData);
    const fingerprint = contentFingerprint(normalized);
    setNodes(normalized.nodes);
    setEdges(normalized.edges);
    setAnnotations(normalized.annotations);
    savedFingerprintRef.current = fingerprint;
    setSavedFingerprint(fingerprint);
    clearHistory();
    clearSelection();
    applyOpenView();
  }

  function buildSelectionOrigins(nodeIds, annotationIds) {
    const nodeOrigins = {};
    const annotationOrigins = {};
    for (const id of nodeIds) {
      const n = nodes.find((item) => item.id === id);
      if (n) nodeOrigins[id] = { x: n.x, y: n.y };
    }
    for (const id of annotationIds) {
      const a = annotations.find((item) => item.id === id);
      if (!a) continue;
      if (isLineType(a.type)) {
        annotationOrigins[id] = { kind: "line", x1: a.x1, y1: a.y1, x2: a.x2, y2: a.y2 };
      } else {
        annotationOrigins[id] = { kind: "box", x: a.x, y: a.y };
      }
    }
    return { nodeOrigins, annotationOrigins };
  }

  function selectionMinOrigin(nodeOrigins, annotationOrigins) {
    const xs = [];
    const ys = [];
    for (const o of Object.values(nodeOrigins)) {
      xs.push(o.x);
      ys.push(o.y);
    }
    for (const o of Object.values(annotationOrigins)) {
      if (o.kind === "line") {
        xs.push(Math.min(o.x1, o.x2));
        ys.push(Math.min(o.y1, o.y2));
      } else {
        xs.push(o.x);
        ys.push(o.y);
      }
    }
    return {
      minX: xs.length ? Math.min(...xs) : 0,
      minY: ys.length ? Math.min(...ys) : 0,
    };
  }

  const canvasData = { viewport, nodes, edges, annotations };
  const currentContentFingerprint = contentFingerprint(canvasData);
  const isDirty = savedFingerprint !== currentContentFingerprint;
  const settingsNode = nodes.find((n) => n.id === settingsNodeId) || null;
  const settingsAnnotation = annotations.find((a) => a.id === settingsAnnotationId) || null;
  const imageSettingsAnnotation = annotations.find((a) => a.id === imageSettingsId) || null;
  const videoSettingsAnnotation = annotations.find((a) => a.id === videoSettingsId) || null;

  const backBoxAnnotations = annotations.filter((a) => isBackBoxType(a.type));
  const lineAnnotations = annotations.filter((a) => isLineType(a.type));
  const frontAnnotations = annotations.filter((a) => isFrontBoxType(a.type));
  const resizableSelectedAnnotations = annotations.filter(
    (a) => isResizableBoxType(a.type) && selectedAnnotationIds.includes(a.id)
  );
  const selectionCount = selectedNodeIds.length + selectedAnnotationIds.length;

  const applySelectionAlignment = useCallback(
    (action) => {
      const items = buildAlignableItems(
        nodes,
        annotations,
        selectedNodeIds,
        selectedAnnotationIds
      );
      const moves = computeAlignmentMoves(action, items);
      if (!moves.length) return;

      pushHistoryDiscrete();

      const moveByNode = new Map();
      const moveByAnnotation = new Map();
      for (const move of moves) {
        if (move.kind === "node") moveByNode.set(move.id, move);
        else moveByAnnotation.set(move.id, move);
      }

      if (moveByNode.size > 0) {
        setNodes((prev) =>
          prev.map((node) => {
            const move = moveByNode.get(node.id);
            if (!move) return node;
            return { ...node, x: node.x + move.dx, y: node.y + move.dy };
          })
        );
      }

      if (moveByAnnotation.size > 0) {
        setAnnotations((prev) =>
          prev.map((ann) => {
            const move = moveByAnnotation.get(ann.id);
            if (!move) return ann;
            if (isLineType(ann.type)) {
              return {
                ...ann,
                x1: ann.x1 + move.dx,
                y1: ann.y1 + move.dy,
                x2: ann.x2 + move.dx,
                y2: ann.y2 + move.dy,
              };
            }
            return { ...ann, x: ann.x + move.dx, y: ann.y + move.dy };
          })
        );
      }
    },
    [nodes, annotations, selectedNodeIds, selectedAnnotationIds]
  );

  const persistViewport = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    setViewport({ scrollX: el.scrollLeft, scrollY: el.scrollTop });
  }, []);

  useLayoutEffect(() => {
    const pending = pendingZoomScrollRef.current;
    const el = canvasRef.current;
    if (!pending || !el) return;
    el.scrollLeft = pending.left;
    el.scrollTop = pending.top;
    pendingZoomScrollRef.current = null;
    persistViewport();
  }, [zoom, persistViewport]);

  const applyZoom = useCallback((nextZoom, anchorClient = null) => {
    const el = canvasRef.current;
    const clamped = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, Math.round(nextZoom * 100) / 100)
    );
    const prev = zoomRef.current || 1;
    if (Math.abs(clamped - prev) < 0.005) return;

    if (el) {
      const rect = el.getBoundingClientRect();
      const viewX = anchorClient ? anchorClient.x - rect.left : el.clientWidth / 2;
      const viewY = anchorClient ? anchorClient.y - rect.top : el.clientHeight / 2;
      // Art arda wheel olaylarında henüz uygulanmamış scroll hedefini kullan
      const scrollLeft = pendingZoomScrollRef.current?.left ?? el.scrollLeft;
      const scrollTop = pendingZoomScrollRef.current?.top ?? el.scrollTop;
      const contentX = (scrollLeft + viewX) / prev;
      const contentY = (scrollTop + viewY) / prev;
      pendingZoomScrollRef.current = {
        left: contentX * clamped - viewX,
        top: contentY * clamped - viewY,
      };
    } else {
      pendingZoomScrollRef.current = null;
    }

    zoomRef.current = clamped;
    setZoom(clamped);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError("");
      setHydrated(false);
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Yüklenemedi");
        if (cancelled) return;
        const normalized = normalizeCanvasData(data.canvas_data);
        const fingerprint = contentFingerprint(normalized);
        setNodes(normalized.nodes);
        setEdges(normalized.edges);
        setAnnotations(normalized.annotations);
        savedFingerprintRef.current = fingerprint;
        setSavedFingerprint(fingerprint);
        clearHistory();
        setHydrated(true);
        applyOpenView();
      } catch (err) {
        if (!cancelled) {
          setLoadError(err?.message || "RoadMap yüklenemedi");
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
    if (savingRef.current) return;
    const normalized = normalizeCanvasData(data);
    const fingerprint = contentFingerprint(normalized);
    // Zaten kayıtlı içerikle aynıysa tekrar yazma
    if (fingerprint === savedFingerprintRef.current) {
      setSavedFingerprint(fingerprint);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas_data: normalized }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Kaydedilemedi");
      // Sunucu yanıtı yerine gönderilen içeriğin hash'ini kullan — mismatch döngüsünü önler
      savedFingerprintRef.current = fingerprint;
      setSavedFingerprint(fingerprint);
      setSaveMsg("Kaydedildi");
      setTimeout(() => setSaveMsg(""), 2000);
    } catch (e) {
      setSaveMsg(e.message || "Hata");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [apiUrl]);

  const saveNow = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    // Viewport kaydı scroll/zoom ile tetiklenmez; içerik kaydında sabit başlangıç viewport yazılır
    saveCanvas({ viewport: { scrollX: 0, scrollY: 0 }, nodes, edges, annotations });
  }, [nodes, edges, annotations, saveCanvas]);

  useEffect(() => {
    if (loading || !hydrated || loadError) return;
    if (!isDirty || savingRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (savingRef.current) return;
      saveCanvas({ viewport: { scrollX: 0, scrollY: 0 }, nodes, edges, annotations });
    }, 900);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [nodes, edges, annotations, loading, hydrated, loadError, isDirty, saveCanvas]);

  const duplicateSelection = useCallback(
    (overrideNodeIds, overrideAnnotationIds) => {
      const nodeIds = overrideNodeIds ?? selectedNodeIds;
      const annotationIds = overrideAnnotationIds ?? selectedAnnotationIds;
      if (nodeIds.length === 0 && annotationIds.length === 0) return;

      const idMap = {};
      const newNodeIds = [];
      const newAnnotationIds = [];

      if (nodeIds.length === 0 && annotationIds.length === 0) return;

      pushHistoryDiscrete();

      if (nodeIds.length > 0) {
        const selectedSet = new Set(nodeIds);
        const clonedNodes = nodes
          .filter((n) => selectedSet.has(n.id))
          .map((n) => {
            const newId = nanoid(10);
            idMap[n.id] = newId;
            newNodeIds.push(newId);
            return {
              ...n,
              id: newId,
              x: n.x + DUPLICATE_OFFSET,
              y: n.y + DUPLICATE_OFFSET,
            };
          });

        const clonedEdges = edges
          .filter((edge) => selectedSet.has(edge.fromNodeId) && selectedSet.has(edge.toNodeId))
          .map((edge) => ({
            ...edge,
            id: nanoid(10),
            fromNodeId: idMap[edge.fromNodeId],
            toNodeId: idMap[edge.toNodeId],
          }));

        setNodes((prev) => [...prev, ...clonedNodes]);
        if (clonedEdges.length > 0) {
          setEdges((prev) => [...prev, ...clonedEdges]);
        }
      }

      if (annotationIds.length > 0) {
        const selectedSet = new Set(annotationIds);
        const clonedAnnotations = annotations
          .filter((a) => selectedSet.has(a.id))
          .map((a) => {
            const newId = nanoid(10);
            newAnnotationIds.push(newId);
            if (isLineType(a.type)) {
              return {
                ...a,
                id: newId,
                x1: a.x1 + DUPLICATE_OFFSET,
                y1: a.y1 + DUPLICATE_OFFSET,
                x2: a.x2 + DUPLICATE_OFFSET,
                y2: a.y2 + DUPLICATE_OFFSET,
              };
            }
            return {
              ...a,
              id: newId,
              x: a.x + DUPLICATE_OFFSET,
              y: a.y + DUPLICATE_OFFSET,
            };
          });

        setAnnotations((prev) => [...prev, ...clonedAnnotations]);
      }

      setSelectedNodeIds(newNodeIds);
      setSelectedAnnotationIds(newAnnotationIds);
      setSelectedEdgeId(null);
      setSettingsNodeId(null);
      setSettingsAnnotationId(null);
      setImageSettingsId(null);
      setVideoSettingsId(null);
    },
    [nodes, edges, annotations, selectedNodeIds, selectedAnnotationIds]
  );

  useEffect(() => {
    function onKeyDown(e) {
      const tag = e.target?.tagName?.toLowerCase();
      const inField = tag === "input" || tag === "textarea" || tag === "select";

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveNow();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (inField) return;
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        if (inField) return;
        e.preventDefault();
        redo();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        if (inField) return;
        if (selectedNodeIds.length > 0 || selectedAnnotationIds.length > 0) {
          e.preventDefault();
          duplicateSelection();
        }
        return;
      }

      if (e.key === "Escape") {
        if (contextMenu) {
          e.preventDefault();
          closeContextMenu();
          return;
        }
        if (linking) {
          e.preventDefault();
          setLinking(null);
          setLinkPointer(null);
          return;
        }
      }

      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (inField) return;

      if (selectedNodeIds.length > 0 || selectedAnnotationIds.length > 0) {
        e.preventDefault();
        deleteSelectionItems(selectedNodeIds, selectedAnnotationIds);
        return;
      }

      if (selectedEdgeId) {
        e.preventDefault();
        pushHistoryDiscrete();
        setEdges((prev) => prev.filter((edge) => edge.id !== selectedEdgeId));
        setSelectedEdgeId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selectedEdgeId,
    selectedAnnotationIds,
    selectedNodeIds,
    linking,
    contextMenu,
    saveNow,
    duplicateSelection,
  ]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e) {
      const z = zoomRef.current || 1;
      const dx = (e.clientX - dragging.startX) / z;
      const dy = (e.clientY - dragging.startY) / z;

      if (pendingDragHistoryRef.current && (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)) {
        commitPendingDragHistory();
      }

      if (dragging.target === "selection") {
        const { nodeOrigins, annotationOrigins } = dragging;
        const { minX, minY } = selectionMinOrigin(nodeOrigins, annotationOrigins);
        const clampedDx = Math.max(dx, -minX);
        const clampedDy = Math.max(dy, -minY);

        if (Object.keys(nodeOrigins).length > 0) {
          setNodes((prev) =>
            prev.map((n) => {
              const orig = nodeOrigins[n.id];
              if (!orig) return n;
              return { ...n, x: orig.x + clampedDx, y: orig.y + clampedDy };
            })
          );
        }

        if (Object.keys(annotationOrigins).length > 0) {
          setAnnotations((prev) =>
            prev.map((a) => {
              const orig = annotationOrigins[a.id];
              if (!orig) return a;
              if (orig.kind === "line") {
                return {
                  ...a,
                  x1: orig.x1 + clampedDx,
                  y1: orig.y1 + clampedDy,
                  x2: orig.x2 + clampedDx,
                  y2: orig.y2 + clampedDy,
                };
              }
              return { ...a, x: orig.x + clampedDx, y: orig.y + clampedDy };
            })
          );
        }
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
        return;
      }

      if (dragging.target === "annotation-resize") {
        setAnnotations((prev) =>
          prev.map((a) => {
            if (a.id !== dragging.id) return a;
            return {
              ...a,
              width: Math.max(RESIZE_MIN_SIZE, dragging.orig.width + dx),
              height: Math.max(RESIZE_MIN_SIZE, dragging.orig.height + dy),
            };
          })
        );
      }
    }
    function onUp() {
      pendingDragHistoryRef.current = null;
      setDragging(null);
      historyCoalesceKeyRef.current = null;
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
      const z = zoomRef.current || 1;
      setLinkPointer({
        x: (e.clientX - rect.left + el.scrollLeft) / z,
        y: (e.clientY - rect.top + el.scrollTop) / z,
      });
    }
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [linking]);

  function zoomIn() {
    applyZoom((zoomRef.current || 1) + ZOOM_STEP);
  }

  function zoomOut() {
    applyZoom((zoomRef.current || 1) - ZOOM_STEP);
  }

  const captureSnapshot = useCallback(async () => {
    const viewportEl = canvasRef.current;
    const canvasEl = canvasCaptureRef.current;
    if (!viewportEl || !canvasEl) throw new Error("Canvas hazır değil");

    clearSelection();
    setSnapshotCaptureMode(true);
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    try {
      return await captureRoadmapCanvas(viewportEl, canvasEl, {
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        zoom: zoomRef.current || 1,
      });
    } finally {
      setSnapshotCaptureMode(false);
    }
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || loading) return;

    function onWheel(e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      // Trackpad / mouse: sürekli delta ile yumuşak zoom
      const factor = Math.exp(-e.deltaY * 0.0018);
      applyZoom((zoomRef.current || 1) * factor, { x: e.clientX, y: e.clientY });
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [loading, applyZoom]);

  function addNode(typeId) {
    const def = getNodeTypeDef(typeId);
    const center = getCanvasCenter(canvasRef.current, zoom);
    pushHistoryDiscrete();
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
    const center = getCanvasCenter(canvasRef.current, zoom);
    const newId = nanoid(10);
    pushHistoryDiscrete();
    setAnnotations((prev) => [
      ...prev,
      createAnnotation(typeId, center, prev.length, newId),
    ]);
    if (typeId === "image") {
      setSelectedNodeIds([]);
      setSelectedAnnotationIds([newId]);
      setImageSettingsId(newId);
    }
    if (typeId === "video") {
      setSelectedNodeIds([]);
      setSelectedAnnotationIds([newId]);
      setVideoSettingsId(newId);
    }
  }

  function getBulkLinkSources(nodeId) {
    if (selectedNodeIds.includes(nodeId) && selectedNodeIds.length > 1) {
      return [...selectedNodeIds];
    }
    return [nodeId];
  }

  function createBulkEdges(sources, fromAnchor, toNodeId, toAnchor) {
    const seen = new Set(
      edges.map((edge) =>
        `${edge.fromNodeId}:${migrateAnchor(edge.fromAnchor)}:${edge.toNodeId}:${migrateAnchor(edge.toAnchor)}`
      )
    );
    const created = [];

    for (const fromNodeId of sources) {
      if (fromNodeId === toNodeId) continue;
      const key = `${fromNodeId}:${migrateAnchor(fromAnchor)}:${toNodeId}:${migrateAnchor(toAnchor)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      created.push({
        id: nanoid(10),
        fromNodeId,
        fromAnchor,
        toNodeId,
        toAnchor,
      });
    }

    return created;
  }

  function handleAnchorPointerDown(e, nodeId, anchor) {
    e.stopPropagation();
    e.preventDefault();

    if (linking) {
      if (linking.fromNodeId !== nodeId) {
        const sources = linking.bulkFromNodeIds?.length
          ? linking.bulkFromNodeIds
          : [linking.fromNodeId];
        const newEdges = createBulkEdges(sources, linking.fromAnchor, nodeId, anchor);
        if (newEdges.length > 0) {
          pushHistoryDiscrete();
          setEdges((prev) => [...prev, ...newEdges]);
        }
        setLinking(null);
        setLinkPointer(null);
      }
      return;
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setLinking({
      fromNodeId: nodeId,
      fromAnchor: anchor,
      bulkFromNodeIds: getBulkLinkSources(nodeId),
    });
    setLinkPointer(getAnchorPoint(node, anchor));
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
    if (e.target.closest("[data-roadmap-resize-handle]")) return;
    if (e.target.closest("button")) return;
    if (e.ctrlKey || e.metaKey) {
      const pt = clientToCanvas(e.clientX, e.clientY);
      setMarquee({
        startX: pt.x,
        startY: pt.y,
        currentX: pt.x,
        currentY: pt.y,
        additive: e.shiftKey,
      });
      e.preventDefault();
      return;
    }
    clearSelection();
    closeContextMenu();
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
    if (e.button !== 0) return;
    if (e.target.closest("button")) return;
    e.stopPropagation();
    e.preventDefault();
    closeContextMenu();
    setSelectedEdgeId(null);

    if (e.ctrlKey || e.metaKey) {
      setSelectedNodeIds((prev) =>
        prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id]
      );
      return;
    }

    let nodeIds;
    let annotationIds;
    if (selectedNodeIds.includes(node.id)) {
      nodeIds = selectedNodeIds;
      annotationIds = selectedAnnotationIds;
    } else {
      nodeIds = [node.id];
      annotationIds = [];
      setSelectedNodeIds([node.id]);
      setSelectedAnnotationIds([]);
    }

    const { nodeOrigins, annotationOrigins } = buildSelectionOrigins(nodeIds, annotationIds);
    pendingDragHistoryRef.current = cloneCanvasContent();
    setDragging({
      target: "selection",
      startX: e.clientX,
      startY: e.clientY,
      nodeOrigins,
      annotationOrigins,
    });
  }

  function startAnnotationDrag(e, ann) {
    if (linking) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    closeContextMenu();
    setSelectedEdgeId(null);

    if (e.ctrlKey || e.metaKey) {
      setSelectedAnnotationIds((prev) =>
        prev.includes(ann.id) ? prev.filter((id) => id !== ann.id) : [...prev, ann.id]
      );
      return;
    }

    let nodeIds;
    let annotationIds;
    if (selectedAnnotationIds.includes(ann.id)) {
      nodeIds = selectedNodeIds;
      annotationIds = selectedAnnotationIds;
    } else {
      nodeIds = [];
      annotationIds = [ann.id];
      setSelectedNodeIds([]);
      setSelectedAnnotationIds([ann.id]);
    }

    const { nodeOrigins, annotationOrigins } = buildSelectionOrigins(nodeIds, annotationIds);
    pendingDragHistoryRef.current = cloneCanvasContent();
    setDragging({
      target: "selection",
      startX: e.clientX,
      startY: e.clientY,
      nodeOrigins,
      annotationOrigins,
    });
  }

  function startAnnotationResize(e, ann) {
    if (linking) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedEdgeId(null);
    setSelectedNodeIds([]);
    setSelectedAnnotationIds([ann.id]);
    pendingDragHistoryRef.current = cloneCanvasContent();
    setDragging({
      target: "annotation-resize",
      id: ann.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: { width: ann.width, height: ann.height },
    });
  }

  function startLineEndpointDrag(e, ann, endpoint) {
    if (linking) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedNodeIds([]);
    setSelectedAnnotationIds([ann.id]);
    setSelectedEdgeId(null);
    pendingDragHistoryRef.current = cloneCanvasContent();
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
    pushHistory(`node:${nodeId}`);
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
    pushHistory(`ann:${annotationId}`);
    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotationId ? { ...a, ...patch } : a))
    );
  }

  function deleteNode(nodeId) {
    pushHistoryDiscrete();
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
    setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId));
    setSettingsNodeId(null);
  }

  function deleteAnnotation(annotationId) {
    pushHistoryDiscrete();
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    setSettingsAnnotationId(null);
    setImageSettingsId(null);
    setVideoSettingsId(null);
    setSelectedAnnotationIds((prev) => prev.filter((id) => id !== annotationId));
  }

  function applyImageDraft(annotationId, patch) {
    pushHistoryDiscrete();
    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotationId ? { ...a, ...patch } : a))
    );
    setImageSettingsId(null);
  }

  function applyVideoDraft(annotationId, patch) {
    pushHistoryDiscrete();
    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotationId ? { ...a, ...patch } : a))
    );
    setVideoSettingsId(null);
  }

  const linkFromAnchor = linking
    ? getAnchorPoint(
      nodes.find((n) => n.id === linking.fromNodeId),
      linking.fromAnchor
    )
    : null;

  const canvasCursor = linking
    ? "cursor-crosshair"
    : dragging?.target === "annotation-resize"
      ? "cursor-se-resize"
      : marquee
        ? "cursor-pointer"
        : panning
          ? "cursor-grabbing"
          : dragging
            ? "cursor-grabbing"
            : modifierKeyHeld
              ? "cursor-pointer"
              : "cursor-grab";

  function renderBoxAnnotation(ann, index = 0) {
    const selected = selectedAnnotationIds.includes(ann.id);
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
          zIndex: 30 + index,
        }}
        onPointerDown={(e) => {
          if (ann.type === "checkbox" && e.target.closest("[data-roadmap-checkbox]")) return;
          if (ann.type === "link" && e.target.closest("[data-roadmap-link]")) return;
          if (ann.type === "note" && e.target.closest("[data-roadmap-note-interactive]")) return;
          startAnnotationDrag(e, ann);
        }}
        onContextMenu={(e) => openItemContextMenu(e, { annotationId: ann.id })}
      >
        <RoadmapAnnotationView
          annotation={ann}
          selected={selected}
          onCheckboxToggle={(checked) => applyAnnotationDraft(ann.id, { checked })}
          onNoteTodoToggle={(lineIndex) => {
            const nextTitle = toggleNoteTodoAtLine(ann.title, lineIndex);
            if (nextTitle !== ann.title) applyAnnotationDraft(ann.id, { title: nextTitle });
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setSettingsAnnotationId(ann.id);
          }}
        />
      </div>
    );
  }

  function renderFrameVisual(ann, index = 0) {
    const selected = selectedAnnotationIds.includes(ann.id);
    return (
      <div
        key={`frame-visual-${ann.id}`}
        className="pointer-events-none absolute select-none"
        style={{
          left: ann.x,
          top: ann.y,
          width: ann.width,
          height: ann.height,
          zIndex: 1 + index,
        }}
      >
        <RoadmapAnnotationView
          annotation={ann}
          selected={selected}
          embedInteractive={!snapshotCaptureMode}
        />
      </div>
    );
  }

  function renderFrameChrome(ann) {
    const edge = 10;
    const isMedia = isMediaBoxType(ann.type);

    function onChromePointerDown(e) {
      startAnnotationDrag(e, ann);
    }

    function onChromeDoubleClick(e) {
      e.stopPropagation();
      if (ann.type === "image") {
        setImageSettingsId(ann.id);
      } else if (ann.type === "video") {
        setVideoSettingsId(ann.id);
      } else {
        setSettingsAnnotationId(ann.id);
      }
    }

    function onChromeContextMenu(e) {
      openItemContextMenu(e, { annotationId: ann.id });
    }

    const edgeClass =
      "absolute z-[15] cursor-grab active:cursor-grabbing";

    if (isMedia) {
      return (
        <div
          key={`frame-chrome-${ann.id}`}
          data-roadmap-annotation=""
          data-roadmap-frame-handle=""
          className="absolute z-[15] cursor-grab active:cursor-grabbing"
          style={{ left: ann.x, top: ann.y, width: ann.width, height: ann.height }}
          onPointerDown={onChromePointerDown}
          onDoubleClick={onChromeDoubleClick}
          onContextMenu={onChromeContextMenu}
        />
      );
    }

    return (
      <div key={`frame-chrome-${ann.id}`}>
        <div
          data-roadmap-annotation=""
          data-roadmap-frame-handle=""
          className={edgeClass}
          style={{ left: ann.x, top: ann.y, width: ann.width, height: edge }}
          onPointerDown={onChromePointerDown}
          onDoubleClick={onChromeDoubleClick}
          onContextMenu={onChromeContextMenu}
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
          onContextMenu={onChromeContextMenu}
        />
        <div
          data-roadmap-annotation=""
          data-roadmap-frame-handle=""
          className={edgeClass}
          style={{ left: ann.x, top: ann.y, width: edge, height: ann.height }}
          onPointerDown={onChromePointerDown}
          onDoubleClick={onChromeDoubleClick}
          onContextMenu={onChromeContextMenu}
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
          onContextMenu={onChromeContextMenu}
        />
      </div>
    );
  }

  function renderLineHandles(ann) {
    const show =
      selectedAnnotationIds.includes(ann.id) ||
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

  function renderResizeHandle(ann) {
    const handleSize = 12;
    const offset = handleSize / 2;
    return (
      <div
        key={`resize-${ann.id}`}
        data-roadmap-resize-handle=""
        className="absolute z-[36] cursor-se-resize rounded-sm border-2 border-indigo-500 bg-white shadow-md dark:bg-zinc-900"
        style={{
          left: ann.x + ann.width - offset,
          top: ann.y + ann.height - offset,
          width: handleSize,
          height: handleSize,
        }}
        title="Boyutlandır"
        onPointerDown={(e) => startAnnotationResize(e, ann)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-400">RoadMap yükleniyor…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        <p className="max-w-md text-xs text-zinc-500">
          Yükleme hatası oluştu. Verileriniz korunması için otomatik kayıt yapılmadı. Sayfayı yenileyin.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Yeniden dene
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full overflow-hidden"
      onContextMenu={(e) => {
        e.preventDefault();
        if (
          !e.target.closest(
            "[data-roadmap-node], [data-roadmap-annotation], [data-roadmap-frame-handle]"
          )
        ) {
          closeContextMenu();
        }
      }}
    >
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
            {projectId ? (
              <button
                type="button"
                onClick={() => {
                  setAddTodoError("");
                  setAddTodoOpen(true);
                }}
                title="Todo ekle"
                aria-label="Todo ekle"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
                Todo
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 text-zinc-500">
            <div className="min-w-[5.5rem] shrink-0 text-right tabular-nums">
              {saving && <span>Kaydediliyor…</span>}
              {!saving && saveMsg === "Kaydedildi" && (
                <span className="text-emerald-600 dark:text-emerald-400">Kaydedildi</span>
              )}
              {!saving && saveMsg && saveMsg !== "Kaydedildi" && (
                <span className="text-rose-600 dark:text-rose-400">{saveMsg}</span>
              )}
              {!saving && !saveMsg && isDirty && <span>Kaydedilecek…</span>}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={undo}
                disabled={!historyUi.canUndo}
                title="Geri al (⌘Z)"
                aria-label="Geri al"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!historyUi.canRedo}
                title="İleri al (⌘⇧Z)"
                aria-label="İleri al"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <span className="mx-0.5 h-4 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= ZOOM_MIN}
                title="Uzaklaştır"
                aria-label="Uzaklaştır"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyZoom(1)}
                title="Zoom sıfırla"
                className="min-w-[3rem] rounded-lg px-1.5 py-1 text-center text-[11px] font-medium tabular-nums text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= ZOOM_MAX}
                title="Yakınlaştır"
                aria-label="Yakınlaştır"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <RoadmapAlignMenu
                selectionCount={selectionCount}
                onAlign={applySelectionAlignment}
              />
              <button
                type="button"
                onClick={() => setSiteTodoOpen(true)}
                title="Todo"
                aria-label="Todo"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <TodoIcon className="h-4 w-4" />
              </button>
              <div ref={moreMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreMenuOpen((open) => !open)}
                  title="Daha fazla"
                  aria-label="Daha fazla"
                  aria-expanded={moreMenuOpen}
                  aria-haspopup="menu"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <circle cx="12" cy="5" r="1.75" />
                    <circle cx="12" cy="12" r="1.75" />
                    <circle cx="12" cy="19" r="1.75" />
                  </svg>
                </button>
                {moreMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setRevisionsOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                      </svg>
                      Geçmiş
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        setSnapshotsOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                      </svg>
                      Snapshots
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div
          ref={canvasRef}
          className={`roadmap-canvas-scroll relative flex-1 overflow-auto bg-[length:24px_24px] bg-zinc-100 dark:bg-zinc-950 ${canvasCursor}`}
          style={{
            backgroundImage:
              "radial-gradient(circle, rgb(161 161 170 / 0.35) 1px, transparent 1px)",
          }}
          onPointerDown={startCanvasPan}
          onContextMenu={(e) => {
            e.preventDefault();
          }}
        >
          <div
            className="relative"
            style={{
              width: CANVAS_WIDTH * zoom,
              height: CANVAS_HEIGHT * zoom,
            }}
          >
            <div
              ref={canvasCaptureRef}
              data-roadmap-capture-root=""
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                transform: `scale(${zoom})`,
              }}
            >
            {backBoxAnnotations.map((ann, index) => renderFrameVisual(ann, index))}

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
                        setSelectedAnnotationIds([]);
                        setSelectedNodeIds([]);
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
                const selected = selectedAnnotationIds.includes(ann.id);
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
                      onContextMenu={(e) => openItemContextMenu(e, { annotationId: ann.id })}
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

            {nodes.map((node, index) => {
              const isHovered = hoveredNodeId === node.id;
              const isSelected = selectedNodeIds.includes(node.id);

              return (
                <div
                  key={node.id}
                  data-roadmap-node=""
                  className="absolute select-none"
                  style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height,
                    zIndex: 10 + index,
                  }}
                  onPointerDown={(e) => startNodeDrag(e, node)}
                  onContextMenu={(e) => openItemContextMenu(e, { nodeId: node.id })}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId((id) => (id === node.id ? null : id))}
                >
                  <RoadmapNodeBox
                    node={node}
                    selected={isSelected}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSettingsNodeId(node.id);
                    }}
                  />

                  {(isHovered || linking) && !snapshotCaptureMode &&
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
                            className={`absolute z-20 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold shadow transition ${isSource
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

            {frontAnnotations.map((ann, index) => renderBoxAnnotation(ann, index))}

            {!snapshotCaptureMode && backBoxAnnotations.map(renderFrameChrome)}

            {!snapshotCaptureMode && lineAnnotations.map(renderLineHandles)}

            {!snapshotCaptureMode && resizableSelectedAnnotations.map(renderResizeHandle)}

            {marquee ? (
              <div
                className="pointer-events-none absolute z-[50] border-2 border-indigo-500 bg-indigo-500/10"
                style={{
                  left: Math.min(marquee.startX, marquee.currentX),
                  top: Math.min(marquee.startY, marquee.currentY),
                  width: Math.abs(marquee.currentX - marquee.startX),
                  height: Math.abs(marquee.currentY - marquee.startY),
                }}
              />
            ) : null}
            </div>
          </div>
        </div>
      </div>

      {contextMenu ? (
        <RoadmapContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onAction={handleContextMenuAction}
          onClose={closeContextMenu}
        />
      ) : null}

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

      <RoadmapImageModal
        annotation={imageSettingsAnnotation}
        projectId={projectId}
        onClose={() => setImageSettingsId(null)}
        onSave={(patch) => applyImageDraft(imageSettingsId, patch)}
        onDelete={deleteAnnotation}
      />

      <RoadmapVideoModal
        annotation={videoSettingsAnnotation}
        onClose={() => setVideoSettingsId(null)}
        onSave={(patch) => applyVideoDraft(videoSettingsId, patch)}
        onDelete={deleteAnnotation}
      />

      <SiteTodoModal open={siteTodoOpen} onClose={() => setSiteTodoOpen(false)} />

      {projectId ? (
        <RoadmapAddTodoModal
          open={addTodoOpen}
          projectName={projectName}
          saving={addTodoSaving}
          error={addTodoError}
          onClose={() => {
            if (!addTodoSaving) setAddTodoOpen(false);
          }}
          onSave={async ({ title, color }) => {
            setAddTodoSaving(true);
            setAddTodoError("");
            try {
              const res = await fetch(`/api/projects/${projectId}/todos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, color }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Eklenemedi");
              setAddTodoOpen(false);
            } catch (err) {
              setAddTodoError(err.message);
            } finally {
              setAddTodoSaving(false);
            }
          }}
        />
      ) : null}

      <RoadmapSnapshotsModal
        open={snapshotsOpen}
        onClose={() => setSnapshotsOpen(false)}
        apiBase={snapshotsApiUrl}
        onCapture={captureSnapshot}
        currentZoom={zoom}
      />

      <RoadmapRevisionsModal
        open={revisionsOpen}
        onClose={() => setRevisionsOpen(false)}
        apiBase={revisionsApiUrl}
        onRestore={applyCanvasData}
      />
    </div>
  );
}
