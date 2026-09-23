'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';
import { authAPI } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [scrolling, setScrolling] = useState(false);
  const scrollTimeout = useRef(null);

  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    authAPI
      .me()
      .then((res) => setEmail(res.data.email))
      .catch(() => {});
  }, []);

  function handleLogout() {
    clearToken();
    router.replace('/login');
  }

  function handleNavScroll() {
    setScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => setScrolling(false), 800);
  }

  function openPasswordModal() {
    setMenuOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwError('');
    setPwSuccess(false);
    setPwModalOpen(true);
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setPwError('');
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.updatePassword({ currentPassword, newPassword });
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.error || 'Could not update password');
    } finally {
      setPwLoading(false);
    }
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

  const accountDropdown = menuOpen && (
    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white p-4 shadow-2xl border border-gray-100 text-gray-800 z-50">
      <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Signed in as</p>
      <p className="mt-1 font-semibold break-all">{email || '…'}</p>
      <div className="my-3 border-t border-gray-100" />
      <button
        type="button"
        onClick={openPasswordModal}
        className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 mb-2 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-all duration-200"
      >
        <span className="text-lg">🔑</span>
        <span>Update password</span>
      </button>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2 font-semibold text-white cursor-pointer transition-all duration-200"
      >
        <span className="text-lg">🚪</span>
        <span>Log out</span>
      </button>
    </div>
  );

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
        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account"
            className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 flex items-center justify-center cursor-pointer"
          >
            <span className="text-sm">👤</span>
          </button>
          {accountDropdown}
        </div>
      </div>

      {/* Desktop top navbar: sits to the right of the fixed sidebar */}
      <div className="hidden md:flex fixed top-0 left-64 right-0 h-16 z-40 bg-white border-b border-gray-100 shadow-sm items-center justify-end px-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Account"
            className="rounded-full p-1 cursor-pointer hover:bg-gray-100 transition-all duration-200"
          >
            <span className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-600 to-accent-600 flex items-center justify-center text-white">
              👤
            </span>
          </button>
          {accountDropdown}
        </div>
      </div>

      {/* Click-outside layer for the account dropdown */}
      {menuOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
      )}

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

        <nav
          onScroll={handleNavScroll}
          className={`sidebar-nav px-4 space-y-2 overflow-y-auto ${scrolling ? 'is-scrolling' : ''}`}
          style={{ maxHeight: 'calc(100% - 120px)' }}
        >
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

      </div>

      {/* Version box: decorative, so it steps aside on small screens rather
          than fighting page content for the same corner. */}
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-200/50">
          <p className="text-xs text-gray-500 font-bold">Version 1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">© 2025 BillEase</p>
        </div>
      </div>

      <Modal isOpen={pwModalOpen} onClose={() => setPwModalOpen(false)} title="Update password" size="sm">
        {pwSuccess ? (
          <div className="text-center py-4">
            <p className="text-green-600 font-semibold mb-4">Password updated successfully.</p>
            <Button variant="primary" className="w-full" onClick={() => setPwModalOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {pwError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{pwError}</p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={pwLoading}>
              {pwLoading ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
