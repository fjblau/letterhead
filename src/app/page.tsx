import { db } from "@/db";
import { letterhead, letterheadEphemera } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import LetterheadCard from "@/components/LetterheadCard";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const recentItems = await db
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
    .where(eq(letterhead.is_published, true))
    .groupBy(letterhead.id)
    .orderBy(desc(letterhead.published_at), desc(letterhead.created_at))
    .limit(12);

  return (
    <div className="bg-[#FAF6ED] min-h-screen flex flex-col text-[#2C2621]">
      <PublicHeader />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="relative bg-[#FCFBF7] border border-[#E3DAC9] p-8 sm:p-12 mb-12 text-center before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] before:pointer-events-none shadow-sm">
          <div className="max-w-3xl mx-auto">
            <span className="font-serif text-xs uppercase tracking-widest text-[#8C7A6B] font-semibold block mb-3">
              Established 2026
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#2C2621] tracking-tight mb-6">
              Preserving the Art of Business Correspondence
            </h2>
            <div className="h-[2px] w-24 bg-[#DED4C7] mx-auto mb-6 relative">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FAF6ED] border border-[#DED4C7] rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#5C5045] rounded-full" />
              </div>
            </div>
            <p className="font-serif text-base sm:text-lg text-[#5C5045] italic leading-relaxed mb-8">
              Explore a curated repository of corporate typography, hand-drawn logos, lithographs, and administrative ephemera from the golden age of physical mail. Each specimen represents a window into the evolution of branding, trade, and communication styles.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/archive"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#5C5045] text-white font-serif text-sm uppercase tracking-wider font-semibold px-6 py-3 border border-[#4A3F35] hover:bg-[#2C2621] transition-all"
              >
                Enter the Archive
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-[#5C5045] font-serif text-sm uppercase tracking-wider font-semibold px-6 py-3 border border-[#DED4C7] hover:bg-[#FCFBF7] transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="flex flex-col sm:flex-row items-baseline justify-between border-b-2 border-double border-[#DED4C7] pb-4 mb-8">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#5C5045]" />
              <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-[#2C2621]">
                Recently Added Specimens
              </h2>
            </div>
            <Link
              href="/archive"
              className="font-serif text-xs uppercase tracking-wider text-[#8C7A6B] font-bold hover:text-[#2C2621] flex items-center gap-1 mt-2 sm:mt-0 transition-colors"
            >
              View Full Gallery
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentItems.length === 0 ? (
            <div className="text-center py-16 bg-[#FCFBF7] border border-[#E3DAC9] before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] relative p-8">
              <p className="font-serif text-[#6E6155] italic">
                The archives are currently being cataloged. Please check back shortly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {recentItems.map((item) => (
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

        <section className="bg-[#FCFBF7] border border-[#E3DAC9] p-8 before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] relative text-center">
          <h3 className="font-serif text-lg font-bold text-[#2C2621] uppercase tracking-wider mb-2">
            Curator's Note
          </h3>
          <p className="font-serif text-sm italic text-[#5C5045] max-w-2xl mx-auto leading-relaxed">
            "These letterheads represent the standard bearer of enterprise. Long before screen-based designs, companies expressed their character through watermarked papers, custom typography, steel-die engravings, and lithography. This registry is dedicated to preserving their memory."
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
