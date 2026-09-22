'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cashBillAPI, customerAPI, productAPI } from '@/lib/api';

export default function CreateCashBillPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  const [formData, setFormData] = useState({
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    items: []
  });

  const [newItem, setNewItem] = useState({
    particulars: '',
    quantity: 1,
    rate: 0
  });

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  const fetchAuxiliaryData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerAPI.getAll({ limit: 500 }),
        productAPI.getAll({ limit: 500 })
      ]);
      setCustomers(custRes.data.customers || custRes.data || []);
      setProducts(prodRes.data.products || prodRes.data || []);
    } catch (err) {
      console.error('Failed to load auxiliary data:', err);
    }
  };

  const handleProductSelect = (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const prod = products.find(p => p.id === selectedId);
    if (prod) {
      setNewItem(prev => ({
        ...prev,
        particulars: prod.name,
        rate: prod.basePrice || 0
      }));
    }
  };

  const addItem = () => {
    if (!newItem.particulars || newItem.particulars.trim() === '') {
      alert('Please enter Particulars for the item');
      return;
    }
    if (newItem.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    const amount = (parseFloat(newItem.quantity) || 0) * (parseFloat(newItem.rate) || 0);

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          particulars: newItem.particulars.trim(),
          quantity: parseFloat(newItem.quantity) || 1,
          rate: parseFloat(newItem.rate) || 0,
          amount: parseFloat(amount.toFixed(2))
        }
      ]
    }));

    setNewItem({
      particulars: '',
      quantity: 1,
      rate: 0
    });
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientName || formData.clientName.trim() === '') {
      alert('Please enter Client Name');
      return;
    }

    if (formData.items.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    setLoading(true);
    try {
      const response = await cashBillAPI.create(formData);
      router.push('/cash-bills');
    } catch (error) {
      console.error('Failed to create Cash Bill:', error);
      alert(error.response?.data?.error || 'Failed to create Cash Bill');
    } finally {
      setLoading(false);
    }
  };

  // Filter customers for suggestions dropdown
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 pt-14 md:pt-0 md:ml-64 overflow-auto">
        <div className="p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                CASH / SERVICE BILL
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Create Cash / Service Bill</h1>
              <p className="text-gray-600">Generate and persist a non-GST cash receipt pad bill</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Header / Client Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span>📋</span> Bill & Client Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Input
                    label="Sl. No. / Bill No."
                    placeholder="Auto-generated if empty (e.g. 112)"
                    value={formData.billNumber}
                    onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  />
                  <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate sequential bill number</p>
                </div>

                <div>
                  <Input
                    label="Date *"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter or select Client Name (e.g. M/s Western...)"
                    value={formData.clientName}
                    onChange={(e) => {
                      setFormData({ ...formData, clientName: e.target.value });
                      setClientSearch(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />

                  {showClientDropdown && filteredCustomers.length > 0 && clientSearch && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                      {filteredCustomers.map(cust => (
                        <div
                          key={cust.id}
                          className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm font-medium text-gray-700"
                          onClick={() => {
                            setFormData({ ...formData, clientName: cust.name });
                            setShowClientDropdown(false);
                          }}
                        >
                          {cust.name} {cust.city ? `(${cust.city})` : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
                <span>📦</span> Particulars / Line Items
              </h2>

              {/* Add item row */}
              <div className="grid grid-cols-12 gap-3 mb-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div className="col-span-12 md:col-span-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Select from Catalogue (Optional)</label>
                  <select
                    onChange={handleProductSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.basePrice})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 md:col-span-4">
                  <Input
                    label="Particulars / Description *"
                    placeholder="e.g. Quick Heal Total Security"
                    value={newItem.particulars}
                    onChange={(e) => setNewItem({ ...newItem, particulars: e.target.value })}
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Input
                    label="Qty *"
                    type="number"
                    step="0.01"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="col-span-6 md:col-span-2">
                  <Input
                    label="Rate (₹) *"
                    type="number"
                    step="0.01"
                    value={newItem.rate}
                    onChange={(e) => setNewItem({ ...newItem, rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="col-span-12 md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={addItem}
                    className="w-full py-2.5 px-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow text-sm"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Items Table */}
              {formData.items.length > 0 ? (
                <div className="w-full max-w-full overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[650px] divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Particulars</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Qty.</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Rate (₹)</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Amount (₹)</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{item.particulars}</td>
                          <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">₹ {item.rate.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-emerald-700">
                            ₹ {(item.quantity * item.rate).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  No line items added yet. Fill in the particulars above and click "+ Add".
                </div>
              )}

              {/* Total Calculation Display */}
              {formData.items.length > 0 && (
                <div className="mt-6 flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200 gap-4">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-800 block mb-1">Receipt Receipt pad Total</span>
                    <p className="text-sm font-medium text-gray-600">
                      All line items summed cleanly (Non-GST format)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-extrabold text-emerald-800">
                      Total: ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.push('/cash-bills')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xl"
              >
                {loading ? 'Creating Cash Bill...' : '💾 Save Cash Bill'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
