export const CANVAS_WIDTH = 6000;
export const CANVAS_HEIGHT = 4500;

export const ANCHORS = ["top", "right", "bottom", "left"];

const LEGACY_ANCHOR_MAP = {
  "top-left": "top",
  "top-right": "top",
  "bottom-left": "bottom",
  "bottom-right": "bottom",
  left: "left",
  right: "right",
};

export const NODE_COLORS = [
  { id: "indigo", value: "#6366f1", label: "İndigo" },
  { id: "blue", value: "#3b82f6", label: "Mavi" },
  { id: "emerald", value: "#10b981", label: "Yeşil" },
  { id: "amber", value: "#f59e0b", label: "Amber" },
  { id: "rose", value: "#f43f5e", label: "Gül" },
  { id: "violet", value: "#8b5cf6", label: "Mor" },
  { id: "zinc", value: "#71717a", label: "Gri" },
  { id: "cyan", value: "#06b6d4", label: "Camgöbeği" },
];

/** Yeni şekil tabanlı tipler. Eski id’ler LEGACY_NODE_TYPE_MAP ile map edilir. */
export const NODE_TYPES = [
  { id: "square", label: "Kare", width: 120, height: 120, shape: "square" },
  { id: "rectangle", label: "Dikdörtgen", width: 200, height: 88, shape: "rectangle" },
  { id: "rounded", label: "Yuvarlatılmış", width: 210, height: 96, shape: "rounded" },
  { id: "circle", label: "Daire", width: 112, height: 112, shape: "circle" },
  { id: "ellipse", label: "Elips", width: 190, height: 100, shape: "ellipse" },
  { id: "diamond", label: "Yan Kare", width: 124, height: 124, shape: "diamond" },
];

const LEGACY_NODE_TYPE_MAP = {
  project: "rounded",
  milestone: "rectangle",
  step: "square",
  decision: "diamond",
  idea: "circle",
  launch: "ellipse",
};

export const DEFAULT_COLOR = NODE_COLORS[0].value;

export function emptyCanvasData() {
  return {
    viewport: { scrollX: 0, scrollY: 0 },
    nodes: [],
    edges: [],
    annotations: [],
  };
}

export function migrateAnchor(anchor) {
  if (ANCHORS.includes(anchor)) return anchor;
  return LEGACY_ANCHOR_MAP[anchor] || "top";
}

export function resolveNodeTypeId(typeId) {
  if (NODE_TYPES.some((t) => t.id === typeId)) return typeId;
  return LEGACY_NODE_TYPE_MAP[typeId] || NODE_TYPES[0].id;
}

export function getNodeTypeDef(typeId) {
  const id = resolveNodeTypeId(typeId);
  return NODE_TYPES.find((t) => t.id === id) || NODE_TYPES[0];
}

/** Toolbox / node kutusu için Tailwind şekil sınıfı */
export function nodeShapeClass(shape) {
  if (shape === "circle" || shape === "ellipse") return "rounded-full";
  if (shape === "diamond") return "rotate-45 rounded-sm";
  if (shape === "square") return "rounded-none";
  if (shape === "rectangle") return "rounded-none";
  if (shape === "rounded") return "rounded-2xl";
  return "rounded-xl";
}
