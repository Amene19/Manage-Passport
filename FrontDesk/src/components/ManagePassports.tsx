import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { passportService } from '../services/api';

interface Passport {
  id: string;
  applicantName: string;
  applicantId: string;
  category: string;
  status: string;
  missingRequirements: string[];
  processedAt: string;
  processedBy: string;
}

// Dummy data to use if the API fails
const DUMMY_PASSPORTS: Passport[] = [
  {
    id: "P12345",
    applicantName: "John Doe",
    applicantId: "ID12345",
    category: "Regular",
    status: "approved",
    missingRequirements: [],
    processedAt: "2023-03-15T10:30:00Z",
    processedBy: "admin"
  },
  {
    id: "P12346",
    applicantName: "Jane Smith",
    applicantId: "ID12346",
    category: "Expedited",
    status: "pending",
    missingRequirements: ["Photo", "Birth Certificate"],
    processedAt: "2023-03-16T14:20:00Z",
    processedBy: "worker1"
  },
  {
    id: "P12347",
    applicantName: "Bob Johnson",
    applicantId: "ID12347",
    category: "Regular",
    status: "rejected",
    missingRequirements: ["ID Verification", "Application Fee"],
    processedAt: "2023-03-17T09:15:00Z",
    processedBy: "worker2"
  },
  {
    id: "P12348",
    applicantName: "Alice Williams",
    applicantId: "ID12348",
    category: "Expedited",
    status: "approved",
    missingRequirements: [],
    processedAt: "2023-03-18T11:45:00Z",
    processedBy: "admin"
  },
  {
    id: "P12349",
    applicantName: "Charlie Brown",
    applicantId: "ID12349",
    category: "Regular",
    status: "pending",
    missingRequirements: ["Signature"],
    processedAt: "2023-03-19T16:30:00Z",
    processedBy: "worker1"
  }
];

