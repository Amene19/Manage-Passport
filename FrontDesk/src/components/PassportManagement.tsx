import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import PassportEditModal from './PassportEditModal';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Passport {
  id: number;
  passportId: string;
  scanType: 'Inscan';
  status: string;
  processedAt: string;
  processedBy: string;
  categories: Category[];
  categoryNames?: string[];
  missingRequirement?: string;
}

const PassportManagement: React.FC = () => {
  const [passports, setPassports] = useState<Passport[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<Passport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPassport, setCurrentPassport] = useState<Passport | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadPassports();
    loadCategories();
  }, [selectedDate]);

  useEffect(() => {
    // Filter passports based on search term
    if (searchTerm.trim() === '') {
      setFilteredPassports(passports);
    } else {
      const filtered = passports.filter(passport => 
        passport.passportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        passport.processedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPassports(filtered);
    }
  }, [searchTerm, passports]);

  const loadPassports = async () => {
    try {
      setLoading(true);
      const data = await window.api.callApi(`/stats/history?date=${selectedDate}`, 'GET');
      setPassports(data);
      setFilteredPassports(data);
    } catch (err) {
      console.error('Failed to load passports:', err);
      setError('Failed to load passport data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await window.api.callApi('/categories', 'GET');
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleEditClick = (passport: Passport) => {
    setCurrentPassport(passport);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this passport record?')) {
      return;
    }
    
    try {
      await window.api.callApi(`/passports/${id}`, 'DELETE');
      // Remove from local state
      setPassports(prev => prev.filter(p => p.id !== id));
      alert('Passport deleted successfully');
    } catch (err) {
      console.error('Failed to delete passport:', err);
      setError('Failed to delete passport. Please try again later.');
    }
  };

  const handleSavePassport = async (editedPassport: any) => {
    try {
      await window.api.callApi(`/passports/${editedPassport.id}`, 'PUT', editedPassport);
      // Update in local state
      setPassports(prev => 
        prev.map(p => p.id === editedPassport.id ? {
          ...p,
          ...editedPassport,
          processedAt: new Date(editedPassport.processedAt).toISOString()
        } : p)
      );
      setIsEditModalOpen(false);
      alert('Passport updated successfully');
    } catch (err) {
      console.error('Failed to update passport:', err);
      setError('Failed to update passport. Please try again later.');
    }
  };

  const formatMissingRequirement = (code: string | undefined) => {
    if (!code) return 'None';
    
    switch (code) {
      case 'B1': return 'Missing Documents';
      case 'B2': return 'Invalid Documents';
      case 'B3': return 'Additional Info Required';
      default: return code;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading passports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Passport Management</h2>
        <div className="flex items-center space-x-4">
          <label htmlFor="date" className="text-sm font-medium text-gray-700">
            Date:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search passports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Showing {filteredPassports.length} of {passports.length} passports
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredPassports.length > 0 ? (
            filteredPassports.map((passport) => (
              <li key={passport.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-medium text-indigo-600 truncate">
                        {passport.passportId}
                      </p>
                      <p className="ml-2 flex-shrink-0 font-normal text-gray-500">
                        {format(new Date(passport.processedAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {passport.processedBy}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {passport.scanType}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 8a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                        </svg>
                        Status: {passport.status}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {passport.categoryNames?.map((category, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {category}
                        </span>
                      ))}
                      {passport.missingRequirement && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {formatMissingRequirement(passport.missingRequirement)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => handleEditClick(passport)}
                      className="mr-2 font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(passport.id)}
                      className="font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-4 text-center text-gray-500">
              No passport records found for the selected date.
            </li>
          )}
        </ul>
      </div>

      {isEditModalOpen && currentPassport && (
        <PassportEditModal
          passport={currentPassport}
          categories={categories}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSavePassport}
        />
      )}
    </div>
  );
};

export default PassportManagement; 