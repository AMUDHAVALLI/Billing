'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { invoiceAPI } from '@/lib/api';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await invoiceAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
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
                    <div>
                      <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">{invoice.customer.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{invoice.total.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No invoices yet</p>
            )}
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
