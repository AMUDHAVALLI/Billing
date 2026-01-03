'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import { invoiceAPI } from '@/lib/api';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await invoiceAPI.getById(id);
      setInvoice(response.data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await invoiceAPI.downloadPDF(id);
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
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invoice not found</h2>
          <Button onClick={() => router.push('/invoices')}>Back to Invoices</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Invoice Details</h1>
              <p className="text-gray-600">Full breakdown of invoice {invoice.invoiceNumber}</p>
            </div>
            <div className="space-x-4">
              <Button variant="secondary" onClick={() => router.push('/invoices')}>
                ← Back
              </Button>
              <Button onClick={() => router.push(`/invoices/edit/${id}`)}>
                ✏️ Edit
              </Button>
              <Button variant="success" onClick={handleDownloadPDF}>
                📥 Download PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Invoice Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Invoice Info</h2>
              <DetailRow label="Invoice No" value={invoice.invoiceNumber} bold />
              <DetailRow label="Date" value={new Date(invoice.date).toLocaleDateString('en-IN')} />
              <DetailRow 
                label="Status" 
                value={
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status.toUpperCase()}
                  </span>
                } 
              />
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Company (Seller)</h2>
              <DetailRow label="Name" value={invoice.company.name} bold />
              <DetailRow label="GSTIN" value={invoice.company.gstin} />
              <DetailRow label="State" value={`${invoice.company.state} (${invoice.company.stateCode})`} />
              <div className="mt-2 text-sm text-gray-600 italic">
                {invoice.company.address}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Customer (Buyer)</h2>
              <DetailRow label="Name" value={invoice.customer.name} bold />
              <DetailRow label="GSTIN" value={invoice.customer.gstin || 'N/A'} />
              <DetailRow label="State" value={`${invoice.customer.state} (${invoice.customer.stateCode})`} />
              <div className="mt-2 text-sm text-gray-600 italic">
                {invoice.customer.address}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-center">HSN</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-center">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-right">Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-center">GST %</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.hsnCode}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">₹{item.rate.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{item.gstRate}%</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold text-right">₹{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6">
              <DetailRow label="Subtotal" value={`₹${invoice.subtotal.toFixed(2)}`} />
              
              {invoice.cgst > 0 && (
                <>
                  <DetailRow label="CGST" value={`₹${invoice.cgst.toFixed(2)}`} />
                  <DetailRow label="SGST" value={`₹${invoice.sgst.toFixed(2)}`} />
                </>
              )}
              
              {invoice.igst > 0 && (
                <DetailRow label="IGST" value={`₹${invoice.igst.toFixed(2)}`} />
              )}
              
              {invoice.roundOff !== 0 && (
                <DetailRow label="Round Off" value={`₹${invoice.roundOff.toFixed(2)}`} />
              )}
              
              <div className="border-t mt-4 pt-4 flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-primary-700">₹{invoice.total.toFixed(2)}</span>
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
