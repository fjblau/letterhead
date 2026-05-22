import { db } from "@/db";
import { letterhead, letterheadEphemera } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import LetterheadCard from "@/components/LetterheadCard";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ era: string }>;
}

export default async function EraArchivePage({ params }: PageProps) {
  const { era } = await params;
  const decodedEra = decodeURIComponent(era);

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
    .where(and(eq(letterhead.is_published, true), eq(letterhead.era, decodedEra)))
    .groupBy(letterhead.id)
    .orderBy(desc(letterhead.created_at));

  const prettifyEra = (slug: string) => {
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="bg-[#FAF6ED] min-h-screen flex flex-col text-[#2C2621]">
      <PublicHeader />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <Link
            href="/archive"
            className="inline-flex items-center gap-2 font-serif text-xs uppercase tracking-wider text-[#8C7A6B] font-bold hover:text-[#2C2621] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Archive
          </Link>
        </div>

        <section className="relative bg-[#FCFBF7] border border-[#E3DAC9] p-8 mb-12 before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] before:pointer-events-none shadow-sm text-center">
          <Calendar className="h-10 w-10 text-[#5C5045] mx-auto mb-4" />
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#2C2621] tracking-tight uppercase tracking-widest mb-3">
            {prettifyEra(decodedEra)}
          </h2>
          <p className="font-serif text-sm italic text-[#5C5045]">
            Corporate correspondence artifacts belonging to this design and industrial period.
          </p>
        </section>

        <section>
          {items.length === 0 ? (
            <div className="text-center py-16 bg-[#FCFBF7] border border-[#E3DAC9] before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] relative p-8">
              <p className="font-serif text-[#6E6155] italic">
                No published specimens found for this era.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {items.map((item) => (
                <LetterheadCard
                  key={item.id}
                  id={item.id}
                  slug={item.slug}
                  company_name={item.company_name}
                  city={item.city}
                  country={item.country}
                  year_exact={item.year_exact}
                  year_circa={item.year_circa}
                  era={item.era}
                  document_type={item.document_type}
                  thumb_url={item.thumb_url}
                  ephemeraCount={item.ephemeraCount}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
