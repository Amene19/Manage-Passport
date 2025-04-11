import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-2">Unauthorized Access</h1>
          <svg 
            className="w-24 h-24 mx-auto text-red-500 mb-4" 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
          
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Link 
              to="/dashboard" 
              className="btn btn-primary"
            >
              Return to Dashboard
            </Link>
            
            <button 
              onClick={logout} 
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 