/**
 * User Account Pages
 * Profile, Orders, Addresses, Wishlist pages
 */

import { useState } from 'react';
import { User, Package, MapPin, Heart, LogOut, Settings } from 'lucide-react';
import { useAuth } from './Auth';
import { useWishlist } from './Wishlist';
import { formatCurrency } from '../config/currency';

type AccountTab = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'settings';

export function AccountPage() {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile');
  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'orders' as const, label: 'Orders', icon: Package },
    { id: 'addresses' as const, label: 'Addresses', icon: MapPin },
    { id: 'wishlist' as const, label: 'Wishlist', icon: Heart, badge: wishlist.length },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon size={18} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </nav>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition mt-4"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'addresses' && <AddressesTab />}
          {activeTab === 'wishlist' && <WishlistTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
      
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              defaultValue={user?.firstName}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              defaultValue={user?.lastName}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            defaultValue={user?.email}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            placeholder="+233 XX XXX XXXX"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
        </div>

        <button className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">
          Save Changes
        </button>
      </div>
    </div>
  );
}

function OrdersTab() {
  // Mock orders
  const orders = [
    {
      id: 'IVO-M1ABC123-X7Y9',
      date: '2024-01-15',
      status: 'Delivered',
      total: 299.99,
      items: 3,
    },
    {
      id: 'IVO-M1DEF456-Z8A0',
      date: '2024-01-10',
      status: 'Processing',
      total: 149.99,
      items: 1,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Order History</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.id}</p>
                  <p className="text-xs text-gray-400 mt-1">Placed on {new Date(order.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {order.status}
                  </span>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">{order.items} item{order.items > 1 ? 's' : ''}</p>
                <button className="text-sm font-medium text-gray-900 hover:underline">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressesTab() {
  const addresses = [
    {
      id: '1',
      label: 'Home',
      name: 'John Doe',
      street: '123 Main Street',
      city: 'Accra',
      state: 'Greater Accra',
      postalCode: 'GA100',
      country: 'Ghana',
      phone: '+233 20 123 4567',
      isDefault: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
        <button className="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
          Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No saved addresses</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map(address => (
            <div key={address.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">{address.label}</p>
                  {address.isDefault && (
                    <span className="text-xs text-green-600 font-medium">Default</span>
                  )}
                </div>
                <button className="text-sm text-gray-500 hover:text-gray-900">Edit</button>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{address.name}</p>
                <p>{address.street}</p>
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p>{address.country}</p>
                <p>{address.phone}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistTab() {
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Wishlist</h2>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 mt-2">Start adding products you love!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlist.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <img src={product.image} alt={product.imageAlt || product.name} className="w-full aspect-square object-cover rounded-xl mb-3" />
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{product.name}</h3>
              <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(product.price)}</p>
              <button
                onClick={() => removeFromWishlist(product.id)}
                className="w-full mt-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">Email notifications for orders</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">Promotional emails</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700">SMS notifications</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Security</h3>
          <button className="btn-secondary px-4 py-2 rounded-xl text-sm font-medium">
            Change Password
          </button>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Privacy</h3>
          <button className="text-sm text-red-600 hover:underline font-medium">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
