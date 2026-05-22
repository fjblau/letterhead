import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Info, Users, Cpu, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <div className="bg-[#FAF6ED] min-h-screen flex flex-col text-[#2C2621]">
      <PublicHeader />

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <section className="relative bg-[#FCFBF7] border border-[#E3DAC9] p-8 sm:p-12 mb-12 before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] before:pointer-events-none shadow-sm text-center">
          <Info className="h-10 w-10 text-[#5C5045] mx-auto mb-4" />
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#2C2621] tracking-tight uppercase tracking-widest mb-3">
            About the Registry
          </h2>
          <p className="font-serif text-base sm:text-lg italic text-[#5C5045] max-w-2xl mx-auto leading-relaxed">
            Preserving and cataloging physical corporate identity systems, letterheads, and ephemera of the 20th century.
          </p>
        </section>

        <div className="space-y-12 font-serif">
          <section className="bg-[#FCFBF7] border border-[#E3DAC9] p-6 sm:p-8 before:absolute before:inset-[3px] before:border before:border-[#F3ECE0] before:pointer-events-none relative shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E3DAC9] pb-3 mb-5">
              <ShieldCheck className="h-5 w-5 text-[#5C5045]" />
              <h3 className="text-xl font-bold uppercase tracking-wider text-[#2C2621]">
                The Collection
              </h3>
            </div>
            <div className="text-sm sm:text-base text-[#5C5045] space-y-4 leading-relaxed">
              <p>
                The Letterhead Registry was established as a digital museum to preserve the forgotten masterpieces of daily business. Long before screens and digital-first branding, companies defined their character, prestige, and stability through premium physical stationery.
              </p>
              <p>
                Our collection spans from the early 20th century, through the interwar period, and into the mid-century modern era. Each letterhead in this registry represents a carefully executed design, showcasing custom typography, lithography, steel-die engraving, or intricate letterpress work.
              </p>
              <p>
                By digitizing these papers and their associated envelopes, invoice sheets, and administrative ephemera, we ensure that the detailed craftsmanship of early graphic designers, typographers, and printmakers remains available to historians, designers, and enthusiasts worldwide.
              </p>
            </div>
          </section>

          <section className="bg-[#FCFBF7] border border-[#E3DAC9] p-6 sm:p-8 before:absolute before:inset-[3px] before:border before:border-[#F3ECE0] before:pointer-events-none relative shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E3DAC9] pb-3 mb-5">
              <Users className="h-5 w-5 text-[#5C5045]" />
              <h3 className="text-xl font-bold uppercase tracking-wider text-[#2C2621]">
                The Curator
              </h3>
            </div>
            <div className="text-sm sm:text-base text-[#5C5045] space-y-4 leading-relaxed">
              <p>
                The registry is curated by a dedicated historian of office technology, stationery, and corporate typography. Finding these specimens in antique shops, estate sales, and archives, our curator handles each piece of fragile paper with care.
              </p>
              <p>
                "Stationery is more than just paper—it was the physical portal through which commerce occurred. When you look at an Underwood or Remington letter from 1915, you are not just seeing a message; you are holding the exact weight, watermark, and ink impression that passed through several hands across the ocean. It represents a different pace of life and a profound dedication to business presentation."
              </p>
            </div>
          </section>

          <section className="bg-[#FCFBF7] border border-[#E3DAC9] p-6 sm:p-8 before:absolute before:inset-[3px] before:border before:border-[#F3ECE0] before:pointer-events-none relative shadow-sm">
            <div className="flex items-center gap-3 border-b border-[#E3DAC9] pb-3 mb-5">
              <Cpu className="h-5 w-5 text-[#5C5045]" />
              <h3 className="text-xl font-bold uppercase tracking-wider text-[#2C2621]">
                Technical Background
              </h3>
            </div>
            <div className="text-sm sm:text-base text-[#5C5045] space-y-4 leading-relaxed">
              <p>
                While the artifacts in this database are decades old, the systems powering this registry are built on cutting-edge software engineering standards:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Next.js 15 (App Router)</strong>: Leverages dynamic server-side and client-side rendering for optimal performance and SEO.
                </li>
                <li>
                  <strong>PostgreSQL with Neon</strong>: A robust database engine handling complex records and relation states.
                </li>
                <li>
                  <strong>Postgres Full-Text Search (tsvector)</strong>: Uses optimized full-text indexes and vectors across multiple metadata fields (Company, Division, Notes, City, Tags) for fast, robust search matching.
                </li>
                <li>
                  <strong>Drizzle ORM</strong>: Lightweight, type-safe SQL query builder providing smooth database operations.
                </li>
                <li>
                  <strong>Tailwind CSS</strong>: Enables the bespoke, highly responsive, and high-fidelity vintage paper aesthetic without heavy custom stylesheets.
                </li>
              </ul>
              <p>
                Our modern search experience combines relational faceting counts with debounced URL state synchronization, allowing historians to share exact filtered states of the registry with a simple web link.
              </p>
            </div>
          </section>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/archive"
            className="inline-flex items-center justify-center gap-2 bg-[#5C5045] text-white font-serif text-sm uppercase tracking-wider font-semibold px-6 py-3 border border-[#4A3F35] hover:bg-[#2C2621] transition-all shadow-sm"
          >
            Explore the Specimens
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
