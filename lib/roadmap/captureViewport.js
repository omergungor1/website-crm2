import { toPng } from "html-to-image";

const IMAGE_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const MAX_CAPTURE_PIXELS = 24_000_000;
const GRID_BACKGROUND_IMAGE =
  "radial-gradient(circle, rgb(161 161 170 / 0.35) 1px, transparent 1px)";
const IMAGE_INLINE_TIMEOUT_MS = 8000;

function shouldHideInSnapshot(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.dataset.roadmapAnchor !== undefined) return true;
  if (node.dataset.roadmapLineHandle !== undefined) return true;
  if (node.dataset.roadmapFrameHandle !== undefined) return true;
  if (node.dataset.roadmapResizeHandle !== undefined) return true;
  if (node.tagName === "IFRAME") return true;
  if (node.dataset.roadmapSnapshotHide !== undefined) return true;
  return false;
}

function getSnapshotBackground() {
  if (typeof document === "undefined") return "#f4f4f5";
  return document.documentElement.classList.contains("dark") ? "#09090b" : "#f4f4f5";
}

function isCrossOriginUrl(src) {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return false;
  try {
    const url = new URL(src, window.location.href);
    return url.origin !== window.location.origin;
  } catch {
    return false;
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function waitForImageLoad(img) {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    setTimeout(done, IMAGE_INLINE_TIMEOUT_MS);
  });
}

async function fetchImageBlob(url) {
  try {
    const direct = await fetch(url, { mode: "cors", credentials: "omit" });
    if (direct.ok) {
      const blob = await direct.blob();
      if (blob.size > 0) return blob;
    }
  } catch {
    // CORS veya ağ hatası — proxy ile dene
  }

  const proxyRes = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  if (!proxyRes.ok) return null;
  const blob = await proxyRes.blob();
  return blob.size > 0 ? blob : null;
}

async function inlineCrossOriginImages(root) {
  const replacements = [];
  const images = [...root.querySelectorAll("img")];

  await Promise.all(
    images.map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || !isCrossOriginUrl(src)) return;

      try {
        const blob = await fetchImageBlob(src);
        if (!blob) return;
        const dataUrl = await blobToDataUrl(blob);
        if (!dataUrl || typeof dataUrl !== "string") return;

        replacements.push({
          img,
          originalSrc: src,
          originalSrcset: img.getAttribute("srcset"),
        });
        img.removeAttribute("srcset");
        img.src = dataUrl;
        await waitForImageLoad(img);
      } catch {
        // Görsel inline edilemezse canvas'ta görünmez; snapshot yine alınır
      }
    })
  );

  return replacements;
}

function restoreInlinedImages(replacements) {
  replacements.forEach(({ img, originalSrc, originalSrcset }) => {
    img.src = originalSrc;
    if (originalSrcset) img.setAttribute("srcset", originalSrcset);
    else img.removeAttribute("srcset");
  });
}

function resolvePixelRatio(canvasWidth, canvasHeight) {
  const area = canvasWidth * canvasHeight;
  const deviceRatio = window.devicePixelRatio || 1;
  let pixelRatio = Math.min(2, Math.max(1, deviceRatio));

  if (area * pixelRatio * pixelRatio > MAX_CAPTURE_PIXELS) {
    pixelRatio = Math.max(1, Math.sqrt(MAX_CAPTURE_PIXELS / area));
  }

  return pixelRatio;
}

function buildCaptureOptions(targetEl, pixelRatio, width, height) {
  return {
    pixelRatio,
    cacheBust: true,
    backgroundColor: getSnapshotBackground(),
    width,
    height,
    skipFonts: true,
    imagePlaceholder: IMAGE_PLACEHOLDER,
    onImageErrorHandler: () => undefined,
    style: {
      margin: "0",
      overflow: "visible",
      transform: "none",
    },
    filter: (node) => !shouldHideInSnapshot(node),
    fetchRequestInit: {
      mode: "cors",
      credentials: "omit",
    },
  };
}

