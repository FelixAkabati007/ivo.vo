import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, ShoppingCart, X, Plus, Minus, Trash2, Star, Filter, RefreshCw, Heart, Eye, ChevronDown, Check, Package, Truck, Shield, Zap, ArrowRight, Menu, Home, Grid3X3, Tag, Database, Wifi, WifiOff } from 'lucide-react';
import { allProducts, allCategories, type Product } from './data/products';
import { initializeDatabase, checkDatabaseHealth, getDatabaseMode, getNeonInfo, type DatabaseStatus } from './database/service';

interface CartItem {
  product: Product;
  quantity: number;
}

// Database Status Indicator Component
function DatabaseStatusIndicator({ status }: { status: DatabaseStatus | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!status) return null;
  
  const isNeon = status.mode === 'neon';
  const isConnected = status.connection.isConnected;
  const neonInfo = getNeonInfo();

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl glass-strong text-xs font-medium transition-all hover:scale-105 ${
          isNeon && isConnected ? 'text-green-400' : 'text-ivo-300/60'
        }`}
        aria-label="Database status"
      >
        {isNeon && isConnected ? (
          <Wifi size={14} className="text-green-400" />
        ) : (
          <WifiOff size={14} className="text-ivo-400/50" />
        )}
        <span className="hidden sm:inline">
          {isNeon ? 'Neon DB' : 'Local'}
        </span>
        <Database size={12} />
      </button>

      {isExpanded && (
        <div className="absolute bottom-12 left-0 w-64 glass-strong rounded-2xl p-4 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ivo-100 flex items-center gap-2">
              <Database size={14} className="text-ivo-400" />
              Database Status
            </h4>
            <button onClick={() => setIsExpanded(false)} className="p-1 rounded-lg hover:bg-white/10">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ivo-300/60">Mode</span>
              <span className={`font-medium ${isNeon ? 'text-green-400' : 'text-ivo-300'}`}>
                {isNeon ? 'Neon PostgreSQL' : 'Local Storage'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ivo-300/60">Connection</span>
              <span className={`font-medium ${isConnected ? 'text-green-400' : 'text-ivo-400/50'}`}>
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ivo-300/60">Products</span>
              <span className="text-ivo-200">{status.productCount}</span>
            </div>
            {status.connection.latency && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-ivo-300/60">Latency</span>
                <span className="text-ivo-200">{Math.round(status.connection.latency)}ms</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-ivo-300/60">Queries</span>
              <span className="text-ivo-200">{status.connection.queryCount}</span>
            </div>
          </div>

          {isNeon && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-ivo-300/40 mb-2">Tables:</p>
              <div className="flex flex-wrap gap-1">
                {neonInfo.tables.slice(0, 6).map((table) => (
                  <span key={table} className="px-2 py-0.5 rounded-md glass text-[10px] text-ivo-300/60">
                    {table}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!isNeon && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-ivo-300/40 leading-relaxed">
                Set <code className="text-ivo-400">VITE_NEON_DATABASE_URL</code> in your environment to connect to Neon PostgreSQL.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Header Component
function Header({ 
  cartCount, 
  onCartClick, 
  searchQuery, 
  onSearchChange,
  onMenuClick,
  isMobileMenuOpen
}: { 
  cartCount: number; 
  onCartClick: () => void; 
  searchQuery: string; 
  onSearchChange: (q: string) => void;
  onMenuClick: () => void;
  isMobileMenuOpen: boolean;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl glass hover:bg-white/10 transition-all"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl warm-gradient flex items-center justify-center animate-pulse-glow">
              <Zap size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-gradient">ivo</span>
            </h1>
          </div>
        </div>

        <div className="hidden sm:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ivo-300/60 group-focus-within:text-ivo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none focus:ring-2 focus:ring-ivo-400/20 text-sm text-ivo-50 placeholder-ivo-200/40 transition-all"
              aria-label="Search products"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onCartClick}
            className="relative p-2.5 rounded-2xl glass hover:bg-white/10 transition-all group"
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <ShoppingCart size={20} className="text-ivo-100 group-hover:text-ivo-300 transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full warm-gradient text-white text-xs font-bold flex items-center justify-center animate-scale-in">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ivo-300/60" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/40"
            aria-label="Search products"
          />
        </div>
      </div>
    </header>
  );
}

// Category Filter
function CategoryFilter({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}: { 
  categories: string[]; 
  activeCategory: string; 
  onCategoryChange: (c: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 pt-1">
      <button
        onClick={() => onCategoryChange('All')}
        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
          activeCategory === 'All'
            ? 'warm-gradient text-white shadow-lg shadow-ivo-500/20'
            : 'glass text-ivo-200 hover:text-white hover:bg-white/10'
        }`}
      >
        All Products
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onCategoryChange(cat)}
          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeCategory === cat
              ? 'warm-gradient text-white shadow-lg shadow-ivo-500/20'
              : 'glass text-ivo-200 hover:text-white hover:bg-white/10'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// Product Card
