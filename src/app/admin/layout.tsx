import { ReactNode } from "react";
import Link from "next/link";
import AdminNav from "@/app/admin/AdminNav";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Admin Sidebar Navigation */}
      <AdminNav />

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
