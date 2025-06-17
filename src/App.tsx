import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Layout/Header';
import HomePage from './pages/HomePage';
import ItemDetailPage from './pages/ItemDetailPage';
import AuthForm from './components/Auth/AuthForm';
import Dashboard from './components/Dashboard/Dashboard';
import ItemForm from './components/Items/ItemForm';
import UserProfile from './components/Profile/UserProfile';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './components/Admin/AdminDashboard';
import UserManagement from './components/Admin/UserManagement';
import ItemManagement from './components/Admin/ItemManagement';
import ReportsManagement from './components/Admin/ReportsManagement';
import Analytics from './components/Admin/Analytics';
import AdminSettings from './components/Admin/AdminSettings';
import ProtectedAdminRoute from './components/Admin/ProtectedAdminRoute';
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <HomePage />
        </div>
      } />
      <Route path="/item/:id" element={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <ItemDetailPage />
        </div>
      } />
      <Route path="/auth" element={<Auth />} />

      {/* Protected User Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Dashboard />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/items/new" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <ItemForm />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <UserProfile />
          </div>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminLayout />
        </ProtectedAdminRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="items" element={<ItemManagement />} />
        <Route path="reports" element={<ReportsManagement />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
};

const Auth: React.FC = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <AuthForm />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;