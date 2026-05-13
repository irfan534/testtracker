'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/lib/store';
import { LayoutDashboard, Award, Upload, BarChart3, Calendar, FileText, Settings, User, Bell, LogOut, TrendingUp, Database } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, category: 'main' },
  { label: 'Reports', href: '/reports', icon: BarChart3, category: 'main' },
  { label: 'Import', href: '/uploads', icon: Upload, category: 'main' },
  { label: 'Companies', href: '/companies', icon: Database, category: 'main' },
  { label: 'Certifications', href: '/certifications', icon: Award, category: 'main' },
  { label: 'Audit Logs', href: '/audit-logs', icon: FileText, category: 'secondary' },
  { label: 'Settings', href: '/settings', icon: Settings, category: 'secondary' },
  { label: 'Profile', href: '/profile', icon: User, category: 'secondary' },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const pathname = usePathname();

  return (
    <aside className={`bg-white text-gray-900 transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-20'} overflow-hidden shadow-lg border-r border-gray-200`}>
      <div className="h-full flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
              <h1 className="text-2xl font-semibold text-gray-900">
                Tracker
              </h1>
              <p className="text-xs text-gray-500">Compliance Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ${sidebarOpen ? 'block' : 'hidden'}`}>
              Main
            </h3>
            <nav className="space-y-1">
              {navItems.filter(item => item.category === 'main').map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-black text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>
                    )}

                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <span className={`${sidebarOpen ? 'inline' : 'hidden'} ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Secondary Navigation */}
          <div>
            <h3 className={`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ${sidebarOpen ? 'block' : 'hidden'}`}>
              System
            </h3>
            <nav className="space-y-1">
              {navItems.filter(item => item.category === 'secondary').map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-black text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>
                    )}
                    
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <span className={`${sidebarOpen ? 'inline' : 'hidden'} ${isActive ? 'text-white' : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}