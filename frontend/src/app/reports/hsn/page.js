'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { invoiceAPI } from '@/lib/api';
import * as XLSX from 'xlsx';

export default function HsnReport() {
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
      const res = await invoiceAPI.getHsnReport(month, year);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch HSN report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const monthName = months.find((m) => m.value === month)?.label || '';
    const worksheetData = data.map((item) => ({
      'HSN Code': item.hsnCode,
      'Total Quantity': item.totalQuantity,
      'Total Taxable Amount (₹)': item.totalAmount,
      'Total Tax Amount (₹)': item.taxAmount,
    }));

    // Add totals row
    const totalQuantity = data.reduce((sum, item) => sum + item.totalQuantity, 0);
    const totalTaxable = data.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalTax = data.reduce((sum, item) => sum + item.taxAmount, 0);
    worksheetData.push({
      'HSN Code': 'TOTAL',
      'Total Quantity': totalQuantity,
      'Total Taxable Amount (₹)': totalTaxable,
      'Total Tax Amount (₹)': totalTax,
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'HSN Report');

    const fileName = `HSN_Report_${monthName}_${year}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const totalTaxable = data.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalTax = data.reduce((sum, item) => sum + item.taxAmount, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">HSN Code Wise Monthly Report</h1>
              <p className="text-gray-600">Monthly breakdown of revenue and GST by HSN code</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Select Month:</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 shadow-sm"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">Select Year:</label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 shadow-sm"
                >
                  {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-end mt-6">
                <button
                  onClick={downloadExcel}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
                  disabled={data.length === 0}
                >
                  <span>📥 Download Excel</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-primary-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Taxable Amount</h3>
              <p className="text-3xl font-bold text-gray-900">₹{totalTaxable.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-accent-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Tax Amount</h3>
              <p className="text-3xl font-bold text-gray-900">₹{totalTax.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">HSN Code</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total Quantity</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total Taxable Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total Tax Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                        No data available for the selected month and year.
                      </td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.hsnCode} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{item.hsnCode}</td>
                        <td className="px-6 py-4 text-gray-600 text-right">{item.totalQuantity}</td>
                        <td className="px-6 py-4 text-gray-600 text-right">₹{item.totalAmount.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-gray-600 text-right">₹{item.taxAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-gray-900">Total</td>
                      <td className="px-6 py-4 text-gray-900 text-right">{data.reduce((sum, item) => sum + item.totalQuantity, 0)}</td>
                      <td className="px-6 py-4 text-gray-900 text-right">₹{totalTaxable.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-primary-600 text-right">₹{totalTax.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
