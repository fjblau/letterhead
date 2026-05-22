import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { letterheadEphemera } from "@/db/schema";
import { deleteFolder } from "@/lib/storage";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ephemera id" }, { status: 400 });
    }

    const item = await db
      .select()
      .from(letterheadEphemera)
      .where(eq(letterheadEphemera.id, id))
      .then((res) => res[0]);

    if (!item) {
      return NextResponse.json({ error: "Ephemera record not found" }, { status: 404 });
    }

    // Vercel Blob Cleanup
    const prefix = `${item.letterhead_id}/ephemera/${id}`;
    await deleteFolder(prefix);

    // Database Cleanup
    const deleted = await db
      .delete(letterheadEphemera)
      .where(eq(letterheadEphemera.id, id))
      .returning();

    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, role, caption, description } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Missing ephemera id" }, { status: 400 });
    }

    const updated = await db
      .update(letterheadEphemera)
      .set({
        role: role !== undefined ? role : undefined,
        caption: caption !== undefined ? caption : undefined,
        description: description !== undefined ? description : undefined,
        updated_at: new Date(),
      })
      .where(eq(letterheadEphemera.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Ephemera record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ephemera: updated[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Support POST as a fallback for standard form requests/fallbacks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || body.ephemera_id;
    if (!id) {
      return NextResponse.json({ error: "Missing ephemera id" }, { status: 400 });
    }

    const item = await db
      .select()
      .from(letterheadEphemera)
      .where(eq(letterheadEphemera.id, id))
      .then((res) => res[0]);

    if (!item) {
      return NextResponse.json({ error: "Ephemera record not found" }, { status: 404 });
    }

    // Vercel Blob Cleanup
    const prefix = `${item.letterhead_id}/ephemera/${id}`;
    await deleteFolder(prefix);

    // Database Cleanup
    const deleted = await db
      .delete(letterheadEphemera)
      .where(eq(letterheadEphemera.id, id))
      .returning();

    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
