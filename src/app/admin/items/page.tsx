import { db } from "@/db";
import { letterhead } from "@/db/schema";
import { desc } from "drizzle-orm";
import ItemsClient from "./ItemsClient";

export const dynamic = "force-dynamic";

export default async function AdminItemsPage() {
  const items = await db
    .select()
    .from(letterhead)
    .orderBy(desc(letterhead.created_at));

  return <ItemsClient initialItems={items} />;
}
