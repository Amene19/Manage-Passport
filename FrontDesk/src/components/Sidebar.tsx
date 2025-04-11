import React from 'react';
import { NavLink } from 'react-router-dom';

// Define navigation items
const navigation = [
  { name: 'Dashboard', href: '/', icon: 'chart-bar' },
  { name: 'Passport Management', href: '/passports', icon: 'document-text' },
  { name: 'History', href: '/history', icon: 'clock' },
];

const Sidebar: React.FC = () => {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col h-0 flex-1 bg-gray-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-white text-xl font-bold">Passport Admin</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-gray-800 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => 
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <span className="mr-3 h-6 w-6 flex items-center justify-center">
                    <i className={`fas fa-${item.icon}`}></i>
                  </span>
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 