const ManagePassports: React.FC = () => {
  const { user } = useAuth();
  const [passports, setPassports] = useState<Passport[]>(DUMMY_PASSPORTS); // Initialize with dummy data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPassport, setEditingPassport] = useState<Passport | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [usingDummyData, setUsingDummyData] = useState(true);  // Start with true since we initialized with dummy data

  // Fetch passports from the API
  useEffect(() => {
    const fetchPassports = async () => {
      try {
        setLoading(true);
        console.log('Attempting to fetch passports...');
        
        try {
          // Try to get data from the API
          const response = await passportService.getPassports();
          console.log('API Response:', response);
          
          // Check if we have valid data
          if (response && response.data && Array.isArray(response.data)) {
            console.log('Using API data:', response.data);
            setPassports(response.data);
            setUsingDummyData(false);
            setError(null);
          } else {
            // If response is not what we expect, use dummy data
            console.warn('API returned unexpected format, using dummy data');
            setPassports(DUMMY_PASSPORTS);
            setUsingDummyData(true);
            setError("Using offline data - Unexpected API response format");
          }
        } catch (apiError: any) {
          // If API fails, use dummy data instead
          console.warn('API call failed, using dummy data:', apiError.message);
          setPassports(DUMMY_PASSPORTS);
          setUsingDummyData(true);
          setError(`Using offline data - ${apiError.message || 'API connection failed'}`);
        }
      } catch (err: any) {
        console.error('Error fetching passports:', err);
        setPassports(DUMMY_PASSPORTS);
        setUsingDummyData(true);
        setError(`Using offline data - ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPassports();
  }, []);

  // Handle deleting a passport
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this passport record?')) {
      return;
    }

    try {
      if (!usingDummyData) {
        // Only call the API if we're not using dummy data
        await passportService.deletePassport(id);
      }
      // Always update the local state
      setPassports(passports.filter(passport => passport.id !== id));
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('Error deleting passport:', err);
      setError(err.error?.message || 'Failed to delete passport. Changes only applied locally.');
    }
  };

  // Handle editing a passport
  const handleEdit = (passport: Passport) => {
    setEditingPassport(passport);
  };

  // Handle saving edits
  const handleSaveEdit = async () => {
    if (!editingPassport) return;

    try {
      let updatedPassport = editingPassport;
      
      if (!usingDummyData) {
        // Only call the API if we're not using dummy data
        try {
          console.log('Sending update request for passport:', editingPassport);
          const response = await passportService.updatePassport(editingPassport.id, editingPassport);
          
          // Check if response has the expected structure
          if (response && response.data) {
            updatedPassport = response.data;
            console.log('Received updated passport:', updatedPassport);
          } else {
            throw new Error('Invalid response format from server');
          }
        } catch (apiError: any) {
          console.error('API update failed, applying changes locally only:', apiError);
          setError(apiError.error?.message || 'Failed to update passport on server. Changes only applied locally.');
        }
      }
      
      // Always update the local state
      setPassports(passports.map(p => 
        p.id === editingPassport.id ? updatedPassport : p
      ));
      
      // Clear the editing state and any previous errors
      setEditingPassport(null);
      setError(null);
    } catch (err: any) {
      console.error('Error updating passport:', err);
      setError(err.error?.message || 'Failed to update passport. Changes only applied locally.');
    }
  };

  // Handle canceling edits
  const handleCancelEdit = () => {
    setEditingPassport(null);
  };

  // Handle input changes in edit mode
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingPassport) return;
    
    const { name, value } = e.target;
    setEditingPassport({
      ...editingPassport,
      [name]: value
    });
  };

  // Filter passports based on search term and status filter
  const filteredPassports = passports.filter(passport => {
    const matchesSearch = 
      passport.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passport.applicantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      passport.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      passport.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Passports</h1>
      
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, ID, or passport number..."
            className="w-full p-2 border border-gray-300 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
        
        <div className="flex-none">
          <select
            className="p-2 border border-gray-300 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      
      {filteredPassports.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No passport records found matching your criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Passport ID</th>
                <th className="py-2 px-4 border-b text-left">Applicant</th>
                <th className="py-2 px-4 border-b text-left">Category</th>
                <th className="py-2 px-4 border-b text-left">Status</th>
                <th className="py-2 px-4 border-b text-left">Processed At</th>
                <th className="py-2 px-4 border-b text-left">Processed By</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPassports.map(passport => (
                <tr key={passport.id} className="hover:bg-gray-50">
                  {editingPassport && editingPassport.id === passport.id ? (
                    // Edit mode
                    <>
                      <td className="py-2 px-4 border-b">{passport.id}</td>
                      <td className="py-2 px-4 border-b">
                        <input 
                          type="text" 
                          name="applicantName" 
                          value={editingPassport.applicantName} 
                          onChange={handleEditChange}
                          className="w-full p-1 border border-gray-300 rounded" 
                        />
                      </td>
                      <td className="py-2 px-4 border-b">
                        <input 
                          type="text" 
                          name="category" 
                          value={editingPassport.category} 
                          onChange={handleEditChange}
                          className="w-full p-1 border border-gray-300 rounded" 
                        />
                      </td>
                      <td className="py-2 px-4 border-b">
                        <select 
                          name="status" 
                          value={editingPassport.status} 
                          onChange={handleEditChange}
                          className="w-full p-1 border border-gray-300 rounded"
                        >
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="pending">Pending</option>
                        </select>
                      </td>
                      <td className="py-2 px-4 border-b">{format(new Date(passport.processedAt), 'PPP')}</td>
                      <td className="py-2 px-4 border-b">{passport.processedBy}</td>
                      <td className="py-2 px-4 border-b">
                        <div className="flex space-x-2">
                          <button 
                            onClick={handleSaveEdit} 
                            className="text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-sm"
                          >
                            Save
                          </button>
                          <button 
                            onClick={handleCancelEdit} 
                            className="text-white bg-gray-500 hover:bg-gray-600 px-2 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // View mode
                    <>
                      <td className="py-2 px-4 border-b">{passport.id}</td>
                      <td className="py-2 px-4 border-b">{passport.applicantName}</td>
                      <td className="py-2 px-4 border-b">{passport.category}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          passport.status === 'approved' ? 'bg-green-100 text-green-800' :
                          passport.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {passport.status.charAt(0).toUpperCase() + passport.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">{format(new Date(passport.processedAt), 'PPP')}</td>
                      <td className="py-2 px-4 border-b">{passport.processedBy}</td>
                      <td className="py-2 px-4 border-b">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(passport)} 
                            className="text-white bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(passport.id)} 
                            className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManagePassports; 