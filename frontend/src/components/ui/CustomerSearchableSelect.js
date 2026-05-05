'use client';

import { useState, useRef, useEffect } from 'react';

export default function CustomerSearchableSelect({ customers = [], onSelect, value, required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const selectedCustomer = customers.find(c => c.id === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCustomers = searchTerm.trim() === '' 
    ? customers // Show all if no search term
    : customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone && c.phone.includes(searchTerm))
      );

  const handleSelect = (customer) => {
    onSelect(customer.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  // If customers are 10 or less, show a standard select
  if (customers.length <= 10) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Customer {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          required={required}
        >
          <option value="">Select Customer</option>
          {customers.map(customer => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="relative mb-4" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Customer {required && <span className="text-red-500">*</span>}
      </label>
      
      <div 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer focus:ring-2 focus:ring-primary-500 flex justify-between items-center transition-all hover:border-primary-400 shadow-sm"
      >
        <span className={selectedCustomer ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
        </span>
        <svg 
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 bg-gray-50 border-b border-gray-100">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email or phone..."
                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className="px-4 py-3 hover:bg-primary-50 cursor-pointer transition-colors border-b last:border-0 border-gray-50 group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                      {customer.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {customer.city} {customer.phone && `• ${customer.phone}`}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm italic">
                No customers found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
