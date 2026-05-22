import { db } from "@/db";
import { letterhead, letterheadEphemera } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import EditItemClient from "./EditItemClient";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const item = await db
    .select()
    .from(letterhead)
    .where(eq(letterhead.id, id))
    .then((res) => res[0]);

  if (!item) {
    notFound();
  }

  const ephemera = await db
    .select()
    .from(letterheadEphemera)
    .where(eq(letterheadEphemera.letterhead_id, id))
    .orderBy(asc(letterheadEphemera.sort_order));

  return <EditItemClient initialItem={item} initialEphemera={ephemera} />;
}
