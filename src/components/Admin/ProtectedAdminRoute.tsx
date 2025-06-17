import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // In a real implementation, you'd check if the user has admin privileges
  // For now, we'll allow any authenticated user to access the admin panel
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // You could add additional admin role checking here:
  // const isAdmin = user.user_metadata?.role === 'admin' || 
  //                 user.email === 'admin@opencycle.com';
  // if (!isAdmin) {
  //   return <Navigate to="/" replace />;
  // }

  return <>{children}</>;
};

export default ProtectedAdminRoute;