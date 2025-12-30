'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { companyAPI } from '@/lib/api';

export default function CompanyPage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan: '',
    contact: '',
    email: '',
    phone: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: ''
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const response = await companyAPI.getAll();
      if (response.data && response.data.length > 0) {
        const companyData = response.data[0];
        setCompany(companyData);
        setFormData(companyData);
        setEditing(false);
      } else {
        setEditing(true);
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
      setEditing(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (company) {
        await companyAPI.update(company.id, formData);
      } else {
        await companyAPI.create(formData);
      }
      fetchCompany();
    } catch (error) {
      console.error('Failed to save company:', error);
      alert('Failed to save company details');
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Company Settings</h1>
              <p className="text-gray-600">Manage your company information</p>
            </div>
            {company && !editing && (
              <Button onClick={() => setEditing(true)}>
                ✏️ Edit Company
              </Button>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            {!editing && company ? (
              <div className="space-y-6">
                <InfoRow label="Company Name" value={company.name} />
                <InfoRow label="Address" value={company.address} />
                <InfoRow label="City" value={company.city} />
                <InfoRow label="State" value={company.state} />
                <InfoRow label="Pincode" value={company.pincode} />
                <InfoRow label="GSTIN" value={company.gstin} />
                <InfoRow label="PAN" value={company.pan} />
                <InfoRow label="Contact Person" value={company.contact} />
                <InfoRow label="Email" value={company.email} />
                <InfoRow label="Phone" value={company.phone} />
                
                {company.bankName && (
                  <>
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Bank Details</h3>
                    </div>
                    <InfoRow label="Bank Name" value={company.bankName} />
                    <InfoRow label="Account Number" value={company.accountNumber} />
                    <InfoRow label="IFSC Code" value={company.ifscCode} />
                    <InfoRow label="Branch" value={company.branch} />
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Company Information</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Company Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="col-span-2"
                    />
                    <Input
                      label="Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="col-span-2"
                    />
                    <Input
                      label="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                    <Input
                      label="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      required
                    />
                    <Input
                      label="Pincode"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      required
                    />
                    <Input
                      label="GSTIN"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      required
                    />
                    <Input
                      label="PAN"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                    />
                    <Input
                      label="Contact Person"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    <Input
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Bank Details (Optional)</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <Input
                      label="Bank Name"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                    <Input
                      label="Account Number"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    />
                    <Input
                      label="IFSC Code"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                    />
                    <Input
                      label="Branch"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    {company && (
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          setEditing(false);
                          setFormData(company);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" variant="success">
                      {company ? 'Update' : 'Create'} Company
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center py-3 border-b border-gray-100">
      <div className="w-1/3">
        <span className="font-semibold text-gray-700">{label}:</span>
      </div>
      <div className="w-2/3">
        <span className="text-gray-900">{value || 'N/A'}</span>
      </div>
    </div>
  );
}
