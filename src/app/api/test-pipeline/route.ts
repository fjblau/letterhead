import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { letterhead } from "@/db/schema";
import { processPdf } from "@/lib/pdf";
import { processEphemeraFile } from "@/lib/ephemera";
import { deleteFolder } from "@/lib/storage";
import { createCanvas } from "@napi-rs/canvas";
import { eq } from "drizzle-orm";

const minPdfBuffer = Buffer.from(
  "%PDF-1.4\n" +
  "1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n" +
  "2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj\n" +
  "3 0 obj <</Type/Page/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/MediaBox[0 0 595 842]/Contents 5 0 R>> endobj\n" +
  "4 0 obj <</Type/Font/Subtype/Type1/BaseFont/Helvetica>> endobj\n" +
  "5 0 obj <</Length 44>> stream\n" +
  "BT /F1 12 Tf 72 712 Td (Hello World) Tj ET\n" +
  "endstream\n" +
  "endobj\n" +
  "xref\n" +
  "0 6\n" +
  "0000000000 65535 f \n" +
  "0000000009 00000 n \n" +
  "0000000053 00000 n \n" +
  "0000000100 00000 n \n" +
  "0000000213 00000 n \n" +
  "0000000282 00000 n \n" +
  "trailer <</Size 6/Root 1 0 R>>\n" +
  "startxref\n" +
  "375\n" +
  "%%EOF"
);

export async function GET(request: NextRequest) {
  try {
    const inserted = await db
      .insert(letterhead)
      .values({
        company_name: "Pipeline Test Co",
        is_published: false,
      })
      .returning();
    
    if (inserted.length === 0) {
      throw new Error("Failed to insert test letterhead");
    }

    const testId = inserted[0].id;
    const results: any = {
      letterheadId: testId,
      pdfTest: null,
      imageEphemeraTest: null,
      audioEphemeraTest: null,
      cleanupTest: null,
    };

    try {
      const pdfRes = await processPdf(minPdfBuffer);
      results.pdfTest = {
        success: true,
        pageCount: pdfRes.pageCount,
        thumbSize: pdfRes.thumbBuffer.length,
        dimensions: `${pdfRes.width}x${pdfRes.height}`,
      };
    } catch (e: any) {
      results.pdfTest = { success: false, error: e.message };
    }

    try {
      const canvas = createCanvas(200, 200);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, 200, 200);
      const imgBuffer = await canvas.encode("png");

      const imgRes = await processEphemeraFile(testId, "test-img-ephemera", imgBuffer, "test.png", "image/png");
      results.imageEphemeraTest = {
        success: true,
        kind: imgRes.kind,
        fileUrl: imgRes.fileUrl,
        thumbUrl: imgRes.thumbUrl,
        dimensions: `${imgRes.width}x${imgRes.height}`,
      };
    } catch (e: any) {
      results.imageEphemeraTest = { success: false, error: e.message };
    }

    try {
      const audioBuffer = Buffer.alloc(100);
      const audioRes = await processEphemeraFile(testId, "test-aud-ephemera", audioBuffer, "test.mp3", "audio/mpeg");
      results.audioEphemeraTest = {
        success: true,
        kind: audioRes.kind,
        fileUrl: audioRes.fileUrl,
        thumbUrl: audioRes.thumbUrl,
      };
    } catch (e: any) {
      results.audioEphemeraTest = { success: false, error: e.message };
    }

    try {
      await deleteFolder(testId);
      await db.delete(letterhead).where(eq(letterhead.id, testId));
      results.cleanupTest = { success: true };
    } catch (e: any) {
      results.cleanupTest = { success: false, error: e.message };
    }

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
