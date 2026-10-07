/**
 * Admin Component
 * Main entry point for admin dashboard
 */

import { ToastProvider } from '../components/Toast';
import { WishlistProvider } from '../components/Wishlist';
import { AuthProvider } from '../components/Auth';
import { AdminRouter } from './AdminRouter';

export function Admin() {
  return (
    <ToastProvider>
      <WishlistProvider>
        <AuthProvider>
          <AdminRouter />
        </AuthProvider>
      </WishlistProvider>
    </ToastProvider>
  );
}
