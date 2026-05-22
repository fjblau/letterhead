import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { letterhead, letterheadEphemera } from "@/db/schema";
import { eq, desc, asc, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const company = searchParams.get("company") || "";
    const era = searchParams.get("era") || "";
    const country = searchParams.get("country") || "";
    const documentType = searchParams.get("documentType") || "";
    const tag = searchParams.get("tag") || "";
    const sort = searchParams.get("sort") || "recently_added";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const conditions = [eq(letterhead.is_published, true)];

    if (search) {
      const formattedSearch = search
        .trim()
        .split(/\s+/)
        .map((word) => {
          const cleanWord = word.replace(/[^a-zA-Z0-9]/g, "");
          return cleanWord ? `${cleanWord}:*` : "";
        })
        .filter(Boolean)
        .join(" & ");

      if (formattedSearch) {
        conditions.push(
          sql`to_tsvector('english', coalesce(${letterhead.company_name}, '') || ' ' || coalesce(${letterhead.company_division}, '') || ' ' || coalesce(${letterhead.city}, '') || ' ' || coalesce(${letterhead.design_notes}, '') || ' ' || coalesce(array_to_string(${letterhead.tags}, ' '), '')) @@ to_tsquery('english', ${formattedSearch})`
        );
      }
    }

    if (company) {
      conditions.push(eq(letterhead.company_name, company));
    }

    if (era) {
      conditions.push(eq(letterhead.era, era));
    }

    if (country) {
      conditions.push(eq(letterhead.country, country));
    }

    if (documentType) {
      conditions.push(eq(letterhead.document_type, documentType));
    }

    if (tag) {
      conditions.push(sql`${tag} = ANY(${letterhead.tags})`);
    }

    let orderClause;
    if (sort === "newest") {
      orderClause = desc(sql`coalesce(${letterhead.year_exact}, ${letterhead.year_circa})`);
    } else if (sort === "oldest") {
      orderClause = asc(sql`coalesce(${letterhead.year_exact}, ${letterhead.year_circa})`);
    } else {
      orderClause = desc(letterhead.created_at);
    }

    const items = await db
      .select({
        id: letterhead.id,
        slug: letterhead.slug,
        company_name: letterhead.company_name,
        company_division: letterhead.company_division,
        city: letterhead.city,
        country: letterhead.country,
        year_exact: letterhead.year_exact,
        year_circa: letterhead.year_circa,
        era: letterhead.era,
        document_type: letterhead.document_type,
        tags: letterhead.tags,
        thumb_url: letterhead.thumb_url,
        thumb_width: letterhead.thumb_width,
        thumb_height: letterhead.thumb_height,
        is_published: letterhead.is_published,
        created_at: letterhead.created_at,
        published_at: letterhead.published_at,
        ephemeraCount: sql<number>`count(${letterheadEphemera.id})::int`,
      })
      .from(letterhead)
      .leftJoin(letterheadEphemera, eq(letterhead.id, letterheadEphemera.letterhead_id))
      .where(and(...conditions))
      .groupBy(letterhead.id)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch archive", error);
    return NextResponse.json({ error: "Failed to fetch archive" }, { status: 500 });
  }
}
