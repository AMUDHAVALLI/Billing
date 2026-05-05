'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { invoiceAPI, companyAPI } from '@/lib/api';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, companyRes] = await Promise.all([
        invoiceAPI.getDashboardStats(),
        companyAPI.getAll()
      ]);
      setStats(statsRes.data);
      if (companyRes.data && companyRes.data.length > 0) {
        setCompany(companyRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const response = await invoiceAPI.downloadPDF(invoice.id);
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome to your billing dashboard</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Revenue"
              value={`₹${stats?.totalRevenue?.toLocaleString('en-IN') || 0}`}
              icon="💰"
              color="from-green-500 to-green-600"
            />
            <StatCard
              title="Total Invoices"
              value={stats?.totalInvoices || 0}
              icon="📄"
              color="from-blue-500 to-blue-600"
            />
            <StatCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              icon="👥"
              color="from-purple-500 to-purple-600"
            />
            <StatCard
              title="Total Products"
              value={stats?.totalProducts || 0}
              icon="📦"
              color="from-orange-500 to-orange-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Company Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Company Details</h2>
                <Link
                  href="/company"
                  className="text-primary-600 hover:text-primary-800 font-semibold"
                >
                  Edit Settings
                </Link>
              </div>
              
              {company ? (
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-600">Company Name:</span>
                    <span className="font-bold text-gray-900">{company.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-600">GSTIN:</span>
                    <span className="text-gray-900">{company.gstin}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-600">State:</span>
                    <span className="text-gray-900">{company.state} (Code: {company.stateCode})</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900">{company.email}</span>
                  </div>
                  <div className="mt-4 pt-2 text-sm text-gray-500 italic">
                    {company.address}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No company details set up yet</p>
                  <Link href="/company">
                    <Button variant="primary">Set Up Company</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Invoices */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Invoices</h2>
                <Link
                  href="/invoices"
                  className="text-primary-600 hover:text-primary-800 font-semibold"
                >
                  View All →
                </Link>
              </div>
              
              {stats?.recentInvoices?.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-primary-400 transition-all card-hover"
                    >
                      <Link href={`/invoices/${invoice.id}`} className="flex-1 cursor-pointer">
                        <div>
                          <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                          <p className="text-sm text-gray-600">{invoice.customer.name}</p>
                        </div>
                      </Link>
                      <div className="flex items-center space-x-4">
                        <div className="text-right mr-4 border-r pr-4 border-gray-100">
                          <p className="font-bold text-gray-900">₹{invoice.total.toLocaleString('en-IN')}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(invoice.date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            href={`/invoices/edit/${invoice.id}`}
                            className="inline-flex items-center justify-center px-3 py-1 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md hover:bg-indigo-100 transition-colors text-xs font-bold"
                            title="Edit Invoice"
                          >
                            ✏️ Edit
                          </Link>
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            className="inline-flex items-center justify-center px-3 py-1 text-primary-600 bg-primary-50 border border-primary-100 rounded-md hover:bg-primary-100 transition-colors text-xs font-bold"
                            title="Download PDF"
                          >
                            📥 PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No invoices yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <QuickAction
              title="Create Invoice"
              description="Generate a new GST invoice"
              icon="➕"
              href="/invoices/create"
              color="from-primary-500 to-primary-600"
            />
            <QuickAction
              title="Add Customer"
              description="Register a new customer"
              icon="👤"
              href="/customers"
              color="from-purple-500 to-purple-600"
            />
            <QuickAction
              title="Add Product"
              description="Add products/services"
              icon="📦"
              href="/products"
              color="from-orange-500 to-orange-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-3xl shadow-lg`}>
          {icon}
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-semibold mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function QuickAction({ title, description, icon, href, color }) {
  return (
    <Link href={href}>
      <div className={`bg-gradient-to-br ${color} rounded-2xl shadow-xl p-6 text-white card-hover cursor-pointer`}>
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-white opacity-90">{description}</p>
      </div>
    </Link>
  );
}
