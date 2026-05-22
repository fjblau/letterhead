"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, FileText, Info, Settings } from "lucide-react";

export default function PublicHeader() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Landmark },
    { name: "Archive", href: "/archive", icon: FileText },
    { name: "About", href: "/about", icon: Info },
  ];

  return (
    <header className="border-b-2 border-double border-[#DED4C7] bg-[#FAF8F3] text-[#2C2621]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center py-6 sm:py-8 text-center border-b border-[#F2ECE1]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Landmark className="h-8 w-8 text-[#5C5045]" />
          </div>
          <Link href="/">
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-widest text-[#2C2621] hover:text-[#5C5045] transition-colors">
              LETTERHEAD REGISTRY
            </h1>
          </Link>
          <p className="font-serif text-xs sm:text-sm italic text-[#6E6155] mt-2 tracking-wide">
            An Archive of Vintage Typography, Corporate Identity & Business Ephemera
          </p>
        </div>
        <div className="flex items-center justify-between py-4">
          <nav className="flex justify-center gap-8 mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 font-serif text-sm tracking-wider font-semibold uppercase border-b-2 transition-all pb-1 ${
                    isActive
                      ? "border-[#5C5045] text-[#2C2621]"
                      : "border-transparent text-[#6E6155] hover:text-[#2C2621] hover:border-[#DED4C7]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/admin/dashboard"
            className="hidden sm:flex items-center gap-1.5 font-serif text-xs tracking-wider uppercase text-[#8C7A6B] hover:text-[#2C2621] border border-[#DED4C7] px-2.5 py-1 transition-all"
            title="Curator Access"
          >
            <Settings className="h-3.5 w-3.5" />
            Curator
          </Link>
        </div>
      </div>
    </header>
  );
}
