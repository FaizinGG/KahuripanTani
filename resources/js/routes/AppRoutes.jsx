import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from '../components/ProtectedRoute';
import AppLayout from '../layouts/AppLayout';
import LoginPage from '../pages/Auth/LoginPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import POSPage from '../pages/POS/POSPage';
import ProductListPage from '../pages/Products/ProductListPage';
import CategoryPage from '../pages/Categories/CategoryPage';
import SupplierPage from '../pages/Suppliers/SupplierPage';
import CustomerPage from '../pages/Customers/CustomerPage';
import StockPage from '../pages/Stock/StockPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import ReceivablesPage from '../pages/Receivables/ReceivablesPage';
import ManagementPage from '../pages/Management/ManagementPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import MembershipPage from '../pages/Memberships/MembershipPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import PlaceholderPage from '../pages/PlaceholderPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="pos"
          element={
            <RoleRoute requiredRoles={['owner', 'admin', 'kasir']}>
              <POSPage />
            </RoleRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <RoleRoute requiredRoles={['owner', 'admin', 'gudang']}>
              <ProductListPage />
            </RoleRoute>
          }
        />
        <Route path="products" element={<Navigate to="/inventory" replace />} />
        <Route
          path="management"
          element={
            <RoleRoute requiredRoles={['owner', 'admin']}>
              <ManagementPage />
            </RoleRoute>
          }
        />
        <Route
          path="management/cleanup"
          element={
            <RoleRoute requiredRoles={['owner', 'admin']}>
              <Navigate to="/management?view=cleanup" replace />
            </RoleRoute>
          }
        />
        <Route
          path="management/receivables"
          element={
            <RoleRoute requiredRoles={['owner', 'admin', 'kasir']}>
              <ReceivablesPage />
            </RoleRoute>
          }
        />
        <Route
          path="management/receivables/customer/:customerId"
          element={
            <RoleRoute requiredRoles={['owner', 'admin', 'kasir']}>
              <ReceivablesPage />
            </RoleRoute>
          }
        />
        <Route
          path="management/receivables/customer/:customerId/receivable/:receivableId"
          element={
            <RoleRoute requiredRoles={['owner', 'admin', 'kasir']}>
              <ReceivablesPage />
            </RoleRoute>
          }
        />
        <Route
          path="reports"
          element={
            <RoleRoute requiredRoles={['owner', 'admin']}>
              <ReportsPage />
            </RoleRoute>
          }
        />
        <Route path="categories" element={<CategoryPage />} />
        <Route path="suppliers" element={<SupplierPage />} />
        <Route path="memberships" element={<MembershipPage />} />
        <Route path="customers" element={<CustomerPage />} />
        <Route path="stocks" element={<StockPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route
          path="admin"
          element={
            <RoleRoute requiredRoles={['owner', 'admin']}>
              <Navigate to="/management?view=qris" replace />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