function stashInlineStyles(el, keys) {
  const saved = {};
  for (const key of keys) {
    saved[key] = el.style[key];
  }
  return saved;
}

function restoreInlineStyles(el, saved) {
  for (const [key, value] of Object.entries(saved)) {
    el.style[key] = value;
  }
}

/**
 * Tüm roadmap canvas'ını (görünür alan değil, tam sayfa) yüksek çözünürlükte PNG olarak yakalar.
 */
export async function captureRoadmapCanvas(viewportEl, canvasEl, { canvasWidth, canvasHeight, zoom }) {
  if (!viewportEl || !canvasEl) throw new Error("Canvas alanı bulunamadı");

  const wrapperEl = canvasEl.parentElement;
  if (!wrapperEl) throw new Error("Canvas sarmalayıcısı bulunamadı");

  const pixelRatio = resolvePixelRatio(canvasWidth, canvasHeight);
  const inlinedImages = await inlineCrossOriginImages(canvasEl);

  const savedViewportScroll = { left: viewportEl.scrollLeft, top: viewportEl.scrollTop };
  const savedWrapper = stashInlineStyles(wrapperEl, ["width", "height", "overflow"]);
  const savedCanvas = stashInlineStyles(canvasEl, [
    "transform",
    "width",
    "height",
    "backgroundColor",
    "backgroundImage",
    "backgroundSize",
  ]);
  const savedViewportOverflow = viewportEl.style.overflow;

  try {
    viewportEl.scrollLeft = 0;
    viewportEl.scrollTop = 0;
    viewportEl.style.overflow = "hidden";

    wrapperEl.style.width = `${canvasWidth}px`;
    wrapperEl.style.height = `${canvasHeight}px`;
    wrapperEl.style.overflow = "visible";

    canvasEl.style.transform = "none";
    canvasEl.style.width = `${canvasWidth}px`;
    canvasEl.style.height = `${canvasHeight}px`;
    canvasEl.style.backgroundColor = getSnapshotBackground();
    canvasEl.style.backgroundImage = GRID_BACKGROUND_IMAGE;
    canvasEl.style.backgroundSize = "24px 24px";

    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const dataUrl = await toPng(
      canvasEl,
      buildCaptureOptions(canvasEl, pixelRatio, canvasWidth, canvasHeight)
    );

    if (!dataUrl || !dataUrl.startsWith("data:image")) {
      throw new Error("Snapshot görüntüsü oluşturulamadı");
    }

    const response = await fetch(dataUrl);
    const blob = await response.blob();

    if (!blob.size) {
      throw new Error("Snapshot dosyası boş oluşturuldu");
    }

    return {
      blob,
      width: Math.round(canvasWidth * pixelRatio),
      height: Math.round(canvasHeight * pixelRatio),
      zoom,
      scrollX: savedViewportScroll.left,
      scrollY: savedViewportScroll.top,
    };
  } catch (err) {
    const message = err?.message || "";
    if (/fetch|CORS|tainted|security/i.test(message)) {
      throw new Error(
        "Snapshot alınamadı: bazı harici görseller yüklenemedi. URL'leri kontrol edip tekrar deneyin."
      );
    }
    throw new Error(message || "Snapshot alınamadı");
  } finally {
    restoreInlineStyles(wrapperEl, savedWrapper);
    restoreInlineStyles(canvasEl, savedCanvas);
    viewportEl.style.overflow = savedViewportOverflow;
    viewportEl.scrollLeft = savedViewportScroll.left;
    viewportEl.scrollTop = savedViewportScroll.top;
    restoreInlinedImages(inlinedImages);
  }
}

/** @deprecated captureRoadmapCanvas kullanın */
export async function captureRoadmapViewport(viewportEl, canvasEl, options) {
  return captureRoadmapCanvas(viewportEl, canvasEl, options);
}