function ProductCard({ 
  product, 
  onAddToCart, 
  onViewDetails,
  index 
}: { 
  product: Product; 
  onAddToCart: (p: Product) => void; 
  onViewDetails: (p: Product) => void;
  index: number;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      className="glass-card rounded-2xl overflow-hidden group animate-fade-in-up"
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-warm-surface">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-shimmer bg-warm-card" />
        )}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {product.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold warm-gradient text-white shadow-lg">
            {product.badge}
          </span>
        )}

        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
            className={`p-2 rounded-xl glass-strong transition-all ${isLiked ? 'text-red-400' : 'text-white/70 hover:text-red-400'}`}
            aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
            className="p-2 rounded-xl glass-strong text-white/70 hover:text-ivo-300 transition-all"
            aria-label="Quick view"
          >
            <Eye size={16} />
          </button>
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="px-4 py-2 rounded-xl glass-strong text-sm font-medium text-white">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <p className="text-xs text-ivo-400/70 font-medium uppercase tracking-wider">{product.category}</p>
        <h3 className="text-sm font-semibold text-ivo-50 line-clamp-1 group-hover:text-ivo-200 transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={12} 
                className={i < Math.floor(product.rating) ? 'text-ivo-400 fill-ivo-400' : 'text-ivo-700'} 
              />
            ))}
          </div>
          <span className="text-xs text-ivo-300/60">({product.reviews})</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-ivo-100">GH₵{product.price}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-ivo-400/50 line-through">GH₵{product.originalPrice}</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
            className="p-2 rounded-xl btn-primary text-white disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Product Detail Modal
