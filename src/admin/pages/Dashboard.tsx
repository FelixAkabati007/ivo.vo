/**
 * Admin Dashboard Page
 * Main overview page with statistics and recent activity
 */

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users, Package, Settings } from 'lucide-react';

export function AdminDashboard() {
  // Mock data - replace with real API calls
  const stats = [
    {
      name: 'Total Revenue',
      value: 'GH₵ 45,231.89',
      change: '+20.1%',
      trend: 'up',
      icon: DollarSign,
      color: 'bg-green-50 text-green-600',
    },
    {
      name: 'Orders',
      value: '2,350',
      change: '+15.3%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      name: 'Customers',
      value: '12,234',
      change: '+10.5%',
      trend: 'up',
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      name: 'Products',
      value: '573',
      change: '+5.2%',
      trend: 'up',
      icon: Package,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', amount: 'GH₵ 299.99', status: 'Completed', date: '2024-01-15' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: 'GH₵ 149.99', status: 'Processing', date: '2024-01-15' },
    { id: 'ORD-003', customer: 'Mike Johnson', amount: 'GH₵ 599.99', status: 'Pending', date: '2024-01-14' },
    { id: 'ORD-004', customer: 'Sarah Williams', amount: 'GH₵ 89.99', status: 'Completed', date: '2024-01-14' },
    { id: 'ORD-005', customer: 'David Brown', amount: 'GH₵ 449.99', status: 'Completed', date: '2024-01-13' },
  ];

  const lowStockProducts = [
    { name: 'iPhone 15 Pro', stock: 5, category: 'Smartphones' },
    { name: 'MacBook Air M2', stock: 3, category: 'Laptops' },
    { name: 'AirPods Pro', stock: 8, category: 'Audio' },
    { name: 'Apple Watch Series 9', stock: 2, category: 'Wearables' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <a href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{order.id}</p>
                  <p className="text-xs text-gray-500">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{order.amount}</p>
                  <span className={`
                    inline-block px-2 py-1 text-xs font-medium rounded-full
                    ${order.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 
                      'bg-yellow-100 text-yellow-700'}
                  `}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            <a href="/admin/products" className="text-sm text-gray-600 hover:text-gray-900">
              View all
            </a>
          </div>
          <div className="space-y-4">
            {lowStockProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <span className={`
                    inline-block px-3 py-1 text-sm font-medium rounded-full
                    ${product.stock <= 3 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                  `}>
                    {product.stock} left
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a
            href="/admin/products/new"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Package size={24} className="text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900">Add Product</span>
          </a>
          <a
            href="/admin/orders"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart size={24} className="text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900">View Orders</span>
          </a>
          <a
            href="/admin/customers"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Users size={24} className="text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900">Customers</span>
          </a>
          <a
            href="/admin/settings"
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Settings size={24} className="text-gray-400 mb-2" />
            <span className="text-sm font-medium text-gray-900">Settings</span>
          </a>
        </div>
      </div>
    </div>
  );
}
