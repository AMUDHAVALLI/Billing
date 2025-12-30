'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import { invoiceAPI } from '@/lib/api';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetchInvoices(pagination.page, search);
  }, [pagination.page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchInvoices = async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const response = await invoiceAPI.getAll({ 
        page, 
        limit: pagination.limit,
        search: searchQuery 
      });
      setInvoices(response.data.invoices || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const response = await invoiceAPI.downloadPDF(invoice.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handleDelete = async (invoice) => {
    if (confirm(`Delete invoice ${invoice.invoiceNumber}?`)) {
      try {
        await invoiceAPI.delete(invoice.id);
        fetchInvoices();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };

  const columns = [
    { header: 'Invoice No', key: 'invoiceNumber' },
    { 
      header: 'Date',
      accessor: (row) => new Date(row.date).toLocaleDateString('en-IN')
    },
    { 
      header: 'Customer',
      accessor: (row) => row.customer?.name || 'N/A'
    },
    { 
      header: 'Amount',
      accessor: (row) => `₹${row.total.toLocaleString('en-IN')}`
    },
    { 
      header: 'Status',
      accessor: (row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          row.status === 'paid' ? 'bg-green-100 text-green-800' :
          row.status === 'sent' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.status.toUpperCase()}
        </span>
      )
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Invoices</h1>
              <p className="text-gray-600">View and manage all invoices</p>
            </div>
            <Link href="/invoices/create">
              <Button>+ Create Invoice</Button>
            </Link>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search invoices by number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
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
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        {columns.map((column, colIndex) => (
                          <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {column.accessor ? column.accessor(invoice) : invoice[column.key]}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                          <Link
                            href={`/invoices/edit/${invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-900 font-semibold"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            className="text-primary-600 hover:text-primary-900 font-semibold"
                          >
                            📥 PDF
                          </button>
                          <button
                            onClick={() => handleDelete(invoice)}
                            className="text-red-600 hover:text-red-900 font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invoices.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No invoices yet. Create your first invoice!
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
