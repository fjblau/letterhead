import Link from "next/link";
import { Paperclip, Calendar, MapPin, Tag } from "lucide-react";

interface LetterheadCardProps {
  id: string;
  slug: string | null;
  company_name: string;
  city: string | null;
  country: string | null;
  year_exact: number | null;
  year_circa: number | null;
  era: string | null;
  document_type: string | null;
  thumb_url: string | null;
  ephemeraCount?: number;
}

export default function LetterheadCard({
  id,
  slug,
  company_name,
  city,
  country,
  year_exact,
  year_circa,
  era,
  document_type,
  thumb_url,
  ephemeraCount = 0,
}: LetterheadCardProps) {
  const dating = year_exact
    ? `${year_exact}`
    : year_circa
    ? `c. ${year_circa}`
    : era
    ? era.replace(/-/g, " ")
    : "Unknown Date";

  const location = [city, country].filter(Boolean).join(", ");

  const cardLink = slug ? `/archive/${slug}` : "/archive";

  return (
    <Link
      href={cardLink}
      className="group bg-[#FCFBF9] border border-[#E3DAC9] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative p-4 before:absolute before:inset-[3px] before:border before:border-[#F3ECE0] before:pointer-events-none"
    >
      <div className="bg-[#FAF8F5] border border-[#EAE3D5] p-3 aspect-[4/5] flex items-center justify-center overflow-hidden shadow-inner relative mb-4">
        {thumb_url ? (
          <img
            src={thumb_url}
            alt={company_name}
            className="object-contain w-full h-full max-h-full transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <svg
              className="w-12 h-12 text-[#A89A8B] mb-2 stroke-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="font-serif text-[10px] uppercase tracking-wider text-[#A89A8B]">
              No image available
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow">
        <h3 className="font-serif text-base sm:text-lg font-extrabold text-[#2C2621] leading-tight mb-2 group-hover:text-[#5C5045] transition-colors truncate">
          {company_name}
        </h3>

        <div className="space-y-1 text-xs text-[#6E6155] font-serif mb-4 flex-grow">
          {location && (
            <div className="flex items-center gap-1.5 italic">
              <MapPin className="h-3.5 w-3.5 text-[#8C7A6B] shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 italic">
            <Calendar className="h-3.5 w-3.5 text-[#8C7A6B] shrink-0" />
            <span>{dating}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F2ECE1]">
          {document_type ? (
            <span className="inline-flex items-center gap-1 bg-[#EDE7DE] text-[#5C5045] px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold border border-[#DED4C7]">
              <Tag className="h-2.5 w-2.5" />
              {document_type}
            </span>
          ) : (
            <span />
          )}

          {ephemeraCount > 0 && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C7A6B]"
              title={`${ephemeraCount} associated ephemera item(s)`}
            >
              <Paperclip className="h-3 w-3" />
              <span>+{ephemeraCount} Ephemera</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
