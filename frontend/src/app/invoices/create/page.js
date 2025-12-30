'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProductSearchableSelect from '@/components/ui/ProductSearchableSelect';
import { invoiceAPI, customerAPI, productAPI, companyAPI } from '@/lib/api';

export default function CreateInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    companyId: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  const [newItem, setNewItem] = useState({
    productId: '',
    description: '',
    hsnCode: '',
    quantity: 1,
    unit: 'NOS',
    rate: 0,
    gstRate: 18
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [customersRes, productsRes, companiesRes] = await Promise.all([
        customerAPI.getAll(),
        productAPI.getAll(),
        companyAPI.getAll()
      ]);
      
      setCustomers(customersRes.data.customers || customersRes.data);
      setProducts(productsRes.data.products || productsRes.data);
      setCompanies(companiesRes.data || []);
      
      if (companiesRes.data && companiesRes.data.length > 0) {
        setFormData(prev => ({ ...prev, companyId: companiesRes.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product) => {
    if (product) {
      setNewItem({
        productId: product.id,
        description: product.name,
        hsnCode: product.hsnCode,
        quantity: 1,
        unit: product.unit,
        rate: product.basePrice,
        gstRate: product.gstRate
      });
    }
  };

  const addItem = () => {
    if (newItem.productId && newItem.quantity > 0) {
      setFormData({
        ...formData,
        items: [...formData.items, { ...newItem }]
      });
      
      setNewItem({
        productId: '',
        description: '',
        hsnCode: '',
        quantity: 1,
        unit: 'NOS',
        rate: 0,
        gstRate: 18
      });
    }
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      await invoiceAPI.create(formData);
      router.push('/invoices');
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Failed to create invoice');
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

  const calculateItemTotal = (item) => {
    const amount = item.rate * item.quantity;
    const gstAmount = (amount * item.gstRate) / 100;
    return amount + gstAmount;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Invoice</h1>
            <p className="text-gray-600">Generate a new GST-compliant invoice</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Invoice Details</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Invoice Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add Items</h2>
              
              <div className="grid grid-cols-6 gap-4 mb-4">
                <div className="col-span-2">
                  <ProductSearchableSelect
                    products={products}
                    value={newItem.productId}
                    onSelect={handleProductSelect}
                  />
                </div>

                <Input
                  label="HSN Code"
                  value={newItem.hsnCode}
                  onChange={(e) => setNewItem({ ...newItem, hsnCode: e.target.value })}
                />

                <Input
                  label="Quantity"
                  type="number"
                  step="0.01"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                />

                <Input
                  label="Rate (₹)"
                  type="number"
                  step="0.01"
                  value={newItem.rate}
                  onChange={(e) => setNewItem({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
                />

                <div className="flex items-end">
                  <Button type="button" onClick={addItem} className="w-full">
                    + Add
                  </Button>
                </div>
              </div>

              {/* Items Table */}
              {formData.items.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">HSN</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">GST</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{item.description}</td>
                          <td className="px-4 py-3 text-sm">{item.hsnCode}</td>
                          <td className="px-4 py-3 text-sm">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-sm">₹{item.rate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">{item.gstRate}%</td>
                          <td className="px-4 py-3 text-sm font-semibold">₹{calculateItemTotal(item).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-900 font-semibold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-6 flex justify-end">
                    <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-6 rounded-xl">
                      <p className="text-2xl font-bold text-gray-900">
                        Estimated Total: <span className="text-primary-700">₹{calculateGrandTotal().toFixed(2)}</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Final amount will include GST calculation and round-off</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="secondary" type="button" onClick={() => router.push('/invoices')}>
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Generate Invoice
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
