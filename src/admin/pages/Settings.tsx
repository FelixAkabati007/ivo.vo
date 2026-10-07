/**
 * Admin Settings Page
 * Store configuration and preferences
 */

import { useState } from 'react';
import { Save, Upload } from 'lucide-react';
import { useToast } from '../../components/Toast';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const { addToast } = useToast();

  const [generalSettings, setGeneralSettings] = useState({
    storeName: 'ivo Electronics',
    storeEmail: 'info@ivo.com',
    storePhone: '+233 20 123 4567',
    currency: 'GHS',
    timezone: 'Africa/Accra',
  });

  const [paymentSettings, setPaymentSettings] = useState({
    paystackPublicKey: '',
    paystackSecretKey: '',
    enableMobileMoney: true,
    enableCard: true,
    enableBankTransfer: false,
  });

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 50,
    standardShippingRate: 10,
    expressShippingRate: 25,
    enableExpressShipping: true,
  });

  const handleSave = (section: string) => {
    addToast({
      type: 'success',
      title: 'Settings saved',
      message: `${section} settings have been updated successfully.`,
    });
  };

  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'payment', name: 'Payment' },
    { id: 'shipping', name: 'Shipping' },
    { id: 'notifications', name: 'Notifications' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your store settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={generalSettings.storeName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, storeName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Email
                    </label>
                    <input
                      type="email"
                      value={generalSettings.storeEmail}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, storeEmail: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Phone
                    </label>
                    <input
                      type="tel"
                      value={generalSettings.storePhone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, storePhone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={generalSettings.currency}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                      >
                        <option value="GHS">GHS - Ghana Cedi</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={generalSettings.timezone}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                      >
                        <option value="Africa/Accra">Africa/Accra (GMT)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleSave('General')}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Paystack Integration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Public Key
                    </label>
                    <input
                      type="text"
                      value={paymentSettings.paystackPublicKey}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, paystackPublicKey: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                      placeholder="pk_test_..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secret Key
                    </label>
                    <input
                      type="password"
                      value={paymentSettings.paystackSecretKey}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, paystackSecretKey: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                      placeholder="sk_test_..."
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={paymentSettings.enableCard}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, enableCard: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Credit/Debit Cards</p>
                      <p className="text-xs text-gray-500">Accept Visa, Mastercard, and other cards</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={paymentSettings.enableMobileMoney}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, enableMobileMoney: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Mobile Money</p>
                      <p className="text-xs text-gray-500">Accept MTN, Vodafone, AirtelTigo</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={paymentSettings.enableBankTransfer}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, enableBankTransfer: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Bank Transfer</p>
                      <p className="text-xs text-gray-500">Accept direct bank transfers</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleSave('Payment')}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Shipping Settings */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Rates</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Free Shipping Threshold (GH₵)
                    </label>
                    <input
                      type="number"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, freeShippingThreshold: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                    />
                    <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Standard Shipping Rate (GH₵)
                      </label>
                      <input
                        type="number"
                        value={shippingSettings.standardShippingRate}
                        onChange={(e) => setShippingSettings({ ...shippingSettings, standardShippingRate: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Express Shipping Rate (GH₵)
                      </label>
                      <input
                        type="number"
                        value={shippingSettings.expressShippingRate}
                        onChange={(e) => setShippingSettings({ ...shippingSettings, expressShippingRate: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={shippingSettings.enableExpressShipping}
                      onChange={(e) => setShippingSettings({ ...shippingSettings, enableExpressShipping: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Enable Express Shipping</p>
                      <p className="text-xs text-gray-500">Offer faster delivery option to customers</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleSave('Shipping')}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New Order Notifications</p>
                      <p className="text-xs text-gray-500">Receive email when a new order is placed</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Low Stock Alerts</p>
                      <p className="text-xs text-gray-500">Get notified when products are running low</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Customer Registration</p>
                      <p className="text-xs text-gray-500">Notify when new customers sign up</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleSave('Notification')}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
