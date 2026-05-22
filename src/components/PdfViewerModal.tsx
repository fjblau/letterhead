"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, X, Download, Loader2 } from "lucide-react";

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
}

export default function PdfViewerModal({ isOpen, onClose, pdfUrl, title }: PdfViewerModalProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrevPage();
      else if (e.key === "ArrowRight") handleNextPage();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, pageNum, numPages]);

  useEffect(() => {
    if (!isOpen || !pdfUrl) return;

    let active = true;
    let loadingTask: any = null;

    async function loadPdf() {
      setLoading(true);
      setError(null);
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        loadingTask = pdfjs.getDocument(pdfUrl);
        const pdfDoc = await loadingTask.promise;

        if (active) {
          setPdf(pdfDoc);
          setNumPages(pdfDoc.numPages);
          setPageNum(1);
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setError("Failed to load the PDF document.");
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      active = false;
      if (loadingTask) {
        loadingTask.destroy();
      }
    };
  }, [isOpen, pdfUrl]);

  useEffect(() => {
    if (!pdf) return;

    let active = true;
    let renderTask: any = null;

    async function renderPage() {
      try {
        const page = await pdf.getPage(pageNum);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const viewport = page.getViewport({ scale, rotation });
        const dpr = window.devicePixelRatio || 1;

        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        console.error(err);
      }
    }

    renderPage();

    return () => {
      active = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdf, pageNum, scale, rotation]);

  const handlePrevPage = () => {
    setPageNum((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNum((prev) => Math.min(prev + 1, numPages));
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 md:p-10 animate-fade-in">
      <div className="relative bg-[#FAF6ED] border-2 border-[#E3DAC9] w-full max-w-5xl h-full flex flex-col shadow-2xl before:absolute before:inset-[4px] before:border before:border-[#F3ECE0] before:pointer-events-none overflow-hidden">
        <header className="relative z-10 shrink-0 flex items-center justify-between border-b border-[#DED4C7] bg-[#FCFBF7] px-4 py-3 sm:px-6">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#2C2621] truncate uppercase tracking-wider">
              {title}
            </h3>
            <p className="font-serif text-[10px] text-[#8C7A6B] uppercase tracking-widest mt-0.5">
              Document Archive Specimen
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-[#5C5045] hover:text-[#2C2621] hover:bg-[#FAF8F5] border border-transparent hover:border-[#DED4C7] transition-all"
              title="Download Document"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[#5C5045] hover:text-[#2C2621] hover:bg-[#FAF8F5] border border-transparent hover:border-[#DED4C7] transition-all"
              title="Close Viewer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="relative z-10 shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-[#DED4C7] bg-[#FAF8F5] px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={pageNum <= 1}
              className="p-1 text-[#5C5045] hover:text-[#2C2621] disabled:opacity-30 disabled:hover:text-[#5C5045] transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-serif text-xs text-[#5C5045] min-w-[70px] text-center">
              Page {pageNum} of {numPages || "?"}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pageNum >= numPages}
              className="p-1 text-[#5C5045] hover:text-[#2C2621] disabled:opacity-30 disabled:hover:text-[#5C5045] transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-[#DED4C7] bg-white divide-x divide-[#DED4C7]">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="p-1.5 text-[#5C5045] hover:text-[#2C2621] disabled:opacity-30 hover:bg-[#FAF8F5] transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-2.5 font-serif text-[11px] text-[#5C5045] select-none min-w-[45px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3.0}
                className="p-1.5 text-[#5C5045] hover:text-[#2C2621] disabled:opacity-30 hover:bg-[#FAF8F5] transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={handleRotate}
              className="p-1.5 text-[#5C5045] hover:text-[#2C2621] border border-[#DED4C7] bg-white hover:bg-[#FAF8F5] transition-all"
              title="Rotate Page"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-auto p-4 sm:p-6 flex items-start justify-center bg-[#FAF8F5] relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FAF8F5]/90 z-20">
              <Loader2 className="h-8 w-8 text-[#5C5045] animate-spin mb-3" />
              <p className="font-serif text-xs italic text-[#6E6155]">
                Restoring physical specimen pages...
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
              <p className="font-serif text-sm text-red-800 mb-2 font-semibold">{error}</p>
              <p className="font-serif text-xs text-[#6E6155]">
                Please check your network or download the document directly.
              </p>
            </div>
          )}

          <div className="shadow-lg border border-[#E3DAC9] bg-white max-w-full">
            <canvas ref={canvasRef} className="max-w-full block" />
          </div>
        </div>
      </div>
    </div>
  );
}
