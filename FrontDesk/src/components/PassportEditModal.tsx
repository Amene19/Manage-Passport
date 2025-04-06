import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Passport {
  id: number;
  passportId: string;
  scanType: string;
  status: string;
  processedAt: string;
  processedBy: string;
  categories: Category[];
  categoryNames?: string[];
  missingRequirement?: string;
}

interface PassportEditModalProps {
  passport: Passport;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (passport: any) => void;
}

const PassportEditModal: React.FC<PassportEditModalProps> = ({
  passport,
  categories,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    id: passport.id,
    passportId: passport.passportId,
    scanType: passport.scanType,
    status: passport.status,
    processedAt: format(new Date(passport.processedAt), "yyyy-MM-dd'T'HH:mm"),
    processedBy: passport.processedBy,
    categories: passport.categories.map(c => c.id),
    missingRequirement: passport.missingRequirement || ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedValues: number[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(parseInt(options[i].value));
      }
    }
    
    setFormData(prev => ({ ...prev, categories: selectedValues }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Edit Passport
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Passport ID
                      </label>
                      <input
                        type="text"
                        name="passportId"
                        value={formData.passportId}
                        readOnly
                        className="mt-1 p-2 bg-gray-100 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Passport ID cannot be changed
                      </p>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="A">Approved</option>
                        <option value="B">Rejected</option>
                        <option value="C">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="processedAt" className="block text-sm font-medium text-gray-700">
                        Processed At
                      </label>
                      <input
                        type="datetime-local"
                        id="processedAt"
                        name="processedAt"
                        value={formData.processedAt}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="categories" className="block text-sm font-medium text-gray-700">
                        Categories
                      </label>
                      <select
                        id="categories"
                        name="categories"
                        multiple
                        value={formData.categories.map(c => c.toString())}
                        onChange={handleCategoryChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        size={4}
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Hold Ctrl (or Cmd) to select multiple categories
                      </p>
                    </div>

                    <div>
                      <label htmlFor="missingRequirement" className="block text-sm font-medium text-gray-700">
                        Missing Requirement
                      </label>
                      <select
                        id="missingRequirement"
                        name="missingRequirement"
                        value={formData.missingRequirement}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">None</option>
                        <option value="B1">B1 - Missing Documents</option>
                        <option value="B2">B2 - Invalid Documents</option>
                        <option value="B3">B3 - Additional Info Required</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PassportEditModal; 