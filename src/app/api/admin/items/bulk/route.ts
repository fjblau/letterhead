import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { letterhead } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { deleteFolder, uploadBlob } from "@/lib/storage";
import { processPdf } from "@/lib/pdf";

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

export async function POST(request: NextRequest) {
  try {
    const { action, ids, tags } = await request.json();

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid action or empty ids array" }, { status: 400 });
    }

    if (action === "publish") {
      const updated = await db
        .update(letterhead)
        .set({
          is_published: true,
          published_at: new Date(),
          updated_at: new Date(),
        })
        .where(inArray(letterhead.id, ids))
        .returning();
      return NextResponse.json({ success: true, count: updated.length });
    }

    if (action === "unpublish") {
      const updated = await db
        .update(letterhead)
        .set({
          is_published: false,
          published_at: null,
          updated_at: new Date(),
        })
        .where(inArray(letterhead.id, ids))
        .returning();
      return NextResponse.json({ success: true, count: updated.length });
    }

    if (action === "delete") {
      // Clean up files in Vercel Blob for all selected items
      for (const id of ids) {
        await deleteFolder(id);
      }
      
      const deleted = await db
        .delete(letterhead)
        .where(inArray(letterhead.id, ids))
        .returning();
      return NextResponse.json({ success: true, count: deleted.length });
    }

    if (action === "tag") {
      if (!tags || !Array.isArray(tags)) {
        return NextResponse.json({ error: "Missing or invalid tags parameter" }, { status: 400 });
      }

      const items = await db.select().from(letterhead).where(inArray(letterhead.id, ids));
      let countUpdated = 0;

      for (const item of items) {
        const existingTags = item.tags || [];
        const mergedTags = Array.from(new Set([...existingTags, ...tags]));
        await db
          .update(letterhead)
          .set({
            tags: mergedTags,
            updated_at: new Date(),
          })
          .where(eq(letterhead.id, item.id));
        countUpdated++;
      }

      return NextResponse.json({ success: true, count: countUpdated });
    }

    if (action === "regenerate-thumbnail") {
      const items = await db.select().from(letterhead).where(inArray(letterhead.id, ids));
      let successCount = 0;

      for (const item of items) {
        if (!item.pdf_url) continue;

        try {
          let fileBuffer: Buffer;
          if (item.pdf_url.startsWith("https://mock-blob") || process.env.MOCK_STORAGE === "true") {
            fileBuffer = minPdfBuffer;
          } else {
            const res = await fetch(item.pdf_url);
            if (!res.ok) throw new Error("Failed to fetch PDF file from Blob");
            const arr = await res.arrayBuffer();
            fileBuffer = Buffer.from(arr);
          }

          const { pageCount, thumbBuffer, width, height } = await processPdf(fileBuffer);
          const thumbUrl = await uploadBlob(`${item.id}/thumb.webp`, thumbBuffer, "image/webp");

          await db
            .update(letterhead)
            .set({
              thumb_url: thumbUrl,
              thumb_width: width,
              thumb_height: height,
              pdf_page_count: pageCount,
              updated_at: new Date(),
            })
            .where(eq(letterhead.id, item.id));

          successCount++;
        } catch (err) {
          console.error(`Failed to regenerate thumbnail for letterhead ${item.id}:`, err);
        }
      }

      return NextResponse.json({ success: true, count: successCount });
    }

    return NextResponse.json({ error: "Unsupported bulk action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