function ProductDetail({ 
  product, 
  onClose, 
  onAddToCart 
}: { 
  product: Product; 
  onClose: () => void; 
  onAddToCart: (p: Product, qty: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl animate-scale-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl glass hover:bg-white/20 transition-all"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-square bg-warm-surface">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-xl text-sm font-bold warm-gradient text-white">
                {product.badge}
              </span>
            )}
          </div>

          <div className="p-6 md:p-8 space-y-5">
            <div>
              <p className="text-xs text-ivo-400 font-medium uppercase tracking-wider mb-1">{product.category}</p>
              <h2 className="text-2xl font-bold text-ivo-50">{product.name}</h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-ivo-400 fill-ivo-400' : 'text-ivo-700'} />
                ))}
              </div>
              <span className="text-sm text-ivo-300/70">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <p className="text-sm text-ivo-200/70 leading-relaxed">{product.description}</p>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-ivo-200">Key Features</h4>
              <ul className="space-y-1.5">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ivo-200/60">
                    <Check size={14} className="text-ivo-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-ivo-100">GH₵{product.price}</span>
              {product.originalPrice > product.price && (
                <span className="text-lg text-ivo-400/50 line-through">GH₵{product.originalPrice}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center glass rounded-xl overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-white/10 transition-all"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 text-sm font-medium min-w-[40px] text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="p-2.5 hover:bg-white/10 transition-all"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
              <button
                onClick={() => { onAddToCart(product, quantity); onClose(); }}
                disabled={!product.inStock}
                className="flex-1 py-3 rounded-xl btn-primary text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/5">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck size={18} className="text-ivo-400" />
                <span className="text-xs text-ivo-300/60">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Shield size={18} className="text-ivo-400" />
                <span className="text-xs text-ivo-300/60">2yr Warranty</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Package size={18} className="text-ivo-400" />
                <span className="text-xs text-ivo-300/60">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart Sidebar
function CartSidebar({ 
  items, 
  onClose, 
  onUpdateQuantity, 
  onRemoveItem,
  onCheckout,
  total 
}: { 
  items: CartItem[]; 
  onClose: () => void; 
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemoveItem: (id: number) => void;
  onCheckout: () => void;
  total: number;
}) {
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md glass-strong animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-bold text-ivo-50 flex items-center gap-2">
            <ShoppingCart size={20} className="text-ivo-400" />
            Your Cart
            <span className="text-sm font-normal text-ivo-300/60">({items.length} items)</span>
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl glass hover:bg-white/10 transition-all" aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
                <ShoppingCart size={28} className="text-ivo-400/40" />
              </div>
              <p className="text-ivo-200/50 text-sm">Your cart is empty</p>
              <button onClick={onClose} className="text-sm text-ivo-400 hover:text-ivo-300 transition-colors">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="glass-card rounded-xl p-3 flex gap-3">
                <img src={item.product.image} alt={item.product.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-ivo-100 truncate">{item.product.name}</h4>
                  <p className="text-xs text-ivo-300/50">{item.product.category}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center glass rounded-lg overflow-hidden">
                      <button 
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 hover:bg-white/10 transition-all"
                        aria-label="Decrease"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 hover:bg-white/10 transition-all"
                        aria-label="Increase"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-ivo-200">GH₵{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-ivo-400/40 hover:text-red-400 transition-all self-start"
                  aria-label={`Remove ${item.product.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-white/5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ivo-300/60">Subtotal</span>
                <span className="text-ivo-200">GH₵{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ivo-300/60">Shipping</span>
                <span className="text-green-400">Free</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-white/5">
                <span className="text-ivo-100">Total</span>
                <span className="text-gradient">GH₵{total.toFixed(2)}</span>
              </div>
            </div>
            <button 
              onClick={onCheckout}
              className="w-full py-3 rounded-xl btn-primary text-white font-semibold flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Checkout Modal
function CheckoutModal({ 
  onClose, 
  total,
  items 
}: { 
  onClose: () => void; 
  total: number;
  items: CartItem[];
}) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsComplete(true);
    }, 2000);
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative w-full max-w-md glass-strong rounded-3xl p-8 text-center animate-scale-in space-y-5">
          <div className="w-20 h-20 mx-auto rounded-full warm-gradient flex items-center justify-center animate-pulse-glow">
            <Check size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-ivo-50">Order Confirmed!</h2>
          <p className="text-sm text-ivo-200/60">
            Thank you for your purchase. Your order #{Math.floor(Math.random() * 900000 + 100000)} has been placed successfully.
          </p>
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-ivo-300/60">Items</span>
              <span className="text-ivo-200">{items.reduce((a, b) => a + b.quantity, 0)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-ivo-100">Total Paid</span>
              <span className="text-gradient">GH₵{total.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl btn-primary text-white font-semibold">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto glass-strong rounded-3xl animate-scale-in">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ivo-50">Checkout</h2>
          <button onClick={onClose} className="p-2 rounded-xl glass hover:bg-white/10 transition-all" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s <= step ? 'warm-gradient text-white' : 'glass text-ivo-400/50'
                }`}>
                  {s < step ? <Check size={14} /> : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 rounded ${s < step ? 'bg-ivo-400' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-ivo-200">Shipping Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First Name" className="col-span-1 px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
                <input placeholder="Last Name" className="col-span-1 px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
              </div>
              <input placeholder="Email Address" type="email" className="w-full px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
              <input placeholder="Street Address" className="w-full px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="City" className="px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
                <input placeholder="State" className="px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
                <input placeholder="ZIP" className="px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
              </div>
              <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl btn-primary text-white font-semibold">
                Continue to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-ivo-200">Payment Details</h3>
              <input placeholder="Card Number" className="w-full px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="MM/YY" className="px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
                <input placeholder="CVC" className="px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
              </div>
              <input placeholder="Name on Card" className="w-full px-4 py-2.5 rounded-xl glass border border-white/5 focus:border-ivo-400/40 focus:outline-none text-sm text-ivo-50 placeholder-ivo-200/30" />
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl glass text-ivo-200 font-medium hover:bg-white/10 transition-all">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl btn-primary text-white font-semibold">
                  Review Order
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in-up">
              <h3 className="text-sm font-semibold text-ivo-200">Order Summary</h3>
              <div className="glass rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-ivo-200/70 truncate">{item.product.name} × {item.quantity}</span>
                    <span className="text-ivo-200 font-medium">GH₵{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-ivo-300/60">Subtotal</span>
                  <span className="text-ivo-200">GH₵{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ivo-300/60">Shipping</span>
                  <span className="text-green-400">Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/5">
                  <span className="text-ivo-100">Total</span>
                  <span className="text-gradient">GH₵{total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl glass text-ivo-200 font-medium hover:bg-white/10 transition-all">
                  Back
                </button>
                <button 
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="flex-1 py-3 rounded-xl btn-primary text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Place Order</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Navigation
function MobileNav({ isOpen, onClose, activeCategory, onCategoryChange, categories }: {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onCategoryChange: (c: string) => void;
  categories: string[];
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[55] lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 glass-strong animate-slide-in-right p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gradient">ivo</h2>
          <button onClick={onClose} className="p-2 rounded-xl glass hover:bg-white/10" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        
        <nav className="space-y-1">
          <button
            onClick={() => { onCategoryChange('All'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
              activeCategory === 'All' ? 'warm-gradient text-white' : 'text-ivo-200 hover:bg-white/5'
            }`}
          >
            <Home size={16} />
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { onCategoryChange(cat); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                activeCategory === cat ? 'warm-gradient text-white' : 'text-ivo-200 hover:bg-white/5'
              }`}
            >
              <Grid3X3 size={16} />
              {cat}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-ivo-300/50">
            <Tag size={14} />
            <span>200+ Products Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Initialize database connection on mount
  useEffect(() => {
    const status = initializeDatabase();
    setDbStatus(status);
    
    // Check health periodically
    const interval = setInterval(async () => {
      const updatedStatus = await checkDatabaseHealth();
      setDbStatus(updatedStatus);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredProducts = useMemo(() => {
    let products = allProducts;
    
    if (activeCategory !== 'All') {
      products = products.filter(p => p.category === activeCategory);
    }
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'price-low':
        products = [...products].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        products = [...products].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products = [...products].sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        products = [...products].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return products;
  }, [activeCategory, searchQuery, sortBy]);

  const cartTotal = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const cartCount = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: Math.min(10, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.product.id !== productId));
    } else {
      setCartItems(prev => prev.map(item => 
        item.product.id === productId ? { ...item, quantity: Math.min(10, quantity) } : item
      ));
    }
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refresh database health check
      const updatedStatus = await checkDatabaseHealth();
      setDbStatus(updatedStatus);
      setLastRefresh(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  const handleCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);

  const handleCheckoutClose = useCallback(() => {
    setIsCheckoutOpen(false);
    setCartItems([]);
  }, []);

  return (
    <div className="min-h-screen bg-warm-bg">
      <DatabaseStatusIndicator status={dbStatus} />
      <Header 
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onMenuClick={() => setIsMobileMenuOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        categories={allCategories}
      />

      <main ref={mainRef} className="pt-28 sm:pt-24 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="mb-8 animate-fade-in-up">
          <div className="glass-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ivo-500/10 via-transparent to-ivo-700/5" />
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-ivo-50 mb-2">
                    Discover <span className="text-gradient">Premium</span> Electronics
                  </h2>
                  <p className="text-sm text-ivo-200/60 max-w-lg">
                    Explore our curated collection of 200+ cutting-edge devices. From smartphones to smart home — find your perfect tech.
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-white/10 transition-all text-sm font-medium ${isRefreshing ? 'opacity-60' : ''}`}
                  aria-label="Refresh products"
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-ivo-300/40">
                <span className="flex items-center gap-1">
                  <Package size={12} />
                  {filteredProducts.length} products
                </span>
                <span>•</span>
                <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Database size={10} />
                  {dbStatus?.mode === 'neon' ? 'Neon PostgreSQL' : 'Local Storage'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between gap-4">
            <CategoryFilter 
              categories={allCategories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-ivo-300/50">
              Showing {filteredProducts.length} of {allProducts.length} products
            </p>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 rounded-xl glass text-xs text-ivo-200 focus:outline-none focus:border-ivo-400/40 cursor-pointer"
                aria-label="Sort products"
              >
                <option value="default">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="name">Name A-Z</option>
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivo-400/50 pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section>
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
                <Search size={28} className="text-ivo-400/40" />
              </div>
              <p className="text-ivo-200/50 text-sm">No products found</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                className="text-sm text-ivo-400 hover:text-ivo-300 transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onAddToCart={addToCart}
                  onViewDetails={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </section>

        {/* Features Banner */}
        <section className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {[
            { icon: Truck, title: 'Free Shipping', desc: 'On orders over GH₵50' },
            { icon: Shield, title: 'Secure Payment', desc: '256-bit encryption' },
            { icon: Package, title: 'Easy Returns', desc: '30-day return policy' },
            { icon: Zap, title: 'Fast Delivery', desc: '2-3 business days' },
          ].map((feature, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 text-center space-y-2">
              <feature.icon size={24} className="mx-auto text-ivo-400" />
              <h4 className="text-sm font-semibold text-ivo-100">{feature.title}</h4>
              <p className="text-xs text-ivo-300/50">{feature.desc}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg warm-gradient flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-gradient">ivo</span>
          </div>
          <p className="text-xs text-ivo-300/40">© 2024 ivo Electronics. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}

      {isCartOpen && (
        <CartSidebar
          items={cartItems}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onCheckout={handleCheckout}
          total={cartTotal}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal
          onClose={handleCheckoutClose}
          total={cartTotal}
          items={cartItems}
        />
      )}
    </div>
  );
}
