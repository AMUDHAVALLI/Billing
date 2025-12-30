'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Customers', href: '/customers', icon: '👥' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Invoices', href: '/invoices', icon: '📄' },
    { name: 'Company', href: '/company', icon: '🏢' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl">
      <div className="px-6 py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-accent-500 text-transparent bg-clip-text">
          💰 BillEase
        </h1>
        <p className="text-gray-400 text-sm mt-1">GST Billing System</p>
      </div>

      <nav className="px-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
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

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="bg-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-400">Version 1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">© 2025 BillEase</p>
        </div>
      </div>
    </div>
  );
}
