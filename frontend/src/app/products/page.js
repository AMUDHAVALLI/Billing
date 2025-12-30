'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import { productAPI } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hsnCode: '',
    unit: 'NOS',
    basePrice: '',
    gstRate: '18'
  });

  useEffect(() => {
    fetchProducts(pagination.page, search);
  }, [pagination.page, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = async (page = 1, searchQuery = '') => {
    setLoading(true);
    try {
      const response = await productAPI.getAll({ 
        page, 
        limit: pagination.limit,
        search: searchQuery 
      });
      setProducts(response.data.products || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        gstRate: parseFloat(formData.gstRate)
      };
      
      if (editingProduct) {
        await productAPI.update(editingProduct.id, data);
      } else {
        await productAPI.create(data);
      }
      setIsModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      ...product,
      basePrice: product.basePrice.toString(),
      gstRate: product.gstRate.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (confirm(`Delete product ${product.name}?`)) {
      try {
        await productAPI.delete(product.id);
        fetchProducts();
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      hsnCode: '',
      unit: 'NOS',
      basePrice: '',
      gstRate: '18'
    });
    setEditingProduct(null);
  };

  const columns = [
    { header: 'Name', key: 'name' },
    { header: 'HSN Code', key: 'hsnCode' },
    { header: 'Unit', key: 'unit' },
    { 
      header: 'Base Price',
      accessor: (row) => `₹${row.basePrice.toLocaleString('en-IN')}`
    },
    { 
      header: 'GST Rate',
      accessor: (row) => `${row.gstRate}%`
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Products</h1>
              <p className="text-gray-600">Manage your products and services</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              + Add Product
            </Button>
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
                placeholder="Search products by name or HSN code..."
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
              <Table
                columns={columns}
                data={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              />
            </>
          )}

          <Modal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              resetForm();
            }}
            title={editingProduct ? 'Edit Product' : 'Add Product'}
          >
            <form onSubmit={handleSubmit}>
              <Input
                label="Product/Service Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="HSN/SAC Code"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  required
                />
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="NOS">NOS</option>
                    <option value="KG">KG</option>
                    <option value="METER">METER</option>
                    <option value="BOX">BOX</option>
                    <option value="PACKET">PACKET</option>
                  </select>
                </div>
                <Input
                  label="Base Price (₹)"
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  required
                />
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    GST Rate <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? 'Update' : 'Create'} Product
                </Button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}
