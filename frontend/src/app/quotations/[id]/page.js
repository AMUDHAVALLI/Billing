'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import { quotationAPI } from '@/lib/api';

export default function QuotationDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const response = await quotationAPI.getById(id);
      setQuotation(response.data);
    } catch (error) {
      console.error('Failed to fetch quotation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await quotationAPI.downloadPDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 pt-14 md:pt-16 md:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 pt-14 md:pt-16 md:ml-64 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quotation not found</h2>
          <Button onClick={() => router.push('/quotations')}>Back to Quotations</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 pt-14 md:pt-16 md:ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Quotation Details</h1>
              <p className="text-gray-600">Full breakdown of quotation {quotation.quotationNumber}</p>
            </div>
            <div className="space-x-4">
              <Button variant="secondary" onClick={() => router.push('/quotations')}>
                ← Back
              </Button>
              <Button onClick={() => router.push(`/quotations/edit/${id}`)}>
                ✏️ Edit
              </Button>
              <Button variant="success" onClick={handleDownloadPDF}>
                📥 Download PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Quotation Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Quotation Info</h2>
              <DetailRow label="Quotation No" value={quotation.quotationNumber} bold />
              <DetailRow label="Date" value={new Date(quotation.date).toLocaleDateString('en-IN')} />
              <DetailRow label="Type" value={quotation.isGst === false ? 'Non-GST' : 'GST'} />
              <DetailRow
                label="Status"
                value={
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    quotation.status === 'approved' || quotation.status === 'paid' ? 'bg-green-100 text-green-800' :
                    quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {quotation.status.toUpperCase()}
                  </span>
                }
              />
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Company (Seller)</h2>
              <DetailRow label="Name" value={quotation.company.name} bold />
              <DetailRow label="GSTIN" value={quotation.company.gstin} />
              <DetailRow label="State" value={`${quotation.company.state} (${quotation.company.stateCode})`} />
              <div className="mt-2 text-sm text-gray-600 italic">
                {quotation.company.address}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Customer (Buyer)</h2>
              <DetailRow label="Name" value={quotation.customer.name} bold />
              <DetailRow label="GSTIN" value={quotation.customer.gstin || 'N/A'} />
              <DetailRow label="State" value={`${quotation.customer.state} (${quotation.customer.stateCode})`} />
              <div className="mt-2 text-sm text-gray-600 italic">
                {quotation.customer.address}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="w-full max-w-full overflow-x-auto bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
            <table className="w-full min-w-[700px] divide-y divide-gray-200">
              <thead className="bg-gray-100">
                {quotation.isGst === false ? (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Item</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Unit Price (₹)</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Amount (₹)</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-center">HSN</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-center">Qty</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-right">Rate (₹)</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-center">GST %</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-right">Amount (₹)</th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotation.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.description}</td>
                    {quotation.isGst !== false && (
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.hsnCode}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">₹{item.rate.toFixed(2)}</td>
                    {quotation.isGst !== false && (
                      <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.gstRate}%</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold text-right">₹{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Terms & Conditions and Totals Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-base font-bold text-gray-900 underline mb-3">TERMS &amp; CONDITIONS:</h3>
              <div className="text-sm text-gray-800 space-y-1">
                <div className="grid grid-cols-[100px_1fr]">
                  <span>PAYMENT</span>
                  <span>: 100% Advance,</span>
                </div>
                <div className="grid grid-cols-[100px_1fr]">
                  <span>VALIDITY</span>
                  <span>: 5 Days.</span>
                </div>
                <div className="grid grid-cols-[100px_1fr]">
                  <span>DELIVERY</span>
                  <span>: 2 Days.</span>
                </div>
              </div>
              <div className="mt-4 text-center font-serif text-sm text-gray-900">
                <p>We assure you always the best service in time.</p>
                <p>Thanking you,</p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
                <DetailRow label="Subtotal" value={`₹${quotation.subtotal.toFixed(2)}`} />

                {quotation.cgst > 0 && (
                  <>
                    <DetailRow label="CGST" value={`₹${quotation.cgst.toFixed(2)}`} />
                    <DetailRow label="SGST" value={`₹${quotation.sgst.toFixed(2)}`} />
                  </>
                )}

                {quotation.igst > 0 && (
                  <DetailRow label="IGST" value={`₹${quotation.igst.toFixed(2)}`} />
                )}

                {quotation.roundOff !== 0 && (
                  <DetailRow label="Round Off" value={`₹${quotation.roundOff.toFixed(2)}`} />
                )}

                <div className="border-t mt-4 pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-700">₹{quotation.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, bold }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

