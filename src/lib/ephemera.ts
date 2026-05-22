import { uploadBlob } from "./storage";
import { processPdf } from "./pdf";
import { createCanvas } from "@napi-rs/canvas";
import sharp from "sharp";
import heicConvert from "heic-convert";

export interface ProcessedEphemera {
  kind: "image" | "pdf" | "audio" | "unknown";
  mimeType: string;
  fileUrl: string;
  fileSizeBytes: number;
  thumbUrl?: string;
  width?: number;
  height?: number;
  pageCount?: number;
  largeUrl?: string;
}

export async function processEphemeraFile(
  letterheadId: string,
  ephemeraId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ProcessedEphemera> {
  const normalizedMime = mimeType.toLowerCase();
  const normalizedName = fileName.toLowerCase();

  const isHeic = normalizedMime.includes("heic") || normalizedMime.includes("heif") || normalizedName.endsWith(".heic") || normalizedName.endsWith(".heif");
  const isImage = isHeic || normalizedMime.startsWith("image/") || normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg") || normalizedName.endsWith(".png") || normalizedName.endsWith(".tiff");

  if (isImage) {
    let activeBuffer = fileBuffer;
    let activeMime = mimeType;
    let activeName = fileName;

    if (isHeic) {
      const converted = await heicConvert({
        buffer: fileBuffer as any,
        format: "JPEG",
        quality: 1,
      });
      activeBuffer = Buffer.from(converted);
      activeMime = "image/jpeg";
      activeName = fileName.replace(/\.(heic|heif)$/i, ".jpg");
    }

    const metadata = await sharp(activeBuffer).metadata();
    const origWidth = metadata.width || 0;
    const origHeight = metadata.height || 0;

    const thumbBuffer = await sharp(activeBuffer)
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    let largeUrl: string | undefined;
    if (origWidth > 1600) {
      const largeBuffer = await sharp(activeBuffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      largeUrl = await uploadBlob(`${letterheadId}/ephemera/${ephemeraId}/large.webp`, largeBuffer, "image/webp");
    }

    const ext = activeName.split(".").pop() || "bin";
    const fileUrl = await uploadBlob(`${letterheadId}/ephemera/${ephemeraId}/original.${ext}`, activeBuffer, activeMime);
    const thumbUrl = await uploadBlob(`${letterheadId}/ephemera/${ephemeraId}/thumb.webp`, thumbBuffer, "image/webp");

    return {
      kind: "image",
      mimeType: activeMime,
      fileUrl,
      fileSizeBytes: activeBuffer.length,
      thumbUrl,
      width: origWidth,
      height: origHeight,
      largeUrl,
    };
  }

  const isPdf = normalizedMime === "application/pdf" || normalizedName.endsWith(".pdf");
  if (isPdf) {
    const { pageCount, thumbBuffer, width, height } = await processPdf(fileBuffer);

    const fileUrl = await uploadBlob(`${letterheadId}/ephemera/${ephemeraId}/document.pdf`, fileBuffer, "application/pdf");
    const thumbUrl = await uploadBlob(`${letterheadId}/ephemera/${ephemeraId}/thumb.webp`, thumbBuffer, "image/webp");

    return {
      kind: "pdf",
      mimeType: "application/pdf",
      fileUrl,
      fileSizeBytes: fileBuffer.length,
      thumbUrl,
      width,
      height,
      pageCount,
    };
  }

  const isAudio = normalizedMime.startsWith("audio/") || normalizedName.endsWith(".mp3") || normalizedName.endsWith(".wav") || normalizedName.endsWith(".ogg") || normalizedName.endsWith(".m4a");
  if (isAudio) {
    const ext = fileName.split(".").pop() || "bin";
    const fileUrl = await uploadBlob(`${letterheadId}/ephemera/${ephemeraId}/original.${ext}`, fileBuffer, mimeType);

    const canvas = createCanvas(600, 200);
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 600, 200);
    
    ctx.fillStyle = "#38bdf8";
    const barWidth = 4;
    const gap = 2;
    const count = 80;
    for (let i = 0; i < count; i++) {
      const x = 60 + i * (barWidth + gap);
      const wave = Math.sin(i * 0.15) * Math.cos(i * 0.08);
      const height = Math.abs(wave) * 140 + 10;
      const y = 100 - height / 2;
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, height, 2);
      } else {
        ctx.rect(x, y, barWidth, height);
      }
      ctx.fill();
    }

    const thumbBuffer = await canvas.encode("webp", 90);
    const thumbUrl = await uploadBlob(`${letterheadId}/ephemera/${ephemeraId}/thumb.webp`, thumbBuffer, "image/webp");

    return {
      kind: "audio",
      mimeType,
      fileUrl,
      fileSizeBytes: fileBuffer.length,
      thumbUrl,
      width: 600,
      height: 200,
    };
  }

  const ext = fileName.split(".").pop() || "bin";
  const fileUrl = await uploadBlob(`${letterheadId}/ephemera/${ephemeraId}/original.${ext}`, fileBuffer, mimeType);
  return {
    kind: "unknown",
    mimeType,
    fileUrl,
    fileSizeBytes: fileBuffer.length,
  };
}
