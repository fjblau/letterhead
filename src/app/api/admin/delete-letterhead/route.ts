import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { letterhead } from "@/db/schema";
import { deleteFolder } from "@/lib/storage";
import { eq } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const letterheadId = searchParams.get("id");
    if (!letterheadId) {
      return NextResponse.json({ error: "Missing letterhead id" }, { status: 400 });
    }
    
    await deleteFolder(letterheadId);
    
    const deleted = await db.delete(letterhead).where(eq(letterhead.id, letterheadId)).returning();
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Letterhead not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { letterhead_id } = await request.json();
    if (!letterhead_id) {
      return NextResponse.json({ error: "Missing letterhead_id" }, { status: 400 });
    }
    
    await deleteFolder(letterhead_id);
    
    const deleted = await db.delete(letterhead).where(eq(letterhead.id, letterhead_id)).returning();
    if (deleted.length === 0) {
      return NextResponse.json({ error: "Letterhead not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, deleted: deleted[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
