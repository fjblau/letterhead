import { NextResponse } from "next/server";
import { db } from "@/db";
import { letterhead } from "@/db/schema";
import { eq, desc, and, isNotNull, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companiesPromise = db
      .select({
        name: letterhead.company_name,
        count: sql<number>`count(*)::int`,
      })
      .from(letterhead)
      .where(eq(letterhead.is_published, true))
      .groupBy(letterhead.company_name)
      .orderBy(desc(sql`count(*)`));

    const erasPromise = db
      .select({
        name: letterhead.era,
        count: sql<number>`count(*)::int`,
      })
      .from(letterhead)
      .where(and(eq(letterhead.is_published, true), isNotNull(letterhead.era)))
      .groupBy(letterhead.era)
      .orderBy(desc(sql`count(*)`));

    const countriesPromise = db
      .select({
        name: letterhead.country,
        count: sql<number>`count(*)::int`,
      })
      .from(letterhead)
      .where(and(eq(letterhead.is_published, true), isNotNull(letterhead.country)))
      .groupBy(letterhead.country)
      .orderBy(desc(sql`count(*)`));

    const documentTypesPromise = db
      .select({
        name: letterhead.document_type,
        count: sql<number>`count(*)::int`,
      })
      .from(letterhead)
      .where(and(eq(letterhead.is_published, true), isNotNull(letterhead.document_type)))
      .groupBy(letterhead.document_type)
      .orderBy(desc(sql`count(*)`));

    const tagsPromise = db
      .select({
        name: sql<string>`tag`,
        count: sql<number>`count(*)::int`,
      })
      .from(
        sql`(SELECT unnest(${letterhead.tags}) AS tag FROM ${letterhead} WHERE ${letterhead.is_published} = true AND ${letterhead.tags} IS NOT NULL) AS t`
      )
      .groupBy(sql`tag`)
      .orderBy(desc(sql`count(*)`));

    const [companies, eras, countries, documentTypes, tags] = await Promise.all([
      companiesPromise,
      erasPromise,
      countriesPromise,
      documentTypesPromise,
      tagsPromise,
    ]);

    return NextResponse.json({
      companies: companies.filter((c) => c.name !== null),
      eras: eras.filter((e) => e.name !== null),
      countries: countries.filter((c) => c.name !== null),
      documentTypes: documentTypes.filter((d) => d.name !== null),
      tags: tags.filter((t) => t.name !== null),
    });
  } catch (error) {
    console.error("Failed to fetch facets", error);
    return NextResponse.json({ error: "Failed to fetch facets" }, { status: 500 });
  }
}
