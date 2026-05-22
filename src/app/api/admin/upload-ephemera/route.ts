import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { letterhead, letterheadEphemera } from "@/db/schema";
import { processEphemeraFile } from "@/lib/ephemera";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const letterheadId = formData.get("letterhead_id") as string | null;
    const role = formData.get("role") as string | null;
    const caption = formData.get("caption") as string | null;
    const description = formData.get("description") as string | null;
    const sortOrderStr = formData.get("sort_order") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!letterheadId) {
      return NextResponse.json({ error: "Missing letterhead_id" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(letterhead)
      .where(eq(letterhead.id, letterheadId));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Letterhead record not found" }, { status: 404 });
    }

    const inserted = await db
      .insert(letterheadEphemera)
      .values({
        letterhead_id: letterheadId,
        kind: "unknown",
        sort_order: sortOrderStr ? parseInt(sortOrderStr, 10) : 0,
        role: role || null,
        caption: caption || null,
        description: description || null,
      })
      .returning();

    if (!inserted[0]) {
      return NextResponse.json({ error: "Failed to create ephemera record" }, { status: 500 });
    }

    const ephemeraId = inserted[0].id;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const result = await processEphemeraFile(letterheadId, ephemeraId, fileBuffer, file.name, file.type);

    const updated = await db
      .update(letterheadEphemera)
      .set({
        kind: result.kind,
        mime_type: result.mimeType,
        file_url: result.fileUrl,
        file_size_bytes: result.fileSizeBytes,
        thumb_url: result.thumbUrl || null,
        width: result.width || null,
        height: result.height || null,
        page_count: result.pageCount || null,
        updated_at: new Date(),
      })
      .where(eq(letterheadEphemera.id, ephemeraId))
      .returning();

    return NextResponse.json({
      success: true,
      ephemera: updated[0],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
