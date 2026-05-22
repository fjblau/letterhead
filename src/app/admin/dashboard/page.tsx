import { db } from "@/db";
import { letterhead } from "@/db/schema";
import { count, eq, desc } from "drizzle-orm";
import { list } from "@vercel/blob";
import Link from "next/link";
import { FileText, Files, HardDrive, PlusCircle, CheckCircle, Edit, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default async function AdminDashboardPage() {
  // Query DB Curation Metrics
  const [totalRes] = await db.select({ count: count() }).from(letterhead);
  const [publishedRes] = await db.select({ count: count() }).from(letterhead).where(eq(letterhead.is_published, true));

  const totalCataloged = totalRes?.count || 0;
  const publishedCount = publishedRes?.count || 0;
  const draftCount = totalCataloged - publishedCount;

  // Retrieve storage statistics from Vercel Blob or fallback
  let totalFiles = 0;
  let totalSizeBytes = 0;
  let isMock = true;

  if (process.env.MOCK_STORAGE !== "true" && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      let hasMore = true;
      let cursor: string | undefined;
      while (hasMore) {
        const response = await list({ cursor });
        totalFiles += response.blobs.length;
        for (const blob of response.blobs) {
          totalSizeBytes += blob.size;
        }
        hasMore = response.hasMore;
        cursor = response.cursor;
      }
      isMock = false;
    } catch (err) {
      console.error("Vercel Blob list failed, falling back to database estimates:", err);
    }
  }

  // Fallback estimates from database if we couldn't query Blob directly or in mock mode
  if (isMock) {
    const letterheadsWithFiles = await db.select().from(letterhead);
    for (const item of letterheadsWithFiles) {
      if (item.pdf_url) {
        totalFiles += 1;
        totalSizeBytes += item.pdf_size_bytes || 0;
      }
      if (item.thumb_url) {
        totalFiles += 1;
        totalSizeBytes += 50 * 1024; // estimate 50KB for thumbnails
      }
    }
    // Also include ephemera files
    const ephemeraFiles = await db.query.letterheadEphemera?.findMany() || [];
    for (const ephem of ephemeraFiles) {
      if (ephem.file_url) {
        totalFiles += 1;
        totalSizeBytes += ephem.file_size_bytes || 0;
      }
      if (ephem.thumb_url) {
        totalFiles += 1;
        totalSizeBytes += 30 * 1024; // estimate 30KB for ephemera thumbs
      }
    }
  }

  // Query recent activity
  const recentActivities = await db
    .select()
    .from(letterhead)
    .orderBy(desc(letterhead.updated_at))
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Real-time metrics and quick management options for corporate letterhead records.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat 1: Total Cataloged */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Cataloged</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalCataloged}</h3>
          </div>
        </div>

        {/* Stat 2: Published vs Draft */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status Ratio</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {publishedCount} <span className="text-sm font-normal text-slate-500">pub</span>
              {" / "}
              {draftCount} <span className="text-sm font-normal text-slate-500">draft</span>
            </h3>
          </div>
        </div>

        {/* Stat 3: Total Files */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 rounded-lg">
            <Files className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Files</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalFiles} <span className="text-xs font-normal text-slate-400">{isMock ? "(est.)" : ""}</span>
            </h3>
          </div>
        </div>

        {/* Stat 4: Vercel Blob Storage */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Storage Usage</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatBytes(totalSizeBytes)} <span className="text-xs font-normal text-slate-400">{isMock ? "(est.)" : ""}</span>
            </h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Actions & Recent Activities */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-3">
            <Link
              href="/admin/items/new"
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-indigo-200 hover:border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50/60 dark:border-indigo-950 dark:hover:border-indigo-900 dark:bg-indigo-950/10 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium text-sm transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Catalog New Letterhead</span>
            </Link>
            <Link
              href="/admin/items"
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 dark:border-slate-800 dark:hover:border-slate-700 dark:bg-slate-800/20 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all"
            >
              <FileText className="h-4 w-4" />
              <span>Browse Existing Registry</span>
            </Link>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activities</h2>
            <Link
              href="/admin/items"
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              <span>View all registry</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentActivities.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm py-4 text-center">
                No cataloged items found yet. Use "Catalog New Letterhead" to add one!
              </p>
            ) : (
              recentActivities.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                      {item.thumb_url ? (
                        <img src={item.thumb_url} alt={item.company_name} className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {item.company_name}
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">
                        {[item.city, item.year_exact || item.year_circa].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                        item.is_published
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50"
                      }`}
                    >
                      {item.is_published ? "Published" : "Draft"}
                    </span>
                    <Link
                      href={`/admin/items/${item.id}/edit`}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
