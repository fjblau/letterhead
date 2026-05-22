"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  SlidersHorizontal,
  Search,
  X,
  RotateCcw,
  Sliders,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import LetterheadCard from "@/components/LetterheadCard";

interface FacetItem {
  name: string;
  count: number;
}

interface Facets {
  companies: FacetItem[];
  eras: FacetItem[];
  countries: FacetItem[];
  documentTypes: FacetItem[];
  tags: FacetItem[];
}

interface LetterheadItem {
  id: string;
  slug: string | null;
  company_name: string;
  company_division: string | null;
  city: string | null;
  country: string | null;
  year_exact: number | null;
  year_circa: number | null;
  era: string | null;
  document_type: string | null;
  tags: string[] | null;
  thumb_url: string | null;
  thumb_width: number | null;
  thumb_height: number | null;
  is_published: boolean;
  ephemeraCount: number;
}

export default function ArchiveClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [facets, setFacets] = useState<Facets>({
    companies: [],
    eras: [],
    countries: [],
    documentTypes: [],
    tags: [],
  });

  const [items, setItems] = useState<LetterheadItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingFacets, setLoadingFacets] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const getParam = (key: string) => searchParams?.get(key) || "";

  const [search, setSearch] = useState(getParam("search"));
  const [company, setCompany] = useState(getParam("company"));
  const [era, setEra] = useState(getParam("era"));
  const [country, setCountry] = useState(getParam("country"));
  const [documentType, setDocumentType] = useState(getParam("documentType"));
  const [tag, setTag] = useState(getParam("tag"));
  const [sort, setSort] = useState(getParam("sort") || "recently_added");

  const [searchInput, setSearchInput] = useState(getParam("search"));

  useEffect(() => {
    async function fetchFacets() {
      try {
        const res = await fetch("/api/facets");
        if (res.ok) {
          const data = await res.json();
          setFacets(data);
        }
      } catch (err) {
        console.error("Error fetching facets:", err);
      } finally {
        setLoadingFacets(false);
      }
    }
    fetchFacets();
  }, []);

  const updateURL = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams?.toString() || "");

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== searchInput) {
        setSearch(searchInput);
        updateURL({ search: searchInput });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, search, updateURL]);

  useEffect(() => {
    setSearchInput(getParam("search"));
    setSearch(getParam("search"));
    setCompany(getParam("company"));
    setEra(getParam("era"));
    setCountry(getParam("country"));
    setDocumentType(getParam("documentType"));
    setTag(getParam("tag"));
    setSort(getParam("sort") || "recently_added");
  }, [searchParams]);

  useEffect(() => {
    async function fetchItems() {
      setLoadingItems(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set("search", search);
        if (company) queryParams.set("company", company);
        if (era) queryParams.set("era", era);
        if (country) queryParams.set("country", country);
        if (documentType) queryParams.set("documentType", documentType);
        if (tag) queryParams.set("tag", tag);
        if (sort) queryParams.set("sort", sort);

        const res = await fetch(`/api/archive?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
      } finally {
        setLoadingItems(false);
      }
    }
    fetchItems();
  }, [search, company, era, country, documentType, tag, sort]);

  const handleFilterClick = (key: string, value: string) => {
    const currentVal = getParam(key);
    const newVal = currentVal === value ? "" : value;

    if (key === "company") setCompany(newVal);
    if (key === "era") setEra(newVal);
    if (key === "country") setCountry(newVal);
    if (key === "documentType") setDocumentType(newVal);
    if (key === "tag") setTag(newVal);

    updateURL({ [key]: newVal });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    updateURL({ sort: newSort });
  };

  const clearAllFilters = () => {
    setSearch("");
    setSearchInput("");
    setCompany("");
    setEra("");
    setCountry("");
    setDocumentType("");
    setTag("");
    setSort("recently_added");

    router.push(pathname);
  };

  const formatEraName = (slug: string) => {
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatCountryName = (code: string) => {
    const countriesMap: Record<string, string> = {
      US: "United States",
      GB: "Great Britain",
      DE: "Germany",
      FR: "France",
      IT: "Italy",
      CH: "Switzerland",
      NL: "Netherlands",
      CA: "Canada",
    };
    return countriesMap[code.toUpperCase()] || code;
  };

  const activeFiltersList = [
    { key: "search", label: "Search", value: search, onClear: () => { setSearch(""); setSearchInput(""); updateURL({ search: "" }); } },
    { key: "company", label: "Company", value: company, onClear: () => { setCompany(""); updateURL({ company: "" }); } },
    { key: "era", label: "Era", value: era, formattedValue: era ? formatEraName(era) : "", onClear: () => { setEra(""); updateURL({ era: "" }); } },
    { key: "country", label: "Country", value: country, formattedValue: country ? formatCountryName(country) : "", onClear: () => { setCountry(""); updateURL({ country: "" }); } },
    { key: "documentType", label: "Type", value: documentType, onClear: () => { setDocumentType(""); updateURL({ documentType: "" }); } },
    { key: "tag", label: "Tag", value: tag, onClear: () => { setTag(""); updateURL({ tag: "" }); } },
  ].filter((f) => Boolean(f.value));

  return (
    <div className="bg-[#FAF6ED] min-h-screen flex flex-col text-[#2C2621]">
      <PublicHeader />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <aside className="hidden md:block w-64 shrink-0 bg-[#FCFBF7] border border-[#E3DAC9] p-5 sticky top-8 before:absolute before:inset-[3px] before:border before:border-[#F3ECE0] before:pointer-events-none">
            <div className="flex items-center gap-2 border-b-2 border-double border-[#DED4C7] pb-3 mb-5">
              <SlidersHorizontal className="h-4 w-4 text-[#5C5045]" />
              <h2 className="font-serif font-bold text-sm uppercase tracking-wider text-[#2C2621]">
                Filter Specimens
              </h2>
            </div>

            {loadingFacets ? (
              <div className="space-y-4 py-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-10 bg-[#FAF8F3] animate-pulse rounded border border-[#EBE4D6]" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                    Era
                  </h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {facets.eras.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => handleFilterClick("era", f.name)}
                        className={`w-full text-left font-serif text-xs px-2 py-1.5 flex items-center justify-between border transition-all ${
                          era === f.name
                            ? "bg-[#5C5045] text-white border-[#4A3F35]"
                            : "border-transparent text-[#6E6155] hover:bg-[#FAF8F3] hover:text-[#2C2621]"
                        }`}
                      >
                        <span className="truncate mr-2">{formatEraName(f.name)}</span>
                        <span className={`text-[10px] shrink-0 font-sans font-bold px-1.5 py-0.2 rounded-full ${era === f.name ? "bg-[#4A3F35] text-white" : "bg-[#EDE7DE] text-[#6E6155]"}`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                    Country
                  </h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {facets.countries.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => handleFilterClick("country", f.name)}
                        className={`w-full text-left font-serif text-xs px-2 py-1.5 flex items-center justify-between border transition-all ${
                          country === f.name
                            ? "bg-[#5C5045] text-white border-[#4A3F35]"
                            : "border-transparent text-[#6E6155] hover:bg-[#FAF8F3] hover:text-[#2C2621]"
                        }`}
                      >
                        <span className="truncate mr-2">{formatCountryName(f.name)}</span>
                        <span className={`text-[10px] shrink-0 font-sans font-bold px-1.5 py-0.2 rounded-full ${country === f.name ? "bg-[#4A3F35] text-white" : "bg-[#EDE7DE] text-[#6E6155]"}`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                    Document Type
                  </h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {facets.documentTypes.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => handleFilterClick("documentType", f.name)}
                        className={`w-full text-left font-serif text-xs px-2 py-1.5 flex items-center justify-between border transition-all ${
                          documentType === f.name
                            ? "bg-[#5C5045] text-white border-[#4A3F35]"
                            : "border-transparent text-[#6E6155] hover:bg-[#FAF8F3] hover:text-[#2C2621]"
                        }`}
                      >
                        <span className="truncate mr-2">{f.name}</span>
                        <span className={`text-[10px] shrink-0 font-sans font-bold px-1.5 py-0.2 rounded-full ${documentType === f.name ? "bg-[#4A3F35] text-white" : "bg-[#EDE7DE] text-[#6E6155]"}`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {facets.tags.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => handleFilterClick("tag", f.name)}
                        className={`font-serif text-[10px] uppercase tracking-wider font-semibold px-2 py-1 border transition-all ${
                          tag === f.name
                            ? "bg-[#5C5045] text-white border-[#4A3F35]"
                            : "bg-[#EDE7DE] text-[#5C5045] border-[#DED4C7] hover:bg-[#DED4C7]"
                        }`}
                      >
                        {f.name} <span className="opacity-70">({f.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                    Company
                  </h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                    {facets.companies.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => handleFilterClick("company", f.name)}
                        className={`w-full text-left font-serif text-xs px-2 py-1.5 flex items-center justify-between border transition-all ${
                          company === f.name
                            ? "bg-[#5C5045] text-white border-[#4A3F35]"
                            : "border-transparent text-[#6E6155] hover:bg-[#FAF8F3] hover:text-[#2C2621]"
                        }`}
                      >
                        <span className="truncate mr-2">{f.name}</span>
                        <span className={`text-[10px] shrink-0 font-sans font-bold px-1.5 py-0.2 rounded-full ${company === f.name ? "bg-[#4A3F35] text-white" : "bg-[#EDE7DE] text-[#6E6155]"}`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>

          <div className="flex-grow w-full">
            <div className="bg-[#FCFBF7] border border-[#E3DAC9] p-4 sm:p-5 mb-6 before:absolute before:inset-[3px] before:border before:border-[#F3ECE0] before:pointer-events-none relative flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C7A6B]" />
                <input
                  type="text"
                  placeholder="Search company, division, city, notes, tags..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#DED4C7] pl-10 pr-4 py-2 text-sm text-[#2C2621] font-serif placeholder-[#A89A8B] focus:outline-none focus:border-[#5C5045]"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(""); setSearch(""); updateURL({ search: "" }); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#8C7A6B] hover:text-[#2C2621]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="md:hidden flex items-center gap-2 font-serif text-xs uppercase tracking-wider font-bold border border-[#DED4C7] px-3 py-2 bg-[#FAF8F5] text-[#5C5045]"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  Filters
                </button>

                <div className="flex items-center gap-2">
                  <span className="font-serif text-xs text-[#8C7A6B] uppercase font-bold tracking-wider shrink-0">
                    Sort By:
                  </span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="bg-[#FAF8F5] border border-[#DED4C7] pr-8 pl-3 py-1.5 text-xs font-serif text-[#2C2621] uppercase tracking-wider font-semibold focus:outline-none focus:border-[#5C5045] appearance-none cursor-pointer"
                    >
                      <option value="recently_added">Recently Added</option>
                      <option value="newest">Newest First (Era)</option>
                      <option value="oldest">Oldest First (Era)</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8C7A6B] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {activeFiltersList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-[#FCFBF7] border border-[#E3DAC9] p-3 mb-6 before:absolute before:inset-[3px] before:border before:border-[#F3ECE0] before:pointer-events-none relative shadow-sm">
                <span className="font-serif text-[11px] uppercase tracking-widest text-[#8C7A6B] font-extrabold mr-1">
                  Active Filters:
                </span>
                {activeFiltersList.map((f) => (
                  <span
                    key={f.key}
                    className="inline-flex items-center gap-1.5 bg-[#EDE7DE] border border-[#DED4C7] px-2.5 py-1 text-xs font-serif italic text-[#5C5045]"
                  >
                    <span className="text-[#8C7A6B] not-italic uppercase tracking-wider text-[9px] font-bold mr-0.5">
                      {f.label}:
                    </span>
                    <span>{f.formattedValue || f.value}</span>
                    <button
                      onClick={f.onClear}
                      className="p-0.5 hover:bg-[#DED4C7] transition-colors rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="font-serif text-xs uppercase tracking-wider text-[#8C7A6B] hover:text-red-700 font-bold ml-auto flex items-center gap-1 transition-colors px-2 py-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 border-b border-[#E3DAC9] pb-3 mb-6">
              <LayoutGrid className="h-4 w-4 text-[#8C7A6B]" />
              <span className="font-serif text-xs uppercase tracking-wider text-[#8C7A6B] font-bold">
                {loadingItems ? "Searching..." : `Showing ${items.length} specimens`}
              </span>
            </div>

            {loadingItems ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-[#FCFBF7] border border-[#E3DAC9] p-4 h-96 animate-pulse flex flex-col justify-between"
                  >
                    <div className="bg-[#FAF8F3] aspect-[4/5] w-full rounded border border-[#EBE4D6]" />
                    <div className="space-y-2 mt-4">
                      <div className="h-4 bg-[#FAF8F3] rounded w-3/4" />
                      <div className="h-3 bg-[#FAF8F3] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20 bg-[#FCFBF7] border border-[#E3DAC9] before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] relative p-8 shadow-sm">
                <SlidersHorizontal className="h-10 w-10 text-[#A89A8B] mx-auto mb-4 stroke-1" />
                <h3 className="font-serif text-lg font-bold text-[#2C2621] mb-2 uppercase tracking-wider">
                  No Specimens Found
                </h3>
                <p className="font-serif text-sm text-[#5C5045] italic max-w-md mx-auto mb-6">
                  We couldn't find any documents matching your criteria. Try adjusting your query keywords or clearing active filters to see all contents.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 bg-[#5C5045] text-white font-serif text-xs uppercase tracking-wider font-semibold px-4 py-2 border border-[#4A3F35] hover:bg-[#2C2621] transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
          </div>
        </div>
      </main>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative flex flex-col w-full max-w-xs bg-[#FAF6ED] h-full shadow-xl ml-auto border-l border-[#DED4C7] p-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DED4C7] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#5C5045]" />
                <h2 className="font-serif font-bold text-sm uppercase tracking-wider text-[#2C2621]">
                  Filter Specs
                </h2>
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-full text-[#8C7A6B] hover:text-[#2C2621] hover:bg-[#EDE7DE] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 flex-grow pb-8">
              <div>
                <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                  Era
                </h3>
                <div className="space-y-1">
                  {facets.eras.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => { handleFilterClick("era", f.name); setMobileFiltersOpen(false); }}
                      className={`w-full text-left font-serif text-xs px-2 py-1.5 flex items-center justify-between border transition-all ${
                        era === f.name
                          ? "bg-[#5C5045] text-white border-[#4A3F35]"
                          : "border-transparent text-[#6E6155] hover:bg-[#FCFBF7] hover:text-[#2C2621]"
                      }`}
                    >
                      <span className="truncate mr-2">{formatEraName(f.name)}</span>
                      <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded-full bg-[#EDE7DE] text-[#6E6155]">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                  Country
                </h3>
                <div className="space-y-1">
                  {facets.countries.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => { handleFilterClick("country", f.name); setMobileFiltersOpen(false); }}
                      className={`w-full text-left font-serif text-xs px-2 py-1.5 flex items-center justify-between border transition-all ${
                        country === f.name
                          ? "bg-[#5C5045] text-white border-[#4A3F35]"
                          : "border-transparent text-[#6E6155] hover:bg-[#FCFBF7] hover:text-[#2C2621]"
                      }`}
                    >
                      <span className="truncate mr-2">{formatCountryName(f.name)}</span>
                      <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded-full bg-[#EDE7DE] text-[#6E6155]">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                  Document Type
                </h3>
                <div className="space-y-1">
                  {facets.documentTypes.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => { handleFilterClick("documentType", f.name); setMobileFiltersOpen(false); }}
                      className={`w-full text-left font-serif text-xs px-2 py-1.5 flex items-center justify-between border transition-all ${
                        documentType === f.name
                          ? "bg-[#5C5045] text-white border-[#4A3F35]"
                          : "border-transparent text-[#6E6155] hover:bg-[#FCFBF7] hover:text-[#2C2621]"
                      }`}
                    >
                      <span className="truncate mr-2">{f.name}</span>
                      <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded-full bg-[#EDE7DE] text-[#6E6155]">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {facets.tags.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => { handleFilterClick("tag", f.name); setMobileFiltersOpen(false); }}
                      className={`font-serif text-[10px] uppercase tracking-wider font-semibold px-2 py-1 border transition-all ${
                        tag === f.name
                          ? "bg-[#5C5045] text-white border-[#4A3F35]"
                          : "bg-[#EDE7DE] text-[#5C5045] border-[#DED4C7] hover:bg-[#DED4C7]"
                      }`}
                    >
                      {f.name} <span className="opacity-70">({f.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xs uppercase tracking-wider font-extrabold text-[#8C7A6B] mb-2.5">
                  Company
                </h3>
                <div className="space-y-1">
                  {facets.companies.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => { handleFilterClick("company", f.name); setMobileFiltersOpen(false); }}
                      className={`w-full text-left font-serif text-xs px-2 py-1.5 flex items-center justify-between border transition-all ${
                        company === f.name
                          ? "bg-[#5C5045] text-white border-[#4A3F35]"
                          : "border-transparent text-[#6E6155] hover:bg-[#FCFBF7] hover:text-[#2C2621]"
                      }`}
                    >
                      <span className="truncate mr-2">{f.name}</span>
                      <span className="text-[10px] font-sans font-bold px-1.5 py-0.2 rounded-full bg-[#EDE7DE] text-[#6E6155]">
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
