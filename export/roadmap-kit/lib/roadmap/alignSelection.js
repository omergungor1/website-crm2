import { isLineType } from "./annotations";

function getItemBounds(annotation) {
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

export function buildAlignableItems(nodes, annotations, nodeIds, annotationIds) {
  const items = [];

  for (const id of nodeIds) {
    const node = nodes.find((entry) => entry.id === id);
    if (!node) continue;
    items.push({
      id,
      kind: "node",
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    });
  }

  for (const id of annotationIds) {
    const annotation = annotations.find((entry) => entry.id === id);
    if (!annotation) continue;
    const bounds = getItemBounds(annotation);
    items.push({
      id,
      kind: "annotation",
      isLine: isLineType(annotation.type),
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  }

  return items;
}

function zeroMoves(items) {
  return items.map((item) => ({ id: item.id, kind: item.kind, dx: 0, dy: 0 }));
}

function alignLeft(items) {
  const minX = Math.min(...items.map((item) => item.x));
  return items.map((item) => ({ id: item.id, kind: item.kind, dx: minX - item.x, dy: 0 }));
}

function alignRight(items) {
  const maxRight = Math.max(...items.map((item) => item.x + item.width));
  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    dx: maxRight - (item.x + item.width),
    dy: 0,
  }));
}

function alignTop(items) {
  const minY = Math.min(...items.map((item) => item.y));
  return items.map((item) => ({ id: item.id, kind: item.kind, dx: 0, dy: minY - item.y }));
}

function alignBottom(items) {
  const maxBottom = Math.max(...items.map((item) => item.y + item.height));
  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    dx: 0,
    dy: maxBottom - (item.y + item.height),
  }));
}

function alignCenterHorizontal(items) {
  const minX = Math.min(...items.map((item) => item.x));
  const maxX = Math.max(...items.map((item) => item.x + item.width));
  const centerX = (minX + maxX) / 2;
  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    dx: centerX - (item.x + item.width / 2),
    dy: 0,
  }));
}

function alignCenterVertical(items) {
  const minY = Math.min(...items.map((item) => item.y));
  const maxY = Math.max(...items.map((item) => item.y + item.height));
  const centerY = (minY + maxY) / 2;
  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    dx: 0,
    dy: centerY - (item.y + item.height / 2),
  }));
}

function distributeHorizontal(items) {
  if (items.length < 3) return zeroMoves(items);

  const sorted = [...items].sort((a, b) => a.x - b.x);
  const totalWidth = sorted.reduce((sum, item) => sum + item.width, 0);
  const left = sorted[0].x;
  const right = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width;
  const gap = (right - left - totalWidth) / (sorted.length - 1);

  let cursor = left;
  const moveMap = new Map();
  for (const item of sorted) {
    moveMap.set(item.id, { dx: cursor - item.x, dy: 0 });
    cursor += item.width + gap;
  }

  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    dx: moveMap.get(item.id).dx,
    dy: 0,
  }));
}

function distributeVertical(items) {
  if (items.length < 3) return zeroMoves(items);

  const sorted = [...items].sort((a, b) => a.y - b.y);
  const totalHeight = sorted.reduce((sum, item) => sum + item.height, 0);
  const top = sorted[0].y;
  const bottom = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height;
  const gap = (bottom - top - totalHeight) / (sorted.length - 1);

  let cursor = top;
  const moveMap = new Map();
  for (const item of sorted) {
    moveMap.set(item.id, { dx: 0, dy: cursor - item.y });
    cursor += item.height + gap;
  }

  return items.map((item) => ({
    id: item.id,
    kind: item.kind,
    dx: 0,
    dy: moveMap.get(item.id).dy,
  }));
}

const ALIGN_ACTIONS = {
  left: alignLeft,
  centerX: alignCenterHorizontal,
  right: alignRight,
  top: alignTop,
  centerY: alignCenterVertical,
  bottom: alignBottom,
  distributeX: distributeHorizontal,
  distributeY: distributeVertical,
};

export function computeAlignmentMoves(action, items) {
  if (!items || items.length < 2) return [];
  const fn = ALIGN_ACTIONS[action];
  if (!fn) return [];
  return fn(items);
}

export const ALIGN_MENU_GROUPS = [
  {
    label: "Yatay",
    items: [
      { id: "left", label: "Sola hizala" },
      { id: "centerX", label: "Yatay ortala" },
      { id: "right", label: "Sağa hizala" },
      { id: "distributeX", label: "Eşit yatay aralık", minItems: 3 },
    ],
  },
  {
    label: "Dikey",
    items: [
      { id: "top", label: "Üste hizala" },
      { id: "centerY", label: "Dikey ortala" },
      { id: "bottom", label: "Alta hizala" },
      { id: "distributeY", label: "Eşit dikey aralık", minItems: 3 },
    ],
  },
];
