"use client";

import { useState, useRef, useEffect } from "react";
import { 
  MapPin, 
  Calendar, 
  Tag, 
  FileDown, 
  Eye, 
  Clock, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  History, 
  ArrowLeft, 
  Paperclip,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import PdfViewerModal from "./PdfViewerModal";

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
  language: string | null;
  recipient: string | null;
  typewriter_models: string[] | null;
  design_notes: string | null;
  provenance: string | null;
  source: string | null;
  condition_notes: string | null;
  tags: string[] | null;
  pdf_url: string | null;
  pdf_size_bytes: number | null;
  pdf_page_count: number | null;
  thumb_url: string | null;
  thumb_width: number | null;
  thumb_height: number | null;
  is_published: boolean;
}

interface EphemeraItem {
  id: string;
  letterhead_id: string;
  kind: string | null;
  mime_type: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  thumb_url: string | null;
  width: number | null;
  height: number | null;
  page_count: number | null;
  role: string | null;
  caption: string | null;
  description: string | null;
  sort_order: number;
}

interface DetailClientProps {
  item: LetterheadItem;
  ephemera: EphemeraItem[];
}

export default function DetailClient({ item, ephemera }: DetailClientProps) {
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState("");
  const [activePdfTitle, setActivePdfTitle] = useState("");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeEphemeraIndex, setActiveEphemeraIndex] = useState<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const barsCount = 40;
    const initialBars = Array.from({ length: barsCount }, () => Math.floor(Math.random() * 35) + 5);
    setWaveformBars(initialBars);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const updateBars = () => {
      if (isPlaying) {
        setWaveformBars((prev) =>
          prev.map((val) => {
            const delta = Math.floor(Math.random() * 15) - 7;
            return Math.max(5, Math.min(45, val + delta));
          })
        );
      }
      animationFrameId = requestAnimationFrame(updateBars);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateBars);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  const handleOpenPdf = (url: string | null, title: string) => {
    if (!url) return;
    setActivePdfUrl(url);
    setActivePdfTitle(title);
    setPdfModalOpen(true);
  };

  const handleEphemeraClick = (index: number) => {
    const ephem = ephemera[index];
    if (ephem.kind === "pdf" || ephem.mime_type === "application/pdf") {
      handleOpenPdf(ephem.file_url, ephem.caption || "Ephemera Document");
    } else {
      setActiveEphemeraIndex(index);
      setLightboxOpen(true);
      setIsPlaying(false);
      setAudioProgress(0);
    }
  };

  const activeEphemera = activeEphemeraIndex !== null ? ephemera[activeEphemeraIndex] : null;

  useEffect(() => {
    if (!lightboxOpen) {
      setIsPlaying(false);
      setAudioProgress(0);
    }
  }, [lightboxOpen]);

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioProgress(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAudioPlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const handleAudioMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleAudioProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setAudioProgress(newTime);
    }
  };

  const getCountryName = (code: string | null) => {
    if (!code) return "Unknown";
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

  const formatEra = (eraStr: string | null) => {
    if (!eraStr) return "Unknown Period";
    return eraStr
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const dating = item.year_exact
    ? `${item.year_exact}`
    : item.year_circa
    ? `c. ${item.year_circa}`
    : item.era
    ? formatEra(item.era)
    : "Unknown Date";

  const location = [item.city, getCountryName(item.country)].filter(Boolean).join(", ");

  const nextLightboxItem = () => {
    if (activeEphemeraIndex === null) return;
    let nextIdx = activeEphemeraIndex;
    while (true) {
      nextIdx = (nextIdx + 1) % ephemera.length;
      if (nextIdx === activeEphemeraIndex) break;
      const nextItem = ephemera[nextIdx];
      if (nextItem.kind !== "pdf" && nextItem.mime_type !== "application/pdf") {
        setActiveEphemeraIndex(nextIdx);
        setIsPlaying(false);
        setAudioProgress(0);
        break;
      }
    }
  };

  const prevLightboxItem = () => {
    if (activeEphemeraIndex === null) return;
    let prevIdx = activeEphemeraIndex;
    while (true) {
      prevIdx = (prevIdx - 1 + ephemera.length) % ephemera.length;
      if (prevIdx === activeEphemeraIndex) break;
      const prevItem = ephemera[prevIdx];
      if (prevItem.kind !== "pdf" && prevItem.mime_type !== "application/pdf") {
        setActiveEphemeraIndex(prevIdx);
        setIsPlaying(false);
        setAudioProgress(0);
        break;
      }
    }
  };

  const isAudioType = (mime: string | null, kind: string | null) => {
    if (kind === "audio") return true;
    if (mime?.startsWith("audio/")) return true;
    return false;
  };

  return (
    <div className="space-y-12">
      <div className="mb-4">
        <Link
          href="/archive"
          className="inline-flex items-center gap-2 font-serif text-xs uppercase tracking-wider text-[#8C7A6B] font-bold hover:text-[#2C2621] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Archive Catalog
        </Link>
      </div>

      <div className="bg-[#FCFBF7] border border-[#E3DAC9] before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] before:pointer-events-none relative shadow-md p-6 sm:p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
          
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="bg-[#FAF8F5] border border-[#EAE3D5] p-4 flex items-center justify-center overflow-hidden shadow-inner relative group min-h-[300px] md:min-h-[450px]">
              {item.thumb_url ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={item.thumb_url}
                    alt={item.company_name}
                    className="object-contain max-h-[500px] w-auto transition-transform duration-300"
                  />
                  {item.pdf_url && (
                    <button
                      onClick={() => handleOpenPdf(item.pdf_url, item.company_name)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 text-white transition-opacity duration-300"
                    >
                      <div className="bg-[#5C5045] p-3 rounded-full border border-white/20 shadow-md">
                        <Eye className="h-5 w-5" />
                      </div>
                      <span className="font-serif text-xs uppercase tracking-widest font-bold">
                        Inspect Document
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <FileText className="w-16 h-16 text-[#A89A8B] mb-4 stroke-1" />
                  <span className="font-serif text-xs uppercase tracking-wider text-[#A89A8B]">
                    No Specimen Preview Available
                  </span>
                </div>
              )}
            </div>

            {item.pdf_url && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleOpenPdf(item.pdf_url, item.company_name)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#FCFBF7] text-[#5C5045] font-serif text-xs uppercase tracking-wider font-extrabold px-5 py-3.5 border border-[#DED4C7] hover:bg-[#FAF8F5] hover:text-[#2C2621] transition-all"
                >
                  <Eye className="h-4 w-4" />
                  Inspect Embedded PDF
                </button>
                <a
                  href={item.pdf_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#5C5045] text-white font-serif text-xs uppercase tracking-wider font-extrabold px-5 py-3.5 border border-[#4A3F35] hover:bg-[#2C2621] transition-all"
                >
                  <FileDown className="h-4 w-4" />
                  Download Original PDF
                </a>
              </div>
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                {item.company_division && (
                  <span className="font-serif text-xs uppercase tracking-widest text-[#8C7A6B] font-bold block mb-1">
                    {item.company_division}
                  </span>
                )}
                <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#2C2621] tracking-tight uppercase tracking-wide leading-tight">
                  {item.company_name}
                </h1>
                <div className="h-[2px] w-16 bg-[#DED4C7] mt-4 relative">
                  <div className="absolute inset-y-0 left-0 w-8 h-[2px] bg-[#5C5045]" />
                </div>
              </div>

              <div className="border-t border-b border-[#F2ECE1] py-4 my-2">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="flex flex-col">
                    <dt className="font-serif text-[10px] uppercase tracking-wider text-[#8C7A6B] font-bold">
                      Dating / Period
                    </dt>
                    <dd className="font-serif text-sm text-[#2C2621] font-semibold mt-0.5 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-[#8C7A6B]" />
                      {dating}
                    </dd>
                  </div>

                  <div className="flex flex-col">
                    <dt className="font-serif text-[10px] uppercase tracking-wider text-[#8C7A6B] font-bold">
                      Origin Location
                    </dt>
                    <dd className="font-serif text-sm text-[#2C2621] font-semibold mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-[#8C7A6B]" />
                      {location || "Unknown"}
                    </dd>
                  </div>

                  <div className="flex flex-col">
                    <dt className="font-serif text-[10px] uppercase tracking-wider text-[#8C7A6B] font-bold">
                      Document Type
                    </dt>
                    <dd className="font-serif text-sm text-[#2C2621] font-semibold mt-0.5 flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-[#8C7A6B]" />
                      {item.document_type || "Commercial Mail"}
                    </dd>
                  </div>

                  <div className="flex flex-col">
                    <dt className="font-serif text-[10px] uppercase tracking-wider text-[#8C7A6B] font-bold">
                      Archival Era
                    </dt>
                    <dd className="font-serif text-sm text-[#2C2621] font-semibold mt-0.5 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[#8C7A6B]" />
                      {formatEra(item.era)}
                    </dd>
                  </div>

                  {item.typewriter_models && item.typewriter_models.length > 0 && (
                    <div className="flex flex-col sm:col-span-2">
                      <dt className="font-serif text-[10px] uppercase tracking-wider text-[#8C7A6B] font-bold mb-1">
                        Typewriter Models Used
                      </dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {item.typewriter_models.map((model) => (
                          <span
                            key={model}
                            className="bg-[#FAF8F5] text-[#5C5045] font-serif text-[10px] uppercase tracking-wider font-semibold border border-[#DED4C7] px-2 py-0.5 rounded shadow-sm"
                          >
                            {model}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="space-y-4">
                {item.design_notes && (
                  <div className="bg-[#FAF8F5] border border-[#EAE3D5] p-4 relative before:absolute before:inset-[3px] before:border before:border-[#FDFCF9] before:pointer-events-none">
                    <h3 className="font-serif text-xs uppercase tracking-wider font-bold text-[#5C5045] flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#8C7A6B]" />
                      Design & Typographic Notes
                    </h3>
                    <p className="font-serif text-xs text-[#5C5045] leading-relaxed italic">
                      "{item.design_notes}"
                    </p>
                  </div>
                )}

                {item.provenance && (
                  <div>
                    <h3 className="font-serif text-xs uppercase tracking-wider font-bold text-[#5C5045] mb-1">
                      Provenance & Historical Origin
                    </h3>
                    <p className="font-serif text-xs text-[#6E6155] leading-relaxed">
                      {item.provenance}
                    </p>
                  </div>
                )}

                {item.condition_notes && (
                  <div className="border-t border-dashed border-[#DED4C7] pt-3">
                    <h3 className="font-serif text-xs uppercase tracking-wider font-bold text-[#5C5045] mb-1">
                      Physical Conservation State
                    </h3>
                    <p className="font-serif text-xs text-[#6E6155] leading-relaxed flex items-start gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-700 mt-0.5 shrink-0" />
                      <span>{item.condition_notes}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-[#F2ECE1]">
                {item.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/archive?tag=${encodeURIComponent(tag)}`}
                    className="font-serif text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-[#EDE7DE] text-[#5C5045] border border-[#DED4C7] hover:bg-[#DED4C7] transition-all"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {ephemera.length > 0 && (
          <div className="mt-12 pt-8 border-t-2 border-double border-[#DED4C7] relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Paperclip className="h-4 w-4 text-[#5C5045]" />
              <h2 className="font-serif text-sm font-bold uppercase tracking-widest text-[#2C2621]">
                Associated Ephemera Strip
              </h2>
              <span className="font-serif text-[10px] text-[#8C7A6B] uppercase font-bold">
                ({ephemera.length} Items)
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#DED4C7] scrollbar-track-transparent">
              {ephemera.map((ephem, index) => {
                const isAudio = isAudioType(ephem.mime_type, ephem.kind);
                return (
                  <button
                    key={ephem.id}
                    onClick={() => handleEphemeraClick(index)}
                    className="flex-shrink-0 w-36 sm:w-44 bg-[#FAF8F5] border border-[#EAE3D5] p-2 hover:border-[#5C5045] hover:shadow-md transition-all text-left flex flex-col justify-between group relative"
                  >
                    <div className="aspect-[4/3] w-full bg-[#FCFBF9] border border-[#EAE3D5] flex items-center justify-center overflow-hidden mb-2 relative">
                      {ephem.thumb_url ? (
                        <img
                          src={ephem.thumb_url}
                          alt={ephem.caption || "Ephemera Specimen"}
                          className="object-contain w-full h-full max-h-full transition-transform duration-300 group-hover:scale-[1.02]"
                          loading="lazy"
                        />
                      ) : isAudio ? (
                        <div className="flex flex-col items-center justify-center text-center p-2 text-[#5C5045]">
                          <Play className="h-8 w-8 text-[#8C7A6B] stroke-1" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-2 text-[#A89A8B]">
                          <FileText className="h-8 w-8 stroke-1" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="font-serif text-[9px] uppercase tracking-wider font-bold bg-[#FAF6ED] text-[#2C2621] px-2 py-1 shadow border border-[#E3DAC9]">
                          {isAudio ? "Listen" : "View"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="font-serif text-[9px] uppercase tracking-widest text-[#8C7A6B] font-extrabold block">
                        {ephem.role || ephem.kind || "Attachment"}
                      </span>
                      <p className="font-serif text-[10px] text-[#2C2621] font-semibold leading-tight line-clamp-2">
                        {ephem.caption || "Archival Ephemera"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {lightboxOpen && activeEphemera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 sm:p-6 md:p-10 animate-fade-in">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-10 md:right-10 z-50 p-2 text-white/70 hover:text-white bg-black/40 border border-white/10 hover:bg-black/60 transition-all rounded-full"
            title="Close Lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={prevLightboxItem}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 p-2 text-white/70 hover:text-white bg-black/40 border border-white/10 hover:bg-black/60 transition-all rounded-full"
            title="Previous Item"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            onClick={nextLightboxItem}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 p-2 text-white/70 hover:text-white bg-black/40 border border-white/10 hover:bg-black/60 transition-all rounded-full"
            title="Next Item"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="relative w-full max-w-4xl max-h-full flex flex-col items-center justify-center">
            <div className="w-full flex justify-center items-center max-h-[70vh] relative p-4 mb-4">
              {isAudioType(activeEphemera.mime_type, activeEphemera.kind) ? (
                <div className="bg-[#FAF6ED] border-2 border-[#E3DAC9] p-6 sm:p-8 w-full max-w-md shadow-2xl relative before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] before:pointer-events-none">
                  <audio
                    ref={audioRef}
                    src={activeEphemera.file_url || ""}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onLoadedMetadata={handleAudioLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />

                  <div className="text-center space-y-4 relative z-10">
                    <span className="font-serif text-[10px] uppercase tracking-widest text-[#8C7A6B] font-extrabold block">
                      Sound Archive Specimen
                    </span>
                    <h4 className="font-serif text-base sm:text-lg font-bold text-[#2C2621] leading-tight">
                      {activeEphemera.caption || "Historical Audio Recording"}
                    </h4>
                    
                    <div className="h-[2px] w-12 bg-[#DED4C7] mx-auto" />

                    <div className="flex items-end justify-center gap-1 h-12 py-1 px-4 my-2 select-none">
                      {waveformBars.map((barHeight, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${barHeight}%` }}
                          className={`w-1 rounded-t transition-all duration-150 ${
                            isPlaying ? "bg-[#5C5045]" : "bg-[#DED4C7]"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-serif text-[10px] text-[#5C5045] min-w-[35px]">
                        {Math.floor(audioProgress / 60)}:
                        {String(Math.floor(audioProgress % 60)).padStart(2, "0")}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={audioDuration || "1"}
                        step="0.1"
                        value={audioProgress}
                        onChange={handleAudioProgressChange}
                        className="flex-grow accent-[#5C5045] bg-[#DED4C7] h-1 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-serif text-[10px] text-[#5C5045] min-w-[35px]">
                        {Math.floor(audioDuration / 60)}:
                        {String(Math.floor(audioDuration % 60)).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-4 pt-2">
                      <button
                        onClick={handleAudioPlayPause}
                        className="p-3 bg-[#5C5045] text-white border border-[#4A3F35] hover:bg-[#2C2621] transition-all rounded-full flex items-center justify-center shadow"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white ml-0.5" />}
                      </button>
                      <button
                        onClick={handleAudioMuteToggle}
                        className="p-2 text-[#5C5045] border border-[#DED4C7] hover:bg-[#FAF8F5] transition-all rounded-full flex items-center justify-center"
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={activeEphemera.file_url || ""}
                  alt={activeEphemera.caption || "Lightbox Specimen"}
                  className="object-contain max-h-[70vh] max-w-full select-none shadow-2xl border border-white/10"
                />
              )}
            </div>

            <div className="w-full max-w-2xl text-center px-4">
              <span className="font-serif text-xs uppercase tracking-widest text-[#DED4C7] font-bold block mb-1">
                {activeEphemera.role || activeEphemera.kind || "Ephemera Specimen"}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-snug">
                {activeEphemera.caption || "Archival Ephemera Piece"}
              </h3>
              {activeEphemera.description && (
                <p className="font-serif text-xs text-[#DED4C7] italic leading-relaxed mt-2 max-w-xl mx-auto">
                  "{activeEphemera.description}"
                </p>
              )}
              {activeEphemera.file_size_bytes && (
                <span className="font-serif text-[10px] uppercase tracking-wider text-white/50 block mt-2">
                  File Size: {formatBytes(activeEphemera.file_size_bytes)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <PdfViewerModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        pdfUrl={activePdfUrl}
        title={activePdfTitle}
      />
    </div>
  );
}
