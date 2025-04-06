import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

interface Passport {
  id: number;
  passportId: string;
  scanType: string;
  status: string;
  processedAt: string;
  processedBy: string;
  categoryNames?: string[];
  missingRequirement?: string;
}

const History: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [history, setHistory] = useState<Passport[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<Passport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, [selectedDate]);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.api.callApi('/stats/history', 'GET', { date: selectedDate });
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];
    
    // Filter by search term
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(item => 
        item.passportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.processedBy.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredHistory(filtered);
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

  const formatStatus = (status: string) => {
    switch (status) {
      case 'A': return 'Approved';
      case 'B': return 'Rejected';
      case 'C': return 'Pending';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Passport Processing History</h2>
        <div className="flex items-center space-x-4">
          <label htmlFor="date" className="text-sm font-medium text-gray-700">
            Select Date:
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
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="md:w-full">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search:
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by passport ID or processor name"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-10 sm:text-sm border-gray-300 rounded-md"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading history...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredHistory.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Passport ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categories
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Missing Requirements
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((entry, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entry.passportId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2">
                          {(entry.categoryNames || []).map((categoryName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {categoryName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {entry.missingRequirement ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {formatMissingRequirement(entry.missingRequirement)}
                          </span>
                        ) : (
                          <span className="text-gray-500">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          entry.status === 'A'
                            ? 'bg-green-100 text-green-800'
                            : entry.status === 'B'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formatStatus(entry.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.processedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(entry.processedAt), 'MMM d, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center p-12 text-gray-500">
                No passport history found for the selected criteria.
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="text-right text-sm text-gray-500">
        Showing {filteredHistory.length} of {history.length} entries
      </div>
    </div>
  );
};

export default History; 