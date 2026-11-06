'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ProductSearchableSelect from '@/components/ui/ProductSearchableSelect';
import CustomerSearchableSelect from '@/components/ui/CustomerSearchableSelect';
import AlertDialog from '@/components/ui/AlertDialog';
import { quotationAPI, customerAPI, productAPI, companyAPI } from '@/lib/api';

export default function CreateQuotationPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState(null);

  const [formData, setFormData] = useState({
    companyId: '',
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    isGst: true,
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
        customerAPI.getAll({ limit: 1000 }),
        productAPI.getAll({ limit: 1000 }),
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
      setAlertMessage('Please add at least one item');
      return;
    }

    try {
      await quotationAPI.create(formData);
      router.push('/quotations');
    } catch (error) {
      console.error('Failed to create quotation:', error);
      setAlertMessage('Failed to create quotation');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 pt-14 md:pt-16 md:ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const calculateItemTotal = (item) => {
    const amount = item.rate * item.quantity;
    if (!formData.isGst) return amount;
    const gstAmount = (amount * item.gstRate) / 100;
    return amount - gstAmount;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 pt-14 md:pt-16 md:ml-64 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Quotation</h1>
            <p className="text-gray-600">Generate a new quotation</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quotation Details</h2>

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

                <CustomerSearchableSelect
                  customers={customers}
                  value={formData.customerId}
                  onSelect={(id) => setFormData({ ...formData, customerId: id })}
                  required
                />

                <Input
                  label="Quotation Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Items</h2>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-gray-700">Calculation Type:</label>
                  <select
                    value={formData.isGst ? 'gst' : 'non-gst'}
                    onChange={(e) => setFormData({ ...formData, isGst: e.target.value === 'gst' })}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="gst">GST</option>
                    <option value="non-gst">Non-GST</option>
                  </select>
                </div>
              </div>

              <div className={`grid ${formData.isGst ? 'grid-cols-6' : 'grid-cols-5'} gap-4 mb-4`}>
                <div className="col-span-2">
                  <ProductSearchableSelect
                    products={products}
                    value={newItem.productId}
                    onSelect={handleProductSelect}
                  />
                </div>

                {formData.isGst && (
                  <Input
                    label="HSN Code"
                    value={newItem.hsnCode}
                    onChange={(e) => setNewItem({ ...newItem, hsnCode: e.target.value })}
                  />
                )}

                <Input
                  label="Quantity"
                  type="number"
                  step="0.01"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                />

                <Input
                  label={formData.isGst ? 'Rate (₹)' : 'Unit Price (₹)'}
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
                      {formData.isGst ? (
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">HSN</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">GST</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Item</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Unit Price</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                        </tr>
                      )}
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm">{item.description}</td>
                          {formData.isGst && (
                            <td className="px-4 py-3 text-sm">{item.hsnCode}</td>
                          )}
                          <td className="px-4 py-3 text-sm">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-sm">
                            ₹{formData.isGst ? calculateItemTotal(item).toFixed(2) : item.rate.toFixed(2)}
                          </td>
                          {formData.isGst && (
                            <td className="px-4 py-3 text-sm">{item.gstRate}%</td>
                          )}
                          <td className="px-4 py-3 text-sm font-semibold">
                            ₹{formData.isGst ? item.rate.toFixed(2) : calculateItemTotal(item).toFixed(2)}
                          </td>
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
                      <p className="text-xs text-gray-600 mt-1">
                        {formData.isGst
                          ? 'Final amount will include GST calculation and round-off'
                          : 'Non-GST calculation (Quantity × Unit Price)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="secondary" type="button" onClick={() => router.push('/quotations')}>
                Cancel
              </Button>
              <Button type="submit" variant="success">
                Generate Quotation
              </Button>
            </div>
          </form>
        </div>
      </div>

      <AlertDialog
        isOpen={!!alertMessage}
        message={alertMessage}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
}
