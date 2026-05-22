"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Edit, Trash2, CheckCircle, XCircle, RefreshCw, Tag, ChevronRight, PlusCircle, ArrowUpDown } from "lucide-react";

interface Letterhead {
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
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export default function ItemsClient({ initialItems }: { initialItems: any[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Letterhead[]>(initialItems as Letterhead[]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter items based on search term and status
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.city && item.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && item.is_published) ||
      (statusFilter === "draft" && !item.is_published);

    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkAction = async (action: string, extraData?: any) => {
    if (selectedIds.length === 0) return;

    if (action === "delete" && !confirm(`Are you sure you want to delete ${selectedIds.length} items? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: selectedIds,
          ...extraData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Bulk action '${action}' failed`);
      }

      // Success, reload page data
      setSelectedIds([]);
      setBulkTagInput("");
      router.refresh();
      
      // Update local state by fetching new data or re-triggering server action via router refresh
      // For immediate response, let's wait a tiny bit then refresh router
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      alert(err.message || "An error occurred executing bulk action");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleDelete = async (id: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete ${companyName}?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/delete-letterhead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letterhead_id: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Registry Catalog</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage, publish, bulk-edit, and organize letterhead records.
          </p>
        </div>
        <Link
          href="/admin/items/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors self-start shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Catalog New Letterhead</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, city, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          />
        </div>

        {/* Tabs Status Filter */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === "all"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter("published")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === "published"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Published ({items.filter((i) => i.is_published).length})
          </button>
          <button
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              statusFilter === "draft"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Drafts ({items.filter((i) => !i.is_published).length})
          </button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
              {selectedIds.length} items selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bulk Tagging Form */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="tag1, tag2..."
                value={bulkTagInput}
                onChange={(e) => setBulkTagInput(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
              <button
                onClick={() => {
                  const parsedTags = bulkTagInput
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t.length > 0);
                  if (parsedTags.length > 0) {
                    handleBulkAction("tag", { tags: parsedTags });
                  }
                }}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded transition-colors disabled:opacity-50"
              >
                <Tag className="h-3 w-3" />
                <span>Bulk Tag</span>
              </button>
            </div>

            {/* Other actions */}
            <div className="h-6 w-px bg-indigo-200 dark:bg-indigo-900 hidden lg:block" />

            <button
              onClick={() => handleBulkAction("publish")}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs rounded shadow-2xs disabled:opacity-50"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkAction("unpublish")}
              disabled={isLoading}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs rounded shadow-2xs disabled:opacity-50"
            >
              Unpublish Selected
            </button>
            <button
              onClick={() => handleBulkAction("regenerate-thumbnail")}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs rounded shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Regen Thumbs</span>
            </button>
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={isLoading}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded shadow-2xs disabled:opacity-50"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-6 py-4 w-20">Thumbnail</th>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Date/Era</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No registry records match your filters or search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Checkbox */}
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Thumbnail */}
                    <td className="px-6 py-4">
                      <div className="h-12 w-12 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                        {item.thumb_url ? (
                          <img src={item.thumb_url} alt={item.company_name} className="h-full w-full object-cover" />
                        ) : (
                          <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                        )}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.company_name}
                      </div>
                      {item.company_division && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {item.company_division}
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      {item.city ? (
                        <div>
                          {item.city}
                          {item.country && <span className="ml-1 text-xs text-slate-400 font-semibold uppercase">{item.country}</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Date/Era */}
                    <td className="px-6 py-4">
                      {item.year_exact ? (
                        <div className="font-medium text-slate-800 dark:text-slate-200">{item.year_exact}</div>
                      ) : item.year_circa ? (
                        <div className="italic text-slate-500 dark:text-slate-400">c. {item.year_circa}</div>
                      ) : item.era ? (
                        <div className="text-xs text-slate-500">{item.era}</div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
                          item.is_published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${item.is_published ? "bg-emerald-600" : "bg-amber-500"}`} />
                        {item.is_published ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {item.tags && item.tags.length > 0 ? (
                          item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-3xs font-medium uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">no tags</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/items/${item.id}/edit`}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleSingleDelete(item.id, item.company_name)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/20 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
