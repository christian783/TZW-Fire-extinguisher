import { Navigate, Outlet, useLocation } from "react-router-dom";

import { Role } from "../types";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  roles?: Role[];
};

const ProtectedRoute = ({ roles = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.some((role) => hasRole(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
