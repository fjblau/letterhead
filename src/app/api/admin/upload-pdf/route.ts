import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { letterhead } from "@/db/schema";
import { processPdf } from "@/lib/pdf";
import { uploadBlob } from "@/lib/storage";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    let letterheadId = formData.get("letterhead_id") as string | null;
    const companyName = formData.get("company_name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "File is not a PDF" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { pageCount, thumbBuffer, width, height } = await processPdf(fileBuffer);

    let isNew = false;
    if (!letterheadId) {
      const inserted = await db
        .insert(letterhead)
        .values({
          company_name: companyName || "Uploaded Document",
          is_published: false,
        })
        .returning();
      
      if (!inserted[0]) {
        return NextResponse.json({ error: "Failed to create letterhead record" }, { status: 500 });
      }
      letterheadId = inserted[0].id;
      isNew = true;
    } else {
      const existing = await db
        .select()
        .from(letterhead)
        .where(eq(letterhead.id, letterheadId));
      if (existing.length === 0) {
        return NextResponse.json({ error: "Letterhead record not found" }, { status: 404 });
      }
    }

    const pdfUrl = await uploadBlob(`${letterheadId}/document.pdf`, fileBuffer, "application/pdf");
    const thumbUrl = await uploadBlob(`${letterheadId}/thumb.webp`, thumbBuffer, "image/webp");

    const updated = await db
      .update(letterhead)
      .set({
        pdf_url: pdfUrl,
        pdf_size_bytes: fileBuffer.length,
        pdf_page_count: pageCount,
        thumb_url: thumbUrl,
        thumb_width: width,
        thumb_height: height,
        updated_at: new Date(),
      })
      .where(eq(letterhead.id, letterheadId))
      .returning();

    return NextResponse.json({
      success: true,
      letterhead: updated[0],
      isNew,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
