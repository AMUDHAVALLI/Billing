'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { invoiceAPI } from '@/lib/api';

export default function MonthlyReport() {
  const [data, setData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [year]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.getMonthlyReport(year);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
  const totalGST = data.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);
  const maxTotal = Math.max(...data.map(item => item.total), 1);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Monthly Report</h1>
              <p className="text-gray-600">Monthly breakdown of revenue and GST for {year}</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-semibold text-gray-700">Select Year:</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 shadow-sm"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Yearly Revenue</h3>
              <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Total Yearly GST Collected</h3>
              <p className="text-3xl font-bold text-gray-900">₹{totalGST.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Visual Chart - Simple Bar Chart */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Trend</h3>
                <div className="flex items-end justify-between h-48 gap-2">
                  {data.map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center group">
                      <div 
                        className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all duration-300 hover:from-primary-600 hover:to-primary-500 relative cursor-pointer"
                        style={{ height: `${(item.total / maxTotal) * 100}%`, minHeight: '4px' }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          ₹{item.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">{item.monthName.substring(0, 3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Invoices</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Subtotal</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">CGST</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">SGST</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">IGST</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((item) => (
                      <tr key={item.month} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{item.monthName}</td>
                        <td className="px-6 py-4 text-gray-600">{item.invoiceCount}</td>
                        <td className="px-6 py-4 text-gray-600">₹{item.subtotal.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-gray-600 text-center">₹{item.cgst.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-gray-600 text-center">₹{item.sgst.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-gray-600 text-center">₹{item.igst.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-bold text-gray-900 text-right">₹{item.total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-gray-900">Total</td>
                      <td className="px-6 py-4 text-gray-900">{data.reduce((s, i) => s + i.invoiceCount, 0)}</td>
                      <td className="px-6 py-4 text-gray-900">₹{data.reduce((s, i) => s + i.subtotal, 0).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gray-900 text-center">₹{data.reduce((s, i) => s + i.cgst, 0).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gray-900 text-center">₹{data.reduce((s, i) => s + i.sgst, 0).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-gray-900 text-center">₹{data.reduce((s, i) => s + i.igst, 0).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-primary-600 text-right text-lg">₹{totalRevenue.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
