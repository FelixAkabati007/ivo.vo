/**
 * Admin Router Configuration
 * Defines all admin routes and pages
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './pages/Dashboard';
import { AdminProducts } from './pages/Products';
import { AdminOrders } from './pages/Orders';
import { AdminCustomers } from './pages/Customers';
import { AdminSettings } from './pages/Settings';
import { useAuth } from '../components/Auth';

/**
 * Protected route wrapper - redirects to login if not authenticated
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

/**
 * Admin Router Component
 */
export function AdminRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminProducts />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminCustomers />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        {/* Redirect any unknown admin routes to dashboard */}
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
