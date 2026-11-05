'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import ErrorBanner from '@/components/ui/ErrorBanner';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import TableSkeleton from '@/components/ui/TableSkeleton';
import { getCached, setCached } from '@/lib/listCache';
import { quotationAPI } from '@/lib/api';

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetchQuotations(pagination.page, debouncedSearch, pagination.limit);
  }, [pagination.page, debouncedSearch, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchQuotations = async (page = 1, searchQuery = '', limit = pagination.limit) => {
    const cacheKey = `quotations:${page}:${limit}:${searchQuery}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setQuotations(cached.quotations);
      setPagination(cached.pagination);
      setError(null);
    } else {
      setLoading(true);
    }
    try {
      const response = await quotationAPI.getAll({
        page,
        limit,
        search: searchQuery
      });
      const quotationsData = response.data.quotations || response.data;
      setQuotations(quotationsData);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
      setCached(cacheKey, {
        quotations: quotationsData,
        pagination: response.data.pagination || pagination,
      });
      setError(null);
    } catch (error) {
      console.error('Failed to fetch quotations:', error);
      setError(
        error.response
          ? `Couldn't load quotations (${error.response.status}). Please try again.`
          : "Couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (quotation) => {
    try {
      const response = await quotationAPI.downloadPDF(quotation.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      setError('Failed to generate PDF for this quotation.');
    }
  };

  const handleDelete = (quotation) => setDeleteTarget(quotation);

  const confirmDelete = async () => {
    const quotation = deleteTarget;
    setDeleteTarget(null);
    try {
      await quotationAPI.delete(quotation.id);
      fetchQuotations(pagination.page, debouncedSearch, pagination.limit);
    } catch (error) {
      console.error('Failed to delete quotation:', error);
      setError(`Failed to delete quotation ${quotation.quotationNumber}.`);
    }
  };

  const columns = [
    { header: 'Quotation No', key: 'quotationNumber' },
    {
      header: 'Date',
      accessor: (row) => new Date(row.date).toLocaleDateString('en-IN')
    },
    {
      header: 'Customer',
      accessor: (row) => row.customer?.name || 'N/A'
    },
    {
      header: 'Subtotal',
      accessor: (row) => `₹${row.subtotal.toLocaleString('en-IN')}`
    },
    {
      header: 'Tax',
      accessor: (row) =>
        row.isGst === false ? (
          <div className="flex flex-col">
            <span className="font-medium text-gray-500">₹0</span>
            <span className="text-[10px] text-gray-500">Non-GST</span>
          </div>
        ) : (
          <div className="flex flex-col">
            <span className="font-medium text-gray-700">₹{(row.cgst + row.sgst + row.igst).toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-gray-500">
              {row.igst > 0 ? 'IGST' : 'CGST+SGST'}
            </span>
          </div>
        )
    },
    {
      header: 'Total',
      accessor: (row) => <span className="font-bold text-primary-700 text-base">₹{row.total.toLocaleString('en-IN')}</span>
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
          row.status === 'approved' || row.status === 'paid' ? 'bg-green-100 text-green-800 border border-green-200' :
          row.status === 'sent' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
          'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {row.status.toUpperCase()}
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Quotations</h1>
              <p className="text-gray-600">View and manage all your quotations and customer estimates</p>
            </div>
            <Link href="/quotations/create">
              <Button>+ Create Quotation</Button>
            </Link>
          </div>

          <ErrorBanner
            message={error}
            onRetry={() => fetchQuotations(pagination.page, debouncedSearch, pagination.limit)}
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
                  placeholder="Search quotations by Quotation No. or Customer Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
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
                  className="border border-gray-300 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
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
            <TableSkeleton columns={columns.length + 1} />
          ) : (
            <>
              <div className="w-full max-w-full overflow-x-auto bg-white rounded-2xl shadow-xl border border-gray-100">
                <table className="w-full min-w-[800px] divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-primary-600 to-primary-700">
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
                    {quotations.map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                        {columns.map((column, colIndex) => (
                          <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {column.accessor ? column.accessor(quotation) : quotation[column.key]}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/quotations/${quotation.id}`}
                              className="inline-flex items-center px-2 py-1.5 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-xs font-bold"
                              title="View Details"
                            >
                              👁️ View
                            </Link>
                            <Link
                              href={`/quotations/edit/${quotation.id}`}
                              className="inline-flex items-center px-2 py-1.5 text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors text-xs font-bold"
                              title="Edit Quotation"
                            >
                              ✏️ Edit
                            </Link>
                            <button
                              onClick={() => handleDownloadPDF(quotation)}
                              className="inline-flex items-center px-2 py-1.5 text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 transition-colors text-xs font-bold"
                              title="Download PDF"
                            >
                              📥 PDF
                            </button>
                            <button
                              onClick={() => handleDelete(quotation)}
                              className="inline-flex items-center px-2 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-xs font-bold"
                              title="Delete Quotation"
                            >
                              🗑️ Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {quotations.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No quotations yet. Create your first quotation!
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Quotation"
        message={`Delete quotation ${deleteTarget?.quotationNumber}? This can't be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

