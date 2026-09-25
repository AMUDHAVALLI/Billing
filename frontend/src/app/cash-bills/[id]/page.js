'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import AlertDialog from '@/components/ui/AlertDialog';
import { cashBillAPI } from '@/lib/api';

export default function ViewCashBillPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [cashBill, setCashBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null);

  useEffect(() => {
    if (id) {
      fetchBillDetails();
    }
  }, [id]);

  const fetchBillDetails = async () => {
    try {
      const res = await cashBillAPI.getById(id);
      setCashBill(res.data);
    } catch (err) {
      console.error('Failed to load bill details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!cashBill) return;
    try {
      const response = await cashBillAPI.downloadPDF(cashBill.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      setAlertMessage('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 pt-14 md:pt-16 md:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (!cashBill) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 pt-14 md:pt-16 md:ml-64 p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Cash Bill Not Found</h2>
            <p className="text-gray-500 mb-6">The requested Cash / Service Bill could not be located.</p>
            <Link href="/cash-bills">
              <Button>← Back to Cash Bills</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 pt-14 md:pt-16 md:ml-64 overflow-auto">
        <div className="p-8 max-w-5xl mx-auto">
          {/* Top Bar Actions */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <Link href="/cash-bills">
              <Button variant="secondary" className="text-sm">
                ← Back to Cash Bills
              </Button>
            </Link>
            <div className="flex gap-3">
              <Link href={`/cash-bills/edit/${cashBill.id}`}>
                <Button variant="secondary" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  ✏️ Edit Bill
                </Button>
              </Link>
              <Button
                onClick={handleDownloadPDF}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
              >
                📥 Download / Print PDF
              </Button>
            </div>
          </div>

          {/* Receipt Pad Styled Mockup Container */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            {/* Header Badge */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                {/* Same logo the downloaded PDF uses, not a separate
                    hand-drawn stand-in — so the preview matches what
                    actually gets printed. */}
                <img
                  src="/system-doctor-logo.png"
                  alt="System Doctor"
                  className="h-16 w-auto object-contain"
                />
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">Sri Balaji Computers</h1>
                  <p className="text-xs text-gray-500">No.75, East Pondy Main Road, Villianur, Puducherry - 110.</p>
                  <p className="text-xs text-gray-500">E-mail: sbcdoctor14@gmail.com</p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs rounded-full uppercase tracking-wider mb-2">
                  CASH / SERVICE BILL
                </span>
                <p className="text-sm font-semibold text-gray-700">Cell: 72 00 11 33 44</p>
              </div>
            </div>

            <hr className="border-gray-300 mb-6" />

            {/* Bill Metadata */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Sl. No. / Bill No.</p>
                <p className="text-2xl font-black text-red-600">{cashBill.billNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold">Date</p>
                <p className="text-base font-bold text-gray-800">
                  {new Date(cashBill.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase font-bold">Client Name</p>
                <p className="text-lg font-bold text-gray-900">{cashBill.clientName}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="w-full max-w-full overflow-x-auto rounded-xl border border-gray-300 mb-6">
              <table className="w-full min-w-[650px] divide-y divide-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-800 uppercase tracking-wider">Particulars</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-800 uppercase tracking-wider">Qty.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">Rate (₹)</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cashBill.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{item.particulars}</td>
                      <td className="px-4 py-3.5 text-sm text-center font-medium">{item.quantity}</td>
                      <td className="px-4 py-3.5 text-sm text-right font-medium">₹ {item.rate.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-sm text-right font-extrabold text-emerald-800">
                        ₹ {item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Total */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-emerald-900 text-white p-6 rounded-2xl shadow-lg">
              <div>
                <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Receipt Total</p>
                <p className="text-sm font-medium text-emerald-100 mt-0.5">
                  Calculated in INR (₹)
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-emerald-300">
                  TOTAL ₹ {cashBill.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Brand Logos Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap justify-between items-center text-gray-400 text-xs font-bold gap-6">
              <div className="flex flex-wrap items-center gap-4 md:gap-5">
                {/* intel logo */}
                <div className="flex items-center justify-center px-3.5 py-1.5 rounded-full border border-blue-400/50 bg-blue-50/50 hover:bg-blue-50 transition-colors shadow-sm" title="intel">
                  <svg viewBox="0 0 74 28" className="h-9 w-auto" fill="none">
                    <ellipse cx="37" cy="14" rx="34" ry="12" stroke="#0071C5" strokeWidth="2.2" />
                    <text x="37" y="19" textAnchor="middle" fill="#0071C5" fontWeight="900" fontStyle="italic" fontSize="16" fontFamily="sans-serif">
                      intel
                    </text>
                  </svg>
                </div>

                {/* hp logo */}
                <div className="flex items-center justify-center px-2.5 py-1.5 rounded-xl bg-[#0096D6] hover:brightness-105 transition-all shadow-md" title="hp">
                  <svg viewBox="0 0 32 32" className="h-9 w-9" fill="none">
                    <text x="16" y="24" textAnchor="middle" fill="#ffffff" fontWeight="900" fontStyle="italic" fontSize="22" fontFamily="sans-serif">
                      hp
                    </text>
                  </svg>
                </div>

                {/* DELL logo */}
                <div className="flex items-center justify-center p-1.5 rounded-full border-2 border-[#007DB8] bg-blue-50/40 hover:bg-blue-50 transition-colors shadow-sm" title="DELL">
                  <svg viewBox="0 0 40 40" className="h-9 w-9" fill="none">
                    <circle cx="20" cy="20" r="18" stroke="#007DB8" strokeWidth="3" fill="none" />
                    <text x="20" y="26" textAnchor="middle" fill="#007DB8" fontWeight="800" fontSize="14" fontFamily="sans-serif" letterSpacing="0.5">
                      DELL
                    </text>
                  </svg>
                </div>

                {/* IBM logo */}
                <div className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-900/5 hover:bg-slate-900/10 transition-colors shadow-sm" title="IBM">
                  <svg viewBox="0 0 54 24" className="h-9 w-auto">
                    <text x="0" y="20" fill="#052F5F" fontWeight="900" fontSize="22" fontFamily="Arial Black, Impact, sans-serif" letterSpacing="1">
                      IBM
                    </text>
                    <rect x="0" y="5" width="54" height="2" fill="#ffffff" />
                    <rect x="0" y="10" width="54" height="2" fill="#ffffff" />
                    <rect x="0" y="15" width="54" height="2" fill="#ffffff" />
                  </svg>
                </div>

                {/* Logitech logo */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-teal-300 bg-teal-50/60 hover:bg-teal-50 transition-colors shadow-sm" title="Logitech">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                    <circle cx="6" cy="6" r="3.5" fill="#00B8A9" />
                    <path d="M 0 20 Q 9 9 18 15 Q 9 24 0 20 Z" fill="#00B8A9" />
                  </svg>
                  <span className="text-gray-800 font-extrabold text-sm tracking-tight">logitech</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 font-bold">For Sri Balaji Computers</p>
                <p className="text-[10px] text-gray-400 mt-4">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        isOpen={!!alertMessage}
        message={alertMessage}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}
