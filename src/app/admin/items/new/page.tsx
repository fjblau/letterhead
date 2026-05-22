"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, ArrowRight, Save, Loader2, Sparkles } from "lucide-react";

export default function NewItemPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setError] = useState<string | null>(null);
  
  // Database record ID created in Step 1
  const [letterheadId, setLetterheadId] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [companyDivision, setCompanyDivision] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("US");
  const [yearExact, setYearExact] = useState<number | "">("");
  const [yearCirca, setYearCirca] = useState<number | "">("");
  const [era, setEra] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [language, setLanguage] = useState("EN");
  const [recipient, setRecipient] = useState("");
  const [typewriterModels, setTypewriterModels] = useState("");
  const [designNotes, setDesignNotes] = useState("");
  const [provenance, setProvenance] = useState("");
  const [source, setSource] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [tags, setTags] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Auto-generate slug when company name, city, or year changes (unless manually edited)
  useEffect(() => {
    if (isSlugManual) return;
    const yearVal = yearExact || yearCirca || "";
    const parts = [companyName, city, yearVal.toString()].filter(Boolean);
    const generated = parts
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setSlug(generated);
  }, [companyName, city, yearExact, yearCirca, isSlugManual]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError(null);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(droppedFile);
      } else {
        setError("Only PDF files are supported");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf")) {
        setFile(selectedFile);
      } else {
        setError("Only PDF files are supported");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (companyName) {
        formData.append("company_name", companyName);
      }

      const response = await fetch("/api/admin/upload-pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process PDF file");
      }

      setLetterheadId(data.letterhead.id);
      setPageCount(data.letterhead.pdf_page_count || 1);
      if (data.letterhead.company_name && data.letterhead.company_name !== "Uploaded Document") {
        setCompanyName(data.letterhead.company_name);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred processing PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterheadId) return;

    setIsUploading(true);
    setError(null);

    const typewriterModelsArray = typewriterModels
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      slug: slug || null,
      company_name: companyName,
      company_division: companyDivision || null,
      city: city || null,
      country: country || null,
      year_exact: yearExact !== "" ? Number(yearExact) : null,
      year_circa: yearCirca !== "" ? Number(yearCirca) : null,
      era: era || null,
      document_type: documentType || null,
      language: language || null,
      recipient: recipient || null,
      typewriter_models: typewriterModelsArray,
      design_notes: designNotes || null,
      provenance: provenance || null,
      source: source || null,
      condition_notes: conditionNotes || null,
      tags: tagsArray,
      is_published: isPublished,
    };

    try {
      const response = await fetch(`/api/admin/items/${letterheadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save letterhead details");
      }

      // Route to edit page to allow Ephemera uploads next
      router.push(`/admin/items/${letterheadId}/edit`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to save letterhead details");
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Catalog New Letterhead</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {step === 1 ? "Step 1: Upload a PDF file to run the curation pipeline." : "Step 2: Provide catalog details & metadata."}
        </p>
      </div>

      {uploadError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
          {uploadError}
        </div>
      )}

      {step === 1 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
          {/* Company Name Precheck */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Company Name (Optional Precheck)
            </label>
            <input
              type="text"
              placeholder="e.g. Underwood Typewriter Co."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
            <p className="text-xs text-slate-400">
              Providing this now helps index the file immediately during processing.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer ${
              file
                ? "border-indigo-400 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/10"
                : "border-slate-300 hover:border-indigo-400 dark:border-slate-700 dark:hover:border-slate-600"
            }`}
          >
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
            <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center text-center cursor-pointer">
              <UploadCloud className={`h-12 w-12 mb-4 ${file ? "text-indigo-500" : "text-slate-400"}`} />
              {file ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Drag and drop your PDF here, or click to browse
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports high-resolution letterhead PDF documents
                  </p>
                </div>
              )}
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Upload & Run Pipeline</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitMetadata} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-4 rounded-lg text-sm font-medium">
            <FileText className="h-4 w-4" />
            <span>PDF processed successfully! Prefilled page count is <strong>{pageCount}</strong> pages.</span>
          </div>

          {/* Form Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <span>Unique Slug</span>
                <Sparkles className="h-3 w-3 text-amber-500" />
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setIsSlugManual(true);
                }}
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm font-mono"
              />
            </div>

            {/* Division */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Company Division / Sub-brand
              </label>
              <input
                type="text"
                value={companyDivision}
                onChange={(e) => setCompanyDivision(e.target.value)}
                placeholder="e.g. Sales Division"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Chicago"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Country (2-letter Code)
              </label>
              <input
                type="text"
                maxLength={2}
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                placeholder="US"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Language (2-letter Code)
              </label>
              <input
                type="text"
                maxLength={2}
                value={language}
                onChange={(e) => setLanguage(e.target.value.toUpperCase())}
                placeholder="EN"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Year Exact */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Exact Year
              </label>
              <input
                type="number"
                value={yearExact}
                onChange={(e) => {
                  setYearExact(e.target.value === "" ? "" : Number(e.target.value));
                  if (e.target.value !== "") setYearCirca("");
                }}
                placeholder="e.g. 1934"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Year Circa */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Circa Year
              </label>
              <input
                type="number"
                value={yearCirca}
                onChange={(e) => {
                  setYearCirca(e.target.value === "" ? "" : Number(e.target.value));
                  if (e.target.value !== "") setYearExact("");
                }}
                placeholder="e.g. 1930"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Era */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Era
              </label>
              <input
                type="text"
                value={era}
                onChange={(e) => setEra(e.target.value)}
                placeholder="e.g. Art Deco, Interwar"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Document Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Document Type
              </label>
              <input
                type="text"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="e.g. Letterhead, Invoice"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Recipient */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Recipient
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. Royal Typewriter Co."
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Typewriter Models */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Typewriter Models (comma separated)
              </label>
              <input
                type="text"
                value={typewriterModels}
                onChange={(e) => setTypewriterModels(e.target.value)}
                placeholder="Underwood No. 5, Remington Standard"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="corporate, minimal, advertising"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Publish Toggle */}
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="isPublished" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Publish immediately to public catalog
              </label>
            </div>
          </div>

          {/* Text Areas */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Design Notes */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Design & Typography Notes
              </label>
              <textarea
                rows={3}
                value={designNotes}
                onChange={(e) => setDesignNotes(e.target.value)}
                placeholder="Describe the fonts, layout styles, embossing, and watermarks."
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Provenance */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Provenance
              </label>
              <textarea
                rows={2}
                value={provenance}
                onChange={(e) => setProvenance(e.target.value)}
                placeholder="Original owners or historical path."
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Source */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Collection Source
              </label>
              <textarea
                rows={2}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Where was this document procured? (e.g. donation, auction)"
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>

            {/* Condition Notes */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Condition Notes
              </label>
              <textarea
                rows={2}
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder="Fading, tears, folds, oxidation."
                className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setFile(null);
                setLetterheadId(null);
              }}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-lg transition-colors"
            >
              Start Over
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Letterhead</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
