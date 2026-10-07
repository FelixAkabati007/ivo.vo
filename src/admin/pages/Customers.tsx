/**
 * Admin Customers Page
 * Customer management and analytics
 */

import { useState } from 'react';
import { Search, Mail, Phone, Eye, MoreVertical, UserPlus, Users } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  joinDate: string;
  status: 'active' | 'inactive';
}

export function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Mock data - replace with real API calls
  const customers: Customer[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+233 20 123 4567',
      orders: 12,
      totalSpent: 2499.99,
      joinDate: '2023-06-15',
      status: 'active',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+233 24 987 6543',
      orders: 8,
      totalSpent: 1899.99,
      joinDate: '2023-08-22',
      status: 'active',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '+233 27 456 7890',
      orders: 3,
      totalSpent: 599.99,
      joinDate: '2023-11-10',
      status: 'active',
    },
    {
      id: '4',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      phone: '+233 20 111 2222',
      orders: 0,
      totalSpent: 0,
      joinDate: '2024-01-05',
      status: 'inactive',
    },
    {
      id: '5',
      name: 'David Brown',
      email: 'david@example.com',
      phone: '+233 24 333 4444',
      orders: 15,
      totalSpent: 3299.99,
      joinDate: '2023-03-18',
      status: 'active',
    },
  ];

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your customer base</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
          <UserPlus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {customers.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            GH₵ {customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
            />
          </div>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Customers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500">ID: {customer.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Mail size={14} className="text-gray-400" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Phone size={14} className="text-gray-400" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{customer.orders}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      GH₵ {customer.totalSpent.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {new Date(customer.joinDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      inline-block px-2 py-1 text-xs font-medium rounded-full
                      ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    `}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="View"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="More"
                      >
                        <MoreVertical size={16} className="text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
