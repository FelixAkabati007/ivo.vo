/**
 * Admin Products Page
 * Full product management with CRUD operations
 */

import { useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreVertical, Package, X, Upload } from 'lucide-react';
import { useToast } from '../../components/Toast';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  image: string;
}

export function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const { addToast } = useToast();

  // Mock data - replace with real API calls
  const products: Product[] = [
    {
      id: '1',
      name: 'iPhone 15 Pro',
      category: 'Smartphones',
      price: 999.99,
      stock: 45,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
    },
    {
      id: '2',
      name: 'MacBook Air M2',
      category: 'Laptops',
      price: 1299.99,
      stock: 23,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    },
    {
      id: '3',
      name: 'AirPods Pro',
      category: 'Audio',
      price: 249.99,
      stock: 8,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400',
    },
    {
      id: '4',
      name: 'Apple Watch Series 9',
      category: 'Wearables',
      price: 399.99,
      stock: 2,
      status: 'active',
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400',
    },
    {
      id: '5',
      name: 'Sony WH-1000XM5',
      category: 'Audio',
      price: 349.99,
      stock: 15,
      status: 'draft',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    },
  ];

  const categories = ['all', 'Smartphones', 'Laptops', 'Audio', 'Wearables', 'Cameras', 'Tablets'];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      addToast({
        type: 'success',
        title: 'Product deleted',
        message: 'Product has been successfully deleted.',
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      addToast({
        type: 'success',
        title: 'Products deleted',
        message: `${selectedProducts.length} products have been deleted.`,
      });
      setSelectedProducts([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Plus size={20} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Bulk actions */}
          {selectedProducts.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} />
              <span>Delete ({selectedProducts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(filteredProducts.map(p => p.id));
                      } else {
                        setSelectedProducts([]);
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts([...selectedProducts, product.id]);
                        } else {
                          setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{product.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      GH₵ {product.price.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${product.stock <= 5 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`
                      inline-block px-2 py-1 text-xs font-medium rounded-full
                      ${product.status === 'active' ? 'bg-green-100 text-green-700' : 
                        product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-gray-100 text-gray-700'}
                    `}>
                      {product.status}
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
                        title="Edit"
                      >
                        <Edit size={16} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No products found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-sm text-gray-900 font-medium hover:underline"
            >
              Add your first product
            </button>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}

/**
 * Add Product Modal
 */
function AddProductModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    status: 'draft',
  });
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.category || !formData.price || !formData.stock) {
      addToast({
        type: 'error',
        title: 'Validation error',
        message: 'Please fill in all required fields.',
      });
      return;
    }

    // Submit form (mock)
    addToast({
      type: 'success',
      title: 'Product added',
      message: 'Product has been successfully added to inventory.',
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                required
              >
                <option value="">Select category</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Laptops">Laptops</option>
                <option value="Audio">Audio</option>
                <option value="Wearables">Wearables</option>
                <option value="Cameras">Cameras</option>
                <option value="Tablets">Tablets</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (GH₵) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition"
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-gray-900 transition resize-none"
              placeholder="Enter product description"
            />
          </div>

          {/* Product images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-900 transition-colors cursor-pointer">
              <Upload size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
