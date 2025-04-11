import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import PassportManagement from './PassportManagement';
import History from './History';
import Login from './Login';
import Sidebar from './Sidebar';
import Header from './Header';
import PrivateRoute from './PrivateRoute';
import Unauthorized from './Unauthorized';
import { useAuth } from '../contexts/AuthContext';

const App: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {isAuthenticated && (
        <Sidebar />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {isAuthenticated && (
          <Header />
        )}
        
        <main className="flex-1 overflow-y-auto p-4">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
            />
            
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            
            {/* Admin-only routes */}
            <Route element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route path="/passports" element={<PassportManagement />} />
              <Route path="/history" element={<History />} />
            </Route>
            
            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App; 