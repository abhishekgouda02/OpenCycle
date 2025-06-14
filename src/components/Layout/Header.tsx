import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Recycle, User, LogOut, Plus, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../lib/supabase';

const Header: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 transition-colors">
            <Recycle className="h-8 w-8" />
            <span className="text-xl font-bold">OpenCycle</span>
          </Link>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search items..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/items/new"
                  className="flex items-center space-x-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Item</span>
                </Link>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-teal-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-teal-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="text-gray-700 hover:text-teal-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;