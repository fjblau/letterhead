import { Suspense } from "react";
import ArchiveClient from "./ArchiveClient";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const dynamic = "force-dynamic";

export default function ArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#FAF6ED] min-h-screen flex flex-col text-[#2C2621]">
          <PublicHeader />
          <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
            <div className="text-center font-serif text-[#6E6155] italic">
              Loading physical archive catalog...
            </div>
          </main>
          <PublicFooter />
        </div>
      }
    >
      <ArchiveClient />
    </Suspense>
  );
}
