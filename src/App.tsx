import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2, Star, RefreshCw,
  Heart, Eye, ChevronDown, Check, Package, Truck, Shield, Zap,
  ArrowRight, Menu, Home, Grid3X3, Database, Wifi, WifiOff,
  User, ChevronLeft, ChevronRight, Filter as FilterIcon
} from 'lucide-react';
import { allProducts, allCategories, type Product } from './data/products';
import { initializeDatabase, checkDatabaseHealth, getDatabaseMode, getNeonInfo, type DatabaseStatus } from './database/service';
import { formatCurrency, getCurrency, setCurrency, getCurrencyCode } from './config/currency';
import { validateShippingAddress, validatePayment } from './utils/validation';
import { auditLog } from './audit/logger';

// Import new components
import { 
  ToastProvider, 
  WishlistProvider, 
  AuthProvider, 
  BackToTop, 
  CookieConsent, 
  NewsletterPopup,
  useToast,
  useWishlist,
  useAuth
} from './components';

interface CartItem {
  product: Product;
  quantity: number;
}

// ============================================
// DATABASE STATUS INDICATOR
// ============================================
function DatabaseStatusIndicator({ status }: { status: DatabaseStatus | null }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!status) return null;
  const isAPI = status.mode === 'api';
  const isConnected = status.connected;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-lg border text-xs font-medium transition-all hover:shadow-xl ${
          isAPI && isConnected ? 'border-green-200 text-green-700' : 'border-gray-200 text-gray-500'
        }`}
        aria-label="Database status"
      >
        {isAPI && isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
        <span>{isAPI ? 'Server API' : 'Local'}</span>
        <Database size={12} />
      </button>
      {isExpanded && (
        <div className="absolute bottom-12 left-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Database size={14} /> Database Status
            </h4>
            <button onClick={() => setIsExpanded(false)} className="p-1 rounded hover:bg-gray-100"><X size={14} /></button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-gray-500">Mode</span><span className={`font-medium ${isAPI ? 'text-green-600' : 'text-gray-600'}`}>{isAPI ? 'Server API' : 'Local Storage'}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Status</span><span className={`font-medium ${isConnected ? 'text-green-600' : 'text-gray-400'}`}>{isConnected ? 'Connected' : 'Offline'}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Products</span><span className="text-gray-900">{status.productCount}</span></div>
            {status.latency && <div className="flex justify-between text-xs"><span className="text-gray-500">Latency</span><span className="text-gray-900">{Math.round(status.latency)}ms</span></div>}
          </div>
          {!isAPI && <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">Set VITE_API_BASE_URL to connect to the server API.</p>}
        </div>
      )}
    </div>
  );
}

// ============================================
// HEADER
// ============================================
function Header({ cartCount, onCartClick, searchQuery, onSearchChange, onMenuClick }: {
  cartCount: number; onCartClick: () => void; searchQuery: string; onSearchChange: (q: string) => void; onMenuClick: () => void;
}) {
  const [showSearch, setShowSearch] = useState(false);
  const { isAuthenticated, user, openLoginModal } = useAuth();
  const { wishlist } = useWishlist();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      {/* Top bar */}
      <div className="bg-gray-900 text-white text-center text-xs py-2 font-medium tracking-wider">
        FREE SHIPPING ON ORDERS OVER {formatCurrency(50)} | USE CODE: <span className="font-bold">IVO2024</span>
      </div>
      
      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-4">
            <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Menu">
              <Menu size={20} />
            </button>
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">ivo</span>
            </a>
          </div>

          {/* Center: Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:bg-white focus:border-gray-900 transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button onClick={() => setShowSearch(!showSearch)} className="md:hidden p-2.5 hover:bg-gray-100 rounded-full transition" aria-label="Search">
              <Search size={20} />
            </button>
            
            {/* Account Button */}
            {isAuthenticated ? (
              <button className="hidden sm:flex items-center gap-2 p-2.5 hover:bg-gray-100 rounded-full transition" aria-label="Account">
                <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              </button>
            ) : (
              <button onClick={openLoginModal} className="hidden sm:flex p-2.5 hover:bg-gray-100 rounded-full transition" aria-label="Login">
                <User size={20} />
              </button>
            )}
            
            {/* Wishlist Button */}
            <button className="hidden sm:flex relative p-2.5 hover:bg-gray-100 rounded-full transition" aria-label={`Wishlist ${wishlist.length} items`}>
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length > 99 ? '99+' : wishlist.length}
                </span>
              )}
            </button>
            
            {/* Cart Button */}
            <button onClick={onCartClick} className="relative p-2.5 hover:bg-gray-100 rounded-full transition" aria-label={`Cart ${cartCount} items`}>
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {showSearch && (
          <div className="md:hidden pb-3 animate-fade-in">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:bg-white focus:border-gray-900"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Category nav */}
      <nav className="hidden lg:block border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-8 h-11 overflow-x-auto">
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-gray-900 whitespace-nowrap hover:text-gray-600 transition">New Arrivals</a>
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap hover:text-gray-900 transition">Smartphones</a>
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap hover:text-gray-900 transition">Laptops</a>
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap hover:text-gray-900 transition">Audio</a>
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap hover:text-gray-900 transition">Wearables</a>
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap hover:text-gray-900 transition">Cameras</a>
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap hover:text-gray-900 transition">Gaming</a>
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap hover:text-gray-900 transition">Smart Home</a>
            <a href="#" className="text-xs font-semibold uppercase tracking-wider text-red-500 whitespace-nowrap hover:text-red-600 transition">Sale</a>
          </div>
        </div>
      </nav>
    </header>
  );
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  return (
    <section className="relative bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in-up">
            <span className="inline-block px-3 py-1 bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider rounded-full">
              New Collection 2024
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Premium Electronics<br />
              <span className="text-gray-400">Redefined.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-md">
              Discover cutting-edge technology crafted for the modern lifestyle. From smartphones to smart home — elevate your everyday.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary px-8 py-3.5 rounded-full text-sm font-semibold flex items-center gap-2">
                Shop Now <ArrowRight size={16} />
              </button>
              <button className="btn-secondary px-8 py-3.5 rounded-full text-sm font-semibold">
                View Collections
              </button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">200+</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Products</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-gray-900">10</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Categories</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div>
                <p className="text-2xl font-bold text-gray-900">4.8★</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Rating</p>
              </div>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gray-200 rounded-3xl rotate-3" />
              <img
                src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=600&fit=crop"
                alt="Premium electronics"
                className="relative w-full h-full object-cover rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Truck size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Free Delivery</p>
                  <p className="text-xs text-gray-500">On all orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// CATEGORY PILLS
// ============================================
function CategoryFilter({ categories, activeCategory, onCategoryChange }: {
  categories: string[]; activeCategory: string; onCategoryChange: (c: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => onCategoryChange('All')}
          className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
            activeCategory === 'All'
              ? 'bg-gray-900 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Products
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// PRODUCT CARD
// ============================================
function ProductCard({ product, onAddToCart, onViewDetails, index }: {
  product: Product; onAddToCart: (p: Product) => void; onViewDetails: (p: Product) => void; index: number;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToast } = useToast();
  const isLiked = isInWishlist(product.id);
  const discount = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    addToast({
      type: 'success',
      title: 'Added to cart',
      message: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      removeFromWishlist(product.id);
      addToast({
        type: 'info',
        title: 'Removed from wishlist',
        message: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addToWishlist(product);
      addToast({
        type: 'success',
        title: 'Added to wishlist',
        message: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  return (
    <div
      className="product-card group bg-white rounded-2xl overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
        {!imageLoaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`product-image w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && <span className="badge badge-sale">-{discount}%</span>}
          {product.badge === 'New' && <span className="badge badge-new">New</span>}
          {product.badge === 'Hot' && <span className="badge badge-hot">Hot</span>}
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
            aria-label="Quick view"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={handleToggleWishlist}
            className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0 ${isLiked ? 'text-red-500' : ''}`}
            aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleAddToCart}
            className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-all transform translate-y-2 group-hover:translate-y-0"
            aria-label="Add to cart"
            disabled={!product.inStock}
          >
            <ShoppingCart size={16} />
          </button>
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider rounded-full">Sold Out</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">{product.category}</p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-gray-600 transition-colors">{product.name}</h3>
        
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={11} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
          ))}
          <span className="text-[10px] text-gray-400 ml-1">({product.reviews})</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">{formatCurrency(product.price)}</span>
            {discount > 0 && <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PRODUCT DETAIL MODAL
// ============================================
function ProductDetail({ product, onClose, onAddToCart }: {
  product: Product; onClose: () => void; onAddToCart: (p: Product, qty: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const discount = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl animate-scale-in shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100 transition" aria-label="Close">
          <X size={18} />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-square bg-gray-100">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            {discount > 0 && (
              <span className="absolute top-4 left-4 badge badge-sale text-sm">-{discount}%</span>
            )}
          </div>

          <div className="p-6 md:p-10 space-y-6">
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest mb-2">{product.category}</p>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-sm text-gray-500">{product.rating} ({product.reviews} reviews)</span>
            </div>

            <p className="text-gray-500 leading-relaxed">{product.description}</p>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Key Features</h4>
              <ul className="space-y-2">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={14} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
              {discount > 0 && <span className="text-lg text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>}
            </div>

            <div className="flex items-center gap-4 pt-2">
              <div className="qty-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease"><Minus size={14} /></button>
                <span className="text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} aria-label="Increase"><Plus size={14} /></button>
              </div>
              <button
                onClick={() => { onAddToCart(product, quantity); onClose(); }}
                disabled={!product.inStock}
                className="flex-1 btn-primary py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div className="flex flex-col items-center gap-2 text-center">
                <Truck size={20} className="text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Shield size={20} className="text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">2yr Warranty</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <Package size={20} className="text-gray-400" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CART SIDEBAR
// ============================================
function CartSidebar({ items, onClose, onUpdateQuantity, onRemoveItem, onCheckout, total }: {
  items: CartItem[]; onClose: () => void; onUpdateQuantity: (id: number, qty: number) => void;
  onRemoveItem: (id: number) => void; onCheckout: () => void; total: number;
}) {
  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white animate-slide-in-right flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Shopping Bag ({items.length})</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart size={32} className="text-gray-300" />
              </div>
              <div>
                <p className="text-gray-900 font-semibold">Your bag is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
              </div>
              <button onClick={onClose} className="btn-primary px-6 py-2.5 rounded-full text-sm font-semibold">
                Continue Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                <img src={item.product.image} alt={item.product.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{item.product.category}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="qty-selector scale-90">
                      <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} aria-label="Decrease"><Minus size={12} /></button>
                      <span className="text-xs font-medium px-2">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} aria-label="Increase"><Plus size={12} /></button>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                </div>
                <button onClick={() => onRemoveItem(item.product.id)} className="self-start p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition" aria-label="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 space-y-4 bg-white">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-900 font-medium">{formatCurrency(total)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="text-green-600 font-medium">Free</span></div>
              <div className="flex justify-between text-base font-bold pt-3 border-t border-gray-100">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(total)}</span>
              </div>
            </div>
            <button onClick={onCheckout} className="w-full btn-primary py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2">
              Checkout <ArrowRight size={16} />
            </button>
            <p className="text-center text-[10px] text-gray-400 uppercase tracking-wider">Secure checkout • Free returns</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CHECKOUT MODAL
// ============================================
function CheckoutModal({ onClose, total, items }: { onClose: () => void; total: number; items: CartItem[] }) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Ghana',
  });
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    cardholderName: '',
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  const handleShippingSubmit = () => {
    const validation = validateShippingAddress(shippingData);
    if (!validation.success) {
      setShippingErrors(validation.errors || {});
      return;
    }
    setShippingErrors({});
    setStep(2);
  };

  const handlePaymentSubmit = () => {
    const validation = validatePayment(paymentData);
    if (!validation.success) {
      setPaymentErrors(validation.errors || {});
      return;
    }
    setPaymentErrors({});
    setStep(3);
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Simulate API call (in production, this would call OrderAPI.create)
      // For now, we'll simulate a successful order creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a realistic order number (server would do this)
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      const generatedOrderNumber = `IVO-${timestamp}-${random}`;
      
      setOrderNumber(generatedOrderNumber);
      setIsComplete(true);
      
      // Log the order creation
      auditLog('order.created', 'order', generatedOrderNumber, {
        severity: 'info',
        newState: { total, itemCount: items.length, shippingData },
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      setProcessingError(errorMessage);
      auditLog('order.creation_failed', 'order', 'unknown', {
        severity: 'error',
        metadata: { error: errorMessage },
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-white rounded-3xl p-10 text-center animate-scale-in shadow-2xl space-y-6">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <Check size={36} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Confirmed!</h2>
            <p className="text-gray-500 mt-2">Order #{orderNumber}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Items</span><span className="text-gray-900">{items.reduce((a, b) => a + b.quantity, 0)}</span></div>
            <div className="flex justify-between text-sm font-bold"><span className="text-gray-900">Total Paid</span><span className="text-gray-900">{formatCurrency(total)}</span></div>
          </div>
          <button onClick={onClose} className="w-full btn-primary py-3.5 rounded-full text-sm font-semibold">Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl animate-scale-in shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
          <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s <= step ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>{s < step ? <Check size={14} /> : s}</div>
                {s < 3 && <div className={`w-12 h-0.5 rounded ${s < step ? 'bg-gray-900' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-gray-900">Shipping Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input 
                    placeholder="First Name" 
                    value={shippingData.firstName}
                    onChange={(e) => setShippingData({...shippingData, firstName: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${shippingErrors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {shippingErrors.firstName && <p className="text-red-500 text-xs mt-1">{shippingErrors.firstName}</p>}
                </div>
                <div>
                  <input 
                    placeholder="Last Name" 
                    value={shippingData.lastName}
                    onChange={(e) => setShippingData({...shippingData, lastName: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${shippingErrors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {shippingErrors.lastName && <p className="text-red-500 text-xs mt-1">{shippingErrors.lastName}</p>}
                </div>
              </div>
              <div>
                <input 
                  placeholder="Email Address" 
                  type="email"
                  value={shippingData.email}
                  onChange={(e) => setShippingData({...shippingData, email: e.target.value})}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${shippingErrors.email ? 'border-red-500' : 'border-gray-200'}`}
                />
                {shippingErrors.email && <p className="text-red-500 text-xs mt-1">{shippingErrors.email}</p>}
              </div>
              <div>
                <input 
                  placeholder="Phone (optional)" 
                  type="tel"
                  value={shippingData.phone}
                  onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${shippingErrors.phone ? 'border-red-500' : 'border-gray-200'}`}
                />
                {shippingErrors.phone && <p className="text-red-500 text-xs mt-1">{shippingErrors.phone}</p>}
              </div>
              <div>
                <input 
                  placeholder="Street Address" 
                  value={shippingData.street}
                  onChange={(e) => setShippingData({...shippingData, street: e.target.value})}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${shippingErrors.street ? 'border-red-500' : 'border-gray-200'}`}
                />
                {shippingErrors.street && <p className="text-red-500 text-xs mt-1">{shippingErrors.street}</p>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <input 
                    placeholder="City" 
                    value={shippingData.city}
                    onChange={(e) => setShippingData({...shippingData, city: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${shippingErrors.city ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {shippingErrors.city && <p className="text-red-500 text-xs mt-1">{shippingErrors.city}</p>}
                </div>
                <div>
                  <input 
                    placeholder="Region" 
                    value={shippingData.state}
                    onChange={(e) => setShippingData({...shippingData, state: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${shippingErrors.state ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {shippingErrors.state && <p className="text-red-500 text-xs mt-1">{shippingErrors.state}</p>}
                </div>
                <div>
                  <input 
                    placeholder="Postal" 
                    value={shippingData.postalCode}
                    onChange={(e) => setShippingData({...shippingData, postalCode: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${shippingErrors.postalCode ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {shippingErrors.postalCode && <p className="text-red-500 text-xs mt-1">{shippingErrors.postalCode}</p>}
                </div>
              </div>
              <button onClick={handleShippingSubmit} className="w-full btn-primary py-3.5 rounded-full text-sm font-semibold">Continue to Payment</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-gray-900">Payment Details</h3>
              <div>
                <input 
                  placeholder="Card Number" 
                  value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${paymentErrors.cardNumber ? 'border-red-500' : 'border-gray-200'}`}
                />
                {paymentErrors.cardNumber && <p className="text-red-500 text-xs mt-1">{paymentErrors.cardNumber}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input 
                    placeholder="MM/YY" 
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${paymentErrors.expiryDate ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {paymentErrors.expiryDate && <p className="text-red-500 text-xs mt-1">{paymentErrors.expiryDate}</p>}
                </div>
                <div>
                  <input 
                    placeholder="CVC" 
                    value={paymentData.cvc}
                    onChange={(e) => setPaymentData({...paymentData, cvc: e.target.value})}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${paymentErrors.cvc ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {paymentErrors.cvc && <p className="text-red-500 text-xs mt-1">{paymentErrors.cvc}</p>}
                </div>
              </div>
              <div>
                <input 
                  placeholder="Name on Card" 
                  value={paymentData.cardholderName}
                  onChange={(e) => setPaymentData({...paymentData, cardholderName: e.target.value})}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm focus:bg-white focus:border-gray-900 transition ${paymentErrors.cardholderName ? 'border-red-500' : 'border-gray-200'}`}
                />
                {paymentErrors.cardholderName && <p className="text-red-500 text-xs mt-1">{paymentErrors.cardholderName}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 btn-secondary py-3.5 rounded-full text-sm font-semibold">Back</button>
                <button onClick={handlePaymentSubmit} className="flex-1 btn-primary py-3.5 rounded-full text-sm font-semibold">Review Order</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-semibold text-gray-900">Order Summary</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 max-h-40 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate">{item.product.name} × {item.quantity}</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">{formatCurrency(total)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="text-green-600">Free</span></div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                  <span className="text-gray-900">Total</span><span className="text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 btn-secondary py-3.5 rounded-full text-sm font-semibold">Back</button>
                <button onClick={handleCheckout} disabled={isProcessing} className="flex-1 btn-primary py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {isProcessing ? <><RefreshCw size={16} className="animate-spin" /> Processing...</> : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MOBILE NAV
// ============================================
function MobileNav({ isOpen, onClose, activeCategory, onCategoryChange, categories }: {
  isOpen: boolean; onClose: () => void; activeCategory: string; onCategoryChange: (c: string) => void; categories: string[];
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[55] lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white animate-slide-in-right p-6 space-y-6 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center"><Zap size={16} className="text-white" /></div>
            <span className="text-lg font-bold">ivo</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>
        <nav className="space-y-1">
          <button onClick={() => { onCategoryChange('All'); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeCategory === 'All' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Home size={16} /> All Products
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => { onCategoryChange(cat); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeCategory === cat ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Grid3X3 size={16} /> {cat}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ============================================
// FEATURES BANNER
// ============================================
function FeaturesBanner() {
  const features = [
    { icon: Truck, title: 'Free Shipping', desc: `On orders over ${formatCurrency(50)}` },
    { icon: Shield, title: 'Secure Payment', desc: '256-bit encryption' },
    { icon: Package, title: 'Easy Returns', desc: '30-day policy' },
    { icon: Zap, title: 'Fast Delivery', desc: '2-3 business days' },
  ];
  return (
    <section className="border-y border-gray-100 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <f.icon size={18} className="text-gray-700" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{f.title}</h4>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// MAIN APP
// ============================================
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

  useEffect(() => {
    const status = initializeDatabase();
    setDbStatus(status);
    const interval = setInterval(async () => {
      const updated = await checkDatabaseHealth();
      setDbStatus(updated);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredProducts = useMemo(() => {
    let products = allProducts;
    if (activeCategory !== 'All') products = products.filter(p => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    switch (sortBy) {
      case 'price-low': products = [...products].sort((a, b) => a.price - b.price); break;
      case 'price-high': products = [...products].sort((a, b) => b.price - a.price); break;
      case 'rating': products = [...products].sort((a, b) => b.rating - a.rating); break;
      case 'name': products = [...products].sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return products;
  }, [activeCategory, searchQuery, sortBy]);

  const cartTotal = useMemo(() => cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0), [cartItems]);
  const cartCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);

  const { addToast } = useToast();

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        addToast({
          type: 'info',
          title: 'Cart updated',
          message: `${product.name} quantity updated to ${existing.quantity + quantity}.`,
        });
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: Math.min(10, i.quantity + quantity) } : i);
      }
      addToast({
        type: 'success',
        title: 'Added to cart',
        message: `${product.name} has been added to your cart.`,
      });
      return [...prev, { product, quantity }];
    });
  }, [addToast]);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) setCartItems(prev => prev.filter(i => i.product.id !== productId));
    else setCartItems(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: Math.min(10, quantity) } : i));
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCartItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const updated = await checkDatabaseHealth();
      setDbStatus(updated);
      setLastRefresh(new Date());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, []);

  return (
    <ToastProvider>
      <WishlistProvider>
        <AuthProvider>
          <div className="min-h-screen bg-white">
            <DatabaseStatusIndicator status={dbStatus} />
            <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} onMenuClick={() => setIsMobileMenuOpen(true)} />
            <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} activeCategory={activeCategory} onCategoryChange={setActiveCategory} categories={allCategories} />

            <main className="pt-28 lg:pt-36">
              <HeroSection />
              <FeaturesBanner />

              {/* Products Section */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                {/* Section header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {activeCategory === 'All' ? 'All Products' : activeCategory}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {filteredProducts.length} products • Updated {lastRefresh.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handleRefresh} className={`flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-full text-xs font-medium hover:bg-gray-200 transition ${isRefreshing ? 'opacity-60' : ''}`}>
                      <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Refresh
                    </button>
                    <div className="relative">
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-4 pr-8 py-2.5 bg-gray-100 rounded-full text-xs font-medium focus:outline-none focus:bg-gray-200 cursor-pointer">
                        <option value="default">Featured</option>
                        <option value="price-low">Price: Low → High</option>
                        <option value="price-high">Price: High → Low</option>
                        <option value="rating">Top Rated</option>
                        <option value="name">Name A-Z</option>
                      </select>
                      <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-8">
                  <CategoryFilter categories={allCategories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
                </div>

                {/* Grid */}
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500">No products found</p>
                    <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="text-sm text-gray-900 font-medium underline">Clear filters</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {filteredProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} onAddToCart={addToCart} onViewDetails={setSelectedProduct} />
                    ))}
                  </div>
                )}
              </section>

              {/* Newsletter */}
              <section className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3">Stay in the Loop</h2>
                  <p className="text-gray-400 text-sm max-w-md mx-auto mb-8">Subscribe to get special offers, new arrivals, and exclusive deals delivered to your inbox.</p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input type="email" placeholder="Enter your email" className="flex-1 px-5 py-3 bg-white/10 border border-white/20 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/40" />
                    <button className="px-6 py-3 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition">Subscribe</button>
                  </div>
                </div>
              </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center"><Zap size={16} className="text-white" /></div>
                      <span className="text-lg font-bold">ivo</span>
                    </div>
                    <p className="text-sm text-gray-400">Premium electronics for the modern lifestyle.</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">Shop</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li><a href="#" className="hover:text-gray-900 transition">New Arrivals</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">Best Sellers</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">Sale</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">Collections</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">Support</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li><a href="#" className="hover:text-gray-900 transition">Contact Us</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">FAQs</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">Shipping</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">Returns</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">Company</h4>
                    <ul className="space-y-2 text-sm text-gray-500">
                      <li><a href="#" className="hover:text-gray-900 transition">About</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">Careers</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">Privacy</a></li>
                      <li><a href="#" className="hover:text-gray-900 transition">Terms</a></li>
                    </ul>
                  </div>
                </div>
                <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-gray-400">© 2024 ivo Electronics. All rights reserved.</p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">Powered by</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                      <Database size={12} /> Neon PostgreSQL (via Server API)
                    </span>
                  </div>
                </div>
              </div>
            </footer>

            {/* New UI Components */}
            <BackToTop />
            <CookieConsent />
            <NewsletterPopup />

            {/* Modals */}
            {selectedProduct && <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={addToCart} />}
            {isCartOpen && <CartSidebar items={cartItems} onClose={() => setIsCartOpen(false)} onUpdateQuantity={updateQuantity} onRemoveItem={removeFromCart} onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} total={cartTotal} />}
            {isCheckoutOpen && <CheckoutModal onClose={() => { setIsCheckoutOpen(false); setCartItems([]); }} total={cartTotal} items={cartItems} />}
          </div>
        </AuthProvider>
      </WishlistProvider>
    </ToastProvider>
  );
}
