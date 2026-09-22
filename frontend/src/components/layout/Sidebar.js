'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Customers', href: '/customers', icon: '👥' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Invoices', href: '/invoices', icon: '📄' },
    { name: 'Cash / Service Bills', href: '/cash-bills', icon: '🧾' },
    { name: 'Monthly Report', href: '/reports/monthly', icon: '📅' },
    { name: 'Yearly Report', href: '/reports/yearly', icon: '📈' },
    { name: 'HSN Report', href: '/reports/hsn', icon: '🧾' },
    { name: 'Tax Report', href: '/reports/tax', icon: '💸' },
    { name: 'Company', href: '/company', icon: '🏢' },
  ];

  return (
    <>
      {/* Mobile-only top bar: the sidebar is off-canvas below md, so this is
          the only persistent chrome — a hamburger to open it. */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 bg-gray-900 text-white flex items-center px-4 shadow-lg">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-2 -ml-2 mr-2 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-bold bg-gradient-to-r from-primary-400 to-accent-500 text-transparent bg-clip-text">
          💰 BillEase
        </span>
      </div>

      {/* Backdrop, mobile only, while the drawer is open */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 cursor-pointer"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl z-[45] transform transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="px-6 py-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-500 text-transparent bg-clip-text">
              💰 BillEase
            </h1>
            <p className="text-gray-400 text-sm mt-1">GST Billing System</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="md:hidden p-1 text-gray-400 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="px-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 190px)' }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 shadow-lg scale-105'
                    : 'hover:bg-gray-700 hover:translate-x-1'
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-semibold">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center space-x-2 rounded-xl px-4 py-3 font-semibold text-gray-300 cursor-pointer hover:bg-gray-700 hover:text-white transition-all duration-200"
          >
            <span className="text-xl">🚪</span>
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Version box: decorative, so it steps aside on small screens rather
          than fighting page content for the same corner. */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-200/50">
          <p className="text-xs text-gray-500 font-bold">Version 1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">© 2025 BillEase</p>
        </div>
      </div>
    </>
  );
}
