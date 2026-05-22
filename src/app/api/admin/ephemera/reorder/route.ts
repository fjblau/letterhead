import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/db";
import { letterheadEphemera } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
  try {
    const { items } = await request.json();
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Missing or invalid items array" }, { status: 400 });
    }

    await Promise.all(
      items.map((item: any) => {
        if (!item.id || typeof item.sort_order !== "number") {
          throw new Error("Invalid item format in request");
        }
        return db
          .update(letterheadEphemera)
          .set({
            sort_order: item.sort_order,
            updated_at: new Date(),
          })
          .where(eq(letterheadEphemera.id, item.id));
      })
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
