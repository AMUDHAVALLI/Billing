'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { invoiceAPI } from '@/lib/api';

export default function YearlyReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.getYearlyReport();
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch yearly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
  const totalGST = data.reduce((sum, item) => sum + item.cgst + item.sgst + item.igst, 0);
  const maxTotal = data.length > 0 ? Math.max(...data.map(item => item.total), 1) : 1;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Yearly Report</h1>
            <p className="text-gray-600">Yearly breakdown of revenue and GST collected</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Lifetime Revenue</h3>
              <p className="text-3xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
              <h3 className="text-gray-600 text-sm font-semibold mb-1">Lifetime GST Collected</h3>
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
              {data.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Yearly Revenue Comparison</h3>
                  <div className="flex items-end justify-start h-48 gap-8">
                    {data.slice().reverse().map((item) => (
                      <div key={item.year} className="flex-none w-20 flex flex-col items-center group">
                        <div 
                          className="w-full bg-gradient-to-t from-accent-500 to-accent-400 rounded-t-lg transition-all duration-300 hover:from-accent-600 hover:to-accent-500 relative cursor-pointer"
                          style={{ height: `${(item.total / maxTotal) * 100}%`, minHeight: '4px' }}
                        >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            ₹{item.total.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 mt-2">{item.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Year</th>
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
                      <tr key={item.year} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{item.year}</td>
                        <td className="px-6 py-4 text-gray-600">{item.invoiceCount}</td>
                        <td className="px-6 py-4 text-gray-600">₹{item.subtotal.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-gray-600 text-center">₹{item.cgst.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-gray-600 text-center">₹{item.sgst.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-gray-600 text-center">₹{item.igst.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 font-bold text-gray-900 text-right text-lg">₹{item.total.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
