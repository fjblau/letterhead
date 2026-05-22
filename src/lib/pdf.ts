import { createCanvas } from "@napi-rs/canvas";
import * as path from "path";

export async function processPdf(pdfBuffer: Buffer): Promise<{ pageCount: number; thumbBuffer: Buffer; width: number; height: number }> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  
  pdfjs.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");

  const uint8Array = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjs.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    verbosity: 0,
  });

  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;

  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 2.0 });

  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const context = canvas.getContext("2d");

  const renderContext = {
    canvasContext: context as any,
    viewport: viewport,
    canvas: canvas as any,
  };

  await page.render(renderContext).promise;

  const thumbBuffer = await canvas.encode("webp", 90);

  await pdfDocument.destroy();

  return {
    pageCount,
    thumbBuffer,
    width: Math.round(viewport.width),
    height: Math.round(viewport.height),
  };
}
