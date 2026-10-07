/**
 * Components Index
 * Central export point for all UI components
 */

// Toast notifications
export { ToastProvider, useToast } from './Toast';
export type { Toast, ToastType } from './Toast';

// Loading skeletons
export { 
  ProductCardSkeleton, 
  ProductGridSkeleton, 
  ProductDetailSkeleton, 
  CartItemSkeleton, 
  OrderCardSkeleton,
  PageSkeleton 
} from './Skeletons';

// Breadcrumbs
export { Breadcrumbs } from './Breadcrumbs';
export type { BreadcrumbItem } from './Breadcrumbs';

// Pagination
export { Pagination } from './Pagination';

// Back to top button
export { BackToTop } from './BackToTop';

// Cookie consent
export { CookieConsent } from './CookieConsent';

// Newsletter popup
export { NewsletterPopup } from './NewsletterPopup';

// Wishlist
export { WishlistProvider, useWishlist } from './Wishlist';

// Authentication
export { AuthProvider, useAuth } from './Auth';

// Account pages
export { AccountPage } from './AccountPages';

// Static pages
export { 
  NotFoundPage, 
  AboutPage, 
  ContactPage, 
  TermsPage, 
  PrivacyPage 
} from './StaticPages';

// Error boundary
export { ErrorBoundary } from './ErrorBoundary';
