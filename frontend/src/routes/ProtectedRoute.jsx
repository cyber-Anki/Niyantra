import { Navigate } from "react-router-dom";

export const DRMRouteGuard = ({ user, children }) => {
  if (!user || user.role !== "DRM") {
    // Redirect non-DRM users trying to access System 2
    return <Navigate replace to="/dashboard" />;
  }
  return children;
};
