import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const normalizeRoleName = (role) => {
  const value = typeof role === 'string' ? role : role?.name || role?.slug || '';
  const normalized = value.toString().trim().toLowerCase();

  if (['employee', 'kasir', 'cashier'].includes(normalized)) return 'kasir';
  if (['gudang', 'warehouse', 'stock'].includes(normalized)) return 'gudang';
  if (['owner', 'superadmin'].includes(normalized)) return 'owner';
  if (['admin', 'administrator'].includes(normalized)) return 'admin';

  return normalized;
};

const hasRequiredRole = (user, requiredRoles) => {
  if (!requiredRoles || requiredRoles.length === 0) return true;

  const roleNames = (user?.roles || []).map((role) => normalizeRoleName(role));
  const fallbackRole = normalizeRoleName(user?.role);

  if (fallbackRole && !roleNames.includes(fallbackRole)) {
    roleNames.push(fallbackRole);
  }

  return roleNames.some((role) => requiredRoles.includes(role));
};

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export const RoleRoute = ({ children, requiredRoles }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!hasRequiredRole(user, requiredRoles)) {
      navigate('/unauthorized', { replace: true });
    }
  }, [isAuthenticated, user, requiredRoles, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return children;
};
