"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Save,
  Loader2,
  UploadCloud,
  FileText,
  Music,
  Trash2,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";

// Form Validation Schema via Zod
const letterheadSchema = z.object({
  company_name: z.string().min(1, "Company Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  company_division: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().max(2, "Country must be 2 characters").nullable().optional(),
  year_exact: z.number().nullable().optional(),
  year_circa: z.number().nullable().optional(),
  era: z.string().nullable().optional(),
  document_type: z.string().nullable().optional(),
  language: z.string().max(2, "Language must be 2 characters").nullable().optional(),
  recipient: z.string().nullable().optional(),
  design_notes: z.string().nullable().optional(),
  provenance: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  condition_notes: z.string().nullable().optional(),
  is_published: z.boolean().default(false),
});

interface EditItemClientProps {
  initialItem: any;
  initialEphemera: any[];
}

export default function EditItemClient({ initialItem, initialEphemera }: EditItemClientProps) {
  const router = useRouter();
  const [ephemeraList, setEphemeraList] = useState<any[]>(initialEphemera);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [isUploadingEphemera, setIsUploadingEphemera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [ephemeraError, setEphemeraError] = useState<string | null>(null);

  // Setup React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      company_name: initialItem.company_name || "",
      slug: initialItem.slug || "",
      company_division: initialItem.company_division || "",
      city: initialItem.city || "",
      country: initialItem.country || "",
      year_exact: initialItem.year_exact !== null ? initialItem.year_exact : "",
      year_circa: initialItem.year_circa !== null ? initialItem.year_circa : "",
      era: initialItem.era || "",
      document_type: initialItem.document_type || "",
      language: initialItem.language || "",
      recipient: initialItem.recipient || "",
      typewriter_models: initialItem.typewriter_models?.join(", ") || "",
      design_notes: initialItem.design_notes || "",
      provenance: initialItem.provenance || "",
      source: initialItem.source || "",
      condition_notes: initialItem.condition_notes || "",
      is_published: initialItem.is_published || false,
    },
  });

  const companyNameWatch = watch("company_name");
  const cityWatch = watch("city");
  const yearExactWatch = watch("year_exact");
  const yearCircaWatch = watch("year_circa");

  // Dynamic slug suggestions
  const handleAutoSlug = () => {
    const yearVal = yearExactWatch || yearCircaWatch || "";
    const parts = [companyNameWatch, cityWatch, yearVal.toString()].filter(Boolean);
    const generated = parts
      .join("-")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setValue("slug", generated, { shouldDirty: true });
  };

  // Submit Metadata Form
  const onSubmitMetadata = async (data: any) => {
    setIsSavingForm(true);
    setError(null);
    setSuccessMessage(null);
    setValidationErrors({});

    const typewriterModelsArray = data.typewriter_models
      .split(",")
      .map((m: string) => m.trim())
      .filter((m: string) => m.length > 0);

    const payload = {
      ...data,
      year_exact: data.year_exact !== "" ? Number(data.year_exact) : null,
      year_circa: data.year_circa !== "" ? Number(data.year_circa) : null,
      typewriter_models: typewriterModelsArray,
    };

    // Zod validation check
    const validation = letterheadSchema.safeParse(payload);
    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        errorMap[err.path.join(".")] = err.message;
      });
      setValidationErrors(errorMap);
      setIsSavingForm(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/items/${initialItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to update letterhead attributes");
      }

      setSuccessMessage("Letterhead metadata saved successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred saving");
    } finally {
      setIsSavingForm(false);
    }
  };

  // Ephemera Drag & Drop Upload
  const handleEphemeraDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setEphemeraError(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadEphemeraFile(files[0]);
    }
  };

  const handleEphemeraFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setEphemeraError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadEphemeraFile(files[0]);
    }
  };

  const uploadEphemeraFile = async (file: File) => {
    setIsUploadingEphemera(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("letterhead_id", initialItem.id);
      formData.append("sort_order", ephemeraList.length.toString());

      const response = await fetch("/api/admin/upload-ephemera", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload ephemera attachment");
      }

      setEphemeraList((prev) => [...prev, data.ephemera]);
      router.refresh();
    } catch (err: any) {
      setEphemeraError(err.message || "Error uploading ephemera");
    } finally {
      setIsUploadingEphemera(false);
    }
  };

  // Inline updates for ephemera (role, caption, description) on blur
  const handleEphemeraInlineUpdate = async (id: string, field: string, value: string) => {
    try {
      const response = await fetch("/api/admin/ephemera", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update ephemera inline");
      }

      setEphemeraList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
      );
    } catch (err) {
      console.error("Inline save failed:", err);
    }
  };

  // Delete individual ephemera (Blob + DB)
  const handleEphemeraDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ephemera attachment? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/ephemera?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete ephemera");
      }

      setEphemeraList((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Error deleting ephemera");
    }
  };

  // dnd-kit Sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = ephemeraList.findIndex((item) => item.id === active.id);
      const newIndex = ephemeraList.findIndex((item) => item.id === over.id);

      const reorderedList = arrayMove(ephemeraList, oldIndex, newIndex);
      setEphemeraList(reorderedList);

      // Instantly post new order to DB
      const reorderPayload = reorderedList.map((item, index) => ({
        id: item.id,
        sort_order: index,
      }));

      try {
        const response = await fetch("/api/admin/ephemera/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: reorderPayload }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update reordering on database");
        }
      } catch (err) {
        console.error("Failed to reorder:", err);
        alert("Sort order synchronization failed.");
      }
    }
  };

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Edit Letterhead</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Update registry attributes, validation parameters, and attach ephemera resources.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Metadata Form */}
      <form onSubmit={handleSubmit(onSubmitMetadata)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Metadata Details
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("company_name")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
            {validationErrors.company_name && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.company_name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Unique Slug <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoSlug}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1"
              >
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              {...register("slug")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm font-mono"
            />
            {validationErrors.slug && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.slug}</p>
            )}
          </div>

          {/* Company Division */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Company Division / Sub-brand
            </label>
            <input
              type="text"
              {...register("company_division")}
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
              {...register("city")}
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
              {...register("country")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
            {validationErrors.country && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.country}</p>
            )}
          </div>

          {/* Language */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Language (2-letter Code)
            </label>
            <input
              type="text"
              maxLength={2}
              {...register("language")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
            {validationErrors.language && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.language}</p>
            )}
          </div>

          {/* Year Exact */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Exact Year
            </label>
            <input
              type="number"
              {...register("year_exact")}
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
              {...register("year_circa")}
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
              {...register("era")}
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
              {...register("document_type")}
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
              {...register("recipient")}
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
              {...register("typewriter_models")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="is_published"
              {...register("is_published")}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <label htmlFor="is_published" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Publish on public catalog
            </label>
          </div>
        </div>

        {/* Textareas */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Design & Typography Notes
            </label>
            <textarea
              rows={3}
              {...register("design_notes")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Provenance
            </label>
            <textarea
              rows={2}
              {...register("provenance")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Collection Source
            </label>
            <textarea
              rows={2}
              {...register("source")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Condition Notes
            </label>
            <textarea
              rows={2}
              {...register("condition_notes")}
              className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSavingForm}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
          >
            {isSavingForm ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving Details...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Metadata</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Section 2: Ephemera Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ephemera Resources</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload associated attachments like images, envelope designs, watermarks, or audio recordings. Drag to reorder.
          </p>
        </div>

        {ephemeraError && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-400">
            {ephemeraError}
          </div>
        )}

        {/* Drag & Drop Upload Ephemera */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleEphemeraDrop}
          className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-slate-600 rounded-xl p-8 transition-all cursor-pointer relative"
        >
          <input
            type="file"
            id="ephemera-upload"
            onChange={handleEphemeraFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Drag & Drop to attach ephemera, or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports Images, PDFs, and Audio uploads (will be sorted automatically)
            </p>
          </div>
        </div>

        {isUploadingEphemera && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium justify-center py-2 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing and uploading ephemera file...</span>
          </div>
        )}

        {/* Sortable Listing of Ephemera */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          {ephemeraList.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              No ephemera files attached to this record yet.
            </p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={ephemeraList.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {ephemeraList.map((ephem) => (
                    <SortableEphemeraRow
                      key={ephem.id}
                      ephem={ephem}
                      onInlineUpdate={handleEphemeraInlineUpdate}
                      onDelete={handleEphemeraDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}

// Draggable Sortable Row Component
function SortableEphemeraRow({
  ephem,
  onInlineUpdate,
  onDelete,
}: {
  ephem: any;
  onInlineUpdate: (id: string, field: string, val: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ephem.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const [role, setRole] = useState(ephem.role || "");
  const [caption, setCaption] = useState(ephem.caption || "");
  const [description, setDescription] = useState(ephem.description || "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col lg:flex-row gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-2xs items-start lg:items-center relative"
    >
      {/* Drag Grip Handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing self-start lg:self-center"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Resource Thumbnail / Kind Indicator */}
      <div className="h-16 w-16 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 self-start lg:self-center">
        {ephem.thumb_url ? (
          <img src={ephem.thumb_url} alt={ephem.role || "ephemera"} className="h-full w-full object-cover" />
        ) : ephem.kind === "pdf" ? (
          <FileText className="h-8 w-8 text-rose-500" />
        ) : ephem.kind === "audio" ? (
          <Music className="h-8 w-8 text-sky-500" />
        ) : (
          <ImageIcon className="h-8 w-8 text-slate-400" />
        )}
      </div>

      {/* Inputs Form Section */}
      <div className="flex-1 grid gap-3 sm:grid-cols-3 w-full">
        {/* Role Input */}
        <div className="space-y-1">
          <label className="text-3xs uppercase tracking-wider font-semibold text-slate-400">Role / Function</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onBlur={() => onInlineUpdate(ephem.id, "role", role)}
            placeholder="e.g. Watermark, Envelope"
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none rounded bg-slate-50/50 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Caption Input */}
        <div className="space-y-1">
          <label className="text-3xs uppercase tracking-wider font-semibold text-slate-400">Caption</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={() => onInlineUpdate(ephem.id, "caption", caption)}
            placeholder="e.g. Back view of envelope"
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none rounded bg-slate-50/50 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-1">
          <label className="text-3xs uppercase tracking-wider font-semibold text-slate-400">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => onInlineUpdate(ephem.id, "description", description)}
            placeholder="Detailed notes on paper condition..."
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 focus:border-indigo-500 focus:outline-none rounded bg-slate-50/50 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Delete Trigger */}
      <button
        type="button"
        onClick={() => onDelete(ephem.id)}
        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors self-end lg:self-center"
        title="Delete ephemera attachment"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
