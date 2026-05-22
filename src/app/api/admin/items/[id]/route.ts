import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { letterhead, letterheadEphemera } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const item = await db
      .select()
      .from(letterhead)
      .where(eq(letterhead.id, id))
      .then((res) => res[0]);

    if (!item) {
      return NextResponse.json({ error: "Letterhead not found" }, { status: 404 });
    }

    const ephemera = await db
      .select()
      .from(letterheadEphemera)
      .where(eq(letterheadEphemera.letterhead_id, id))
      .orderBy(asc(letterheadEphemera.sort_order));

    return NextResponse.json({
      letterhead: item,
      ephemera,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify item exists
    const existing = await db
      .select()
      .from(letterhead)
      .where(eq(letterhead.id, id))
      .then((res) => res[0]);

    if (!existing) {
      return NextResponse.json({ error: "Letterhead not found" }, { status: 404 });
    }

    // Process fields
    const updateData: any = {};
    const fields = [
      "slug",
      "company_name",
      "company_division",
      "city",
      "country",
      "year_exact",
      "year_circa",
      "era",
      "document_type",
      "language",
      "recipient",
      "typewriter_models",
      "design_notes",
      "provenance",
      "source",
      "condition_notes",
      "tags",
      "is_published",
      "pdf_url",
      "pdf_size_bytes",
      "pdf_page_count",
      "thumb_url",
      "thumb_width",
      "thumb_height",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Always update updated_at
    updateData.updated_at = new Date();

    // Handle is_published logic for published_at
    if (body.is_published === true && !existing.is_published) {
      updateData.published_at = new Date();
    } else if (body.is_published === false && existing.is_published) {
      updateData.published_at = null;
    }

    const updated = await db
      .update(letterhead)
      .set(updateData)
      .where(eq(letterhead.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      letterhead: updated[0],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
