import Link from "next/link";
import { Landmark } from "lucide-react";

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-double border-[#DED4C7] bg-[#FAF8F3] text-[#2C2621] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[#F2ECE1] pb-8">
          <div className="flex items-center gap-3">
            <Landmark className="h-6 w-6 text-[#5C5045]" />
            <span className="font-serif font-bold tracking-widest text-[#2C2621] text-sm uppercase">
              LETTERHEAD REGISTRY
            </span>
          </div>
          <div className="flex gap-6 font-serif text-xs tracking-wider uppercase text-[#6E6155]">
            <Link href="/" className="hover:text-[#2C2621] transition-colors">
              Home
            </Link>
            <Link href="/archive" className="hover:text-[#2C2621] transition-colors">
              Archive
            </Link>
            <Link href="/about" className="hover:text-[#2C2621] transition-colors">
              About
            </Link>
            <Link href="/admin/dashboard" className="hover:text-[#2C2621] transition-colors">
              Curator
            </Link>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-center sm:text-left">
          <p className="font-serif text-xs text-[#8C7A6B] italic">
            Preserving and documenting physical commercial letterheads of the 20th century.
          </p>
          <p className="font-serif text-xs text-[#8C7A6B]">
            &copy; {currentYear} Letterhead Registry. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
