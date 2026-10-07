/**
 * Admin Orders Page
 * Order management with filtering and status updates
 */

import { useState } from 'react';
import { Search, Filter, Eye, MoreVertical, Download, ShoppingCart } from 'lucide-react';

interface Order {
  id: string;
  customer: string;
  email: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  items: number;
}

export function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Mock data - replace with real API calls
  const orders: Order[] = [
    {
      id: 'ORD-2024-001',
      customer: 'John Doe',
      email: 'john@example.com',
      total: 299.99,
      status: 'delivered',
      date: '2024-01-15',
      items: 3,
    },
    {
      id: 'ORD-2024-002',
      customer: 'Jane Smith',
      email: 'jane@example.com',
      total: 149.99,
      status: 'processing',
      date: '2024-01-15',
      items: 1,
    },
    {
      id: 'ORD-2024-003',
      customer: 'Mike Johnson',
      email: 'mike@example.com',
      total: 599.99,
      status: 'pending',
      date: '2024-01-14',
      items: 2,
    },
    {
      id: 'ORD-2024-004',
      customer: 'Sarah Williams',
      email: 'sarah@example.com',
      total: 89.99,
      status: 'shipped',
      date: '2024-01-14',
      items: 1,
    },
    {
      id: 'ORD-2024-005',
      customer: 'David Brown',
      email: 'david@example.com',
      total: 449.99,
      status: 'delivered',
      date: '2024-01-13',
      items: 4,
    },
    {
      id: 'ORD-2024-006',
      customer: 'Emily Davis',
      email: 'emily@example.com',
      total: 199.99,
      status: 'cancelled',
      date: '2024-01-13',
      items: 2,
    },
  ];

  const statuses = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track customer orders</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={20} />
          <span>Export</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {statuses.filter(s => s !== 'all').map(status => {
          const count = orders.filter(o => o.status === status).length;
          return (
            <div key={status} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500 capitalize">{status}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
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
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrders(filteredOrders.map(o => o.id));
                      } else {
                        setSelectedOrders([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders([...selectedOrders, order.id]);
                        } else {
                          setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer}</p>
                      <p className="text-xs text-gray-500">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{order.items}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      GH₵ {order.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
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
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}
