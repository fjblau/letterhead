import { db } from "@/db";
import { letterhead, letterheadEphemera } from "@/db/schema";
import { eq, and, ne, sql, desc } from "drizzle-orm";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import LetterheadCard from "@/components/LetterheadCard";
import DetailClient from "@/components/DetailClient";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Landmark, Calendar, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArchiveDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const [item] = await db
    .select()
    .from(letterhead)
    .where(and(eq(letterhead.is_published, true), eq(letterhead.slug, decodedSlug)))
    .limit(1);

  if (!item) {
    notFound();
  }

  const ephemeraList = await db
    .select()
    .from(letterheadEphemera)
    .where(eq(letterheadEphemera.letterhead_id, item.id))
    .orderBy(letterheadEphemera.sort_order);

  const companyRecommendations = await db
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
    .where(
      and(
        eq(letterhead.is_published, true),
        eq(letterhead.company_name, item.company_name),
        ne(letterhead.id, item.id)
      )
    )
    .groupBy(letterhead.id)
    .orderBy(desc(letterhead.created_at))
    .limit(4);

  const eraRecommendations = item.era
    ? await db
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
        .where(
          and(
            eq(letterhead.is_published, true),
            eq(letterhead.era, item.era),
            ne(letterhead.id, item.id),
            ne(letterhead.company_name, item.company_name)
          )
        )
        .groupBy(letterhead.id)
        .orderBy(desc(letterhead.created_at))
        .limit(4)
    : [];

  const formatEra = (eraStr: string | null) => {
    if (!eraStr) return "";
    return eraStr
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="bg-[#FAF6ED] min-h-screen flex flex-col text-[#2C2621]">
      <PublicHeader />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-16">
        <DetailClient item={item} ephemera={ephemeraList} />

        {companyRecommendations.length > 0 && (
          <section className="border-t border-[#DED4C7] pt-12">
            <div className="flex flex-col sm:flex-row items-baseline justify-between border-b-2 border-double border-[#DED4C7] pb-4 mb-8">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-[#5C5045]" />
                <h2 className="font-serif text-lg sm:text-xl font-bold uppercase tracking-wider text-[#2C2621]">
                  More from {item.company_name}
                </h2>
              </div>
              <Link
                href={`/archive/company/${encodeURIComponent(item.company_name)}`}
                className="font-serif text-xs uppercase tracking-wider text-[#8C7A6B] font-bold hover:text-[#2C2621] flex items-center gap-1 mt-2 sm:mt-0 transition-colors"
              >
                View All Company Items
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {companyRecommendations.map((rec) => (
                <LetterheadCard
                  key={rec.id}
                  id={rec.id}
                  slug={rec.slug}
                  company_name={rec.company_name}
                  city={rec.city}
                  country={rec.country}
                  year_exact={rec.year_exact}
                  year_circa={rec.year_circa}
                  era={rec.era}
                  document_type={rec.document_type}
                  thumb_url={rec.thumb_url}
                  ephemeraCount={rec.ephemeraCount}
                />
              ))}
            </div>
          </section>
        )}

        {eraRecommendations.length > 0 && (
          <section className="border-t border-[#DED4C7] pt-12">
            <div className="flex flex-col sm:flex-row items-baseline justify-between border-b-2 border-double border-[#DED4C7] pb-4 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#5C5045]" />
                <h2 className="font-serif text-lg sm:text-xl font-bold uppercase tracking-wider text-[#2C2621]">
                  More from the {formatEra(item.era)} Era
                </h2>
              </div>
              {item.era && (
                <Link
                  href={`/archive/era/${encodeURIComponent(item.era)}`}
                  className="font-serif text-xs uppercase tracking-wider text-[#8C7A6B] font-bold hover:text-[#2C2621] flex items-center gap-1 mt-2 sm:mt-0 transition-colors"
                >
                  View All Era Items
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {eraRecommendations.map((rec) => (
                <LetterheadCard
                  key={rec.id}
                  id={rec.id}
                  slug={rec.slug}
                  company_name={rec.company_name}
                  city={rec.city}
                  country={rec.country}
                  year_exact={rec.year_exact}
                  year_circa={rec.year_circa}
                  era={rec.era}
                  document_type={rec.document_type}
                  thumb_url={rec.thumb_url}
                  ephemeraCount={rec.ephemeraCount}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
