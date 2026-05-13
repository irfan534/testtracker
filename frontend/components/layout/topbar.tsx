'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { useUIStore } from '@/lib/store';
import Link from 'next/link';

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const handleSearch = (query: string) => {
    // Navigate to search results page with query parameter
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={toggleSidebar} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm hover:shadow-md transition">
            <Menu className="h-5 w-5" />
          </button>
          <div className="rounded-2xl bg-slate-50 px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              <input
                type="search"
                placeholder="Search certifications, frameworks, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleSearch(searchQuery.trim());
                  }
                }}
                className="bg-transparent outline-none placeholder:text-slate-400 w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/notifications" className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm hover:shadow-md transition">
            <Bell className="h-5 w-5" />
          </Link>
          <div className="relative">
            <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:bg-slate-50">
              <span className="text-sm font-medium">Admin</span>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
                <Link href="/profile" className="block rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Profile</Link>
                <Link href="/settings" className="block rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Settings</Link>
                <Link href="/logout" className="block rounded-2xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Logout</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
