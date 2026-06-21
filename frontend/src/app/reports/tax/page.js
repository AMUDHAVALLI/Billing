'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { invoiceAPI } from '@/lib/api';
import * as XLSX from 'xlsx';

export default function TaxReport() {
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.getTaxReport(month, year);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch Tax report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const downloadExcel = () => {
    const monthName = months.find((m) => m.value === month)?.label || '';
    const worksheetData = data.map((item) => ({
      'Invoice No.': item.invoiceNumber,
      'Date': formatDate(item.date),
      'Customer Name': item.customerName,
      'Customer GSTIN': item.customerGstin,
      'Taxable Amount (₹)': item.subtotal,
      'CGST (₹)': item.cgst,
      'SGST (₹)': item.sgst,
      'IGST (₹)': item.igst,
      'Total GST (₹)': item.totalTax,
      'Total Amount (₹)': item.total,
    }));

    // Add totals row
    const totalTaxable = data.reduce((sum, item) => sum + item.subtotal, 0);
    const totalCgst = data.reduce((sum, item) => sum + item.cgst, 0);
    const totalSgst = data.reduce((sum, item) => sum + item.sgst, 0);
    const totalIgst = data.reduce((sum, item) => sum + item.igst, 0);
    const totalTax = data.reduce((sum, item) => sum + item.totalTax, 0);
    const totalAmount = data.reduce((sum, item) => sum + item.total, 0);

    worksheetData.push({
      'Invoice No.': 'TOTAL',
      'Date': '',
      'Customer Name': '',
      'Customer GSTIN': '',
      'Taxable Amount (₹)': totalTaxable,
      'CGST (₹)': totalCgst,
      'SGST (₹)': totalSgst,
      'IGST (₹)': totalIgst,
      'Total GST (₹)': totalTax,
      'Total Amount (₹)': totalAmount,
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tax Report');

    const fileName = `Tax_Report_${monthName}_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const totalTaxable = data.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCgst = data.reduce((sum, item) => sum + item.cgst, 0);
  const totalSgst = data.reduce((sum, item) => sum + item.sgst, 0);
  const totalIgst = data.reduce((sum, item) => sum + item.igst, 0);
  const totalTax = data.reduce((sum, item) => sum + item.totalTax, 0);
  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 text-transparent bg-clip-text mb-2">
                Month wise Bill based Tax Report
              </h1>
              <p className="text-gray-600 font-medium">
                Detailed bill-by-bill summary of taxable values and GST splits
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="bg-white border border-gray-200 text-gray-900 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block p-2.5 shadow-sm transition-all duration-200"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Select Year</label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="bg-white border border-gray-200 text-gray-900 text-sm font-semibold rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block p-2.5 shadow-sm transition-all duration-200"
                >
                  {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-end mt-5">
                <button
                  onClick={downloadExcel}
                  className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 ${
                    data.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={data.length === 0}
                >
                  <span>📥 Download Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border-l-4 border-emerald-500 flex flex-col justify-between">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Taxable Value</h3>
              <p className="text-xl font-bold text-gray-900 mt-2">₹{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border-l-4 border-amber-500 flex flex-col justify-between">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">CGST</h3>
              <p className="text-xl font-bold text-gray-900 mt-2">₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border-l-4 border-orange-500 flex flex-col justify-between">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">SGST</h3>
              <p className="text-xl font-bold text-gray-900 mt-2">₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border-l-4 border-indigo-500 flex flex-col justify-between">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">IGST</h3>
              <p className="text-xl font-bold text-gray-900 mt-2">₹{totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border-l-4 border-rose-500 flex flex-col justify-between">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Tax (GST)</h3>
              <p className="text-xl font-bold text-red-600 mt-2">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border-l-4 border-primary-500 flex flex-col justify-between">
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Value</h3>
              <p className="text-xl font-bold text-primary-600 mt-2">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                <span className="text-gray-500 font-medium">Fetching tax data...</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Invoice No.</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Date</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Customer Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Customer GSTIN</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Taxable Amount</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">CGST</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">SGST</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">IGST</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total GST</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-center text-gray-500 font-medium">
                          No invoice data found for the selected month and year.
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/80 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <Link 
                              href={`/invoices/${item.id}`}
                              className="font-bold text-primary-600 hover:text-primary-800 transition-colors hover:underline"
                            >
                              {item.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-center font-medium">{formatDate(item.date)}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{item.customerName}</td>
                          <td className="px-6 py-4 font-mono text-gray-600 text-sm">{item.customerGstin}</td>
                          <td className="px-6 py-4 text-gray-700 text-right font-medium">₹{item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-gray-600 text-right">₹{item.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-gray-600 text-right">₹{item.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-gray-600 text-right">₹{item.igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 text-red-600 font-semibold text-right">₹{item.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="px-6 py-4 font-bold text-gray-900 text-right">₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.length > 0 && (
                    <tfoot className="bg-gray-50/90 font-bold border-t-2 border-gray-200 text-gray-900">
                      <tr>
                        <td className="px-6 py-4" colSpan="4">Total</td>
                        <td className="px-6 py-4 text-right">₹{totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right">₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right">₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right">₹{totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-red-600 text-right">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-primary-600 text-right text-base">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
