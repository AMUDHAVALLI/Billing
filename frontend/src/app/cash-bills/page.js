'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import ErrorBanner from '@/components/ui/ErrorBanner';
import { cashBillAPI } from '@/lib/api';

export default function CashBillsPage() {
  const [cashBills, setCashBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetchCashBills(pagination.page, debouncedSearch, pagination.limit);
  }, [pagination.page, debouncedSearch, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCashBills = async (page = 1, searchQuery = '', limit = pagination.limit) => {
    setLoading(true);
    try {
      const response = await cashBillAPI.getAll({
        page,
        limit,
        search: searchQuery
      });
      setCashBills(response.data.cashBills || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      setError(null);
    } catch (error) {
      console.error('Failed to fetch cash bills:', error);
      // A 401 already redirects to /login via the API interceptor — this
      // covers everything else (network errors, a down backend, a 500),
      // which used to fail the same way as "no bills yet": silently.
      setError(
        error.response
          ? `Couldn't load cash bills (${error.response.status}). Please try again.`
          : "Couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (bill) => {
    try {
      const response = await cashBillAPI.downloadPDF(bill.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to generate PDF for Cash Bill');
    }
  };

  const handleDelete = async (bill) => {
    if (confirm(`Are you sure you want to delete Cash Bill ${bill.billNumber}?`)) {
      try {
        await cashBillAPI.delete(bill.id);
        fetchCashBills(pagination.page, debouncedSearch, pagination.limit);
      } catch (error) {
        console.error('Failed to delete cash bill:', error);
        alert('Failed to delete cash bill');
      }
    }
  };

  const columns = [
    { header: 'Sl. No.', key: 'billNumber' },
    {
      header: 'Date',
      accessor: (row) => new Date(row.date).toLocaleDateString('en-IN')
    },
    {
      header: 'Client Name',
      accessor: (row) => <span className="font-semibold text-gray-800">{row.clientName}</span>
    },
    {
      header: 'Items',
      accessor: (row) => `${row.items?.length || 0} item(s)`
    },
    {
      header: 'Total Amount',
      accessor: (row) => <span className="font-bold text-emerald-700 text-base">₹{row.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
          row.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
          'bg-amber-100 text-amber-800 border border-amber-200'
        }`}>
          {(row.status || 'PAID').toUpperCase()}
        </span>
      )
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 pt-14 md:pt-16 md:ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Cash / Service Bills</h1>
              <p className="text-gray-600">Create, view, print and manage your Cash / Service receipts</p>
            </div>
            <Link href="/cash-bills/create">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg">
                + Create Cash / Service Bill
              </Button>
            </Link>
          </div>

          <ErrorBanner
            message={error}
            onRetry={() => fetchCashBills(pagination.page, debouncedSearch, pagination.limit)}
          />

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative max-w-md flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search cash bills by Sl. No. or Client Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value);
                    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                  }}
                  className="border border-gray-300 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white shadow-sm"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600"></div>
            </div>
          ) : (
            <>
              <div className="w-full max-w-full overflow-x-auto bg-white rounded-2xl shadow-xl border border-gray-100">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-emerald-600 to-teal-700">
                    <tr>
                      {columns.map((column, index) => (
                        <th
                          key={index}
                          className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider"
                        >
                          {column.header}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cashBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-emerald-50/40 transition-colors">
                        {columns.map((column, colIndex) => (
                          <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {column.accessor ? column.accessor(bill) : bill[column.key]}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/cash-bills/${bill.id}`}
                              className="inline-flex items-center px-2.5 py-1.5 text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors text-xs font-bold"
                              title="View Details"
                            >
                              👁️ View
                            </Link>
                            <Link
                              href={`/cash-bills/edit/${bill.id}`}
                              className="inline-flex items-center px-2.5 py-1.5 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-bold"
                              title="Edit Bill"
                            >
                              ✏️ Edit
                            </Link>
                            <button
                              onClick={() => handleDownloadPDF(bill)}
                              className="inline-flex items-center px-2.5 py-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-xs font-bold"
                              title="Download PDF"
                            >
                              📥 PDF
                            </button>
                            <button
                              onClick={() => handleDelete(bill)}
                              className="inline-flex items-center px-2.5 py-1.5 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-xs font-bold"
                              title="Delete Bill"
                            >
                              🗑️ Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cashBills.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-lg font-medium text-gray-700 mb-1">No Cash / Service Bills found</p>
                    <p className="text-sm text-gray-400">Click "+ Create Cash / Service Bill" to generate your first receipt.</p>
                  </div>
                )}
              </div>
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
