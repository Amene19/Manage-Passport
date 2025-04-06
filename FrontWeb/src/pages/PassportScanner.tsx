import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import passportService, { PassportData, ScanType, PassportStatus, HistoryEntry } from '../services/api';
import CategorySelector, { Category } from '../components/CategorySelector';
import ConfirmationDialog from '../components/ConfirmationDialog';

const PassportScanner: React.FC = () => {
  const [passportId, setPassportId] = useState('');
  const [scanType] = useState<ScanType>('Inscan'); // Fixed to Inscan only
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [missingRequirement, setMissingRequirement] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentWorker, setCurrentWorker] = useState<string>('');
  const [scannedPassports, setScannedPassports] = useState<Set<string>>(new Set());
  const [todayPassports, setTodayPassports] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Show PDF button only if there's a missing requirement selected
    setShowPdfButton(missingRequirement !== '');
  }, [missingRequirement]);

  const loadInitialData = async () => {
    try {
      const [categoriesData, workerData, historyData] = await Promise.all([
        passportService.getCategories(),
        passportService.getCurrentWorker(),
        passportService.getHistoryByDate(format(new Date(), 'yyyy-MM-dd')),
      ]);
      setCategories(categoriesData);
      setCurrentWorker(workerData.name);
      setTodayPassports(historyData);
    } catch (err) {
      setError('Failed to load initial data. Please try again later.');
    }
  };

  const handleScanPassport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await passportService.scanPassport(scanType);
      
      // Check if passport has already been scanned for this type
      const passportKey = `${response.passportId}-${scanType}`;
      if (scannedPassports.has(passportKey)) {
        setError(`This passport has already been ${scanType.toLowerCase()}ed.`);
        return;
      }
      
      setPassportId(response.passportId);
      setScannedPassports(prev => new Set(prev).add(passportKey));
    } catch (err) {
      setError('Failed to scan passport. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = {
        passportId,
        scanType,
        categories: selectedCategory ? [selectedCategory.id] : [],
        ...(missingRequirement && { missingRequirement }),
      };
      await passportService.submitPassport(data);
      
      // Refresh the today's passports list
      const updatedHistory = await passportService.getHistoryByDate(format(new Date(), 'yyyy-MM-dd'));
      setTodayPassports(updatedHistory);
      
      // Reset form
      setPassportId('');
      setSelectedCategory(null);
      setMissingRequirement('');
      setShowPdfButton(false);
      setShowConfirmation(false);
      alert('Passport processed successfully!');
    } catch (err) {
      setError('Failed to submit passport data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    // TODO: Implement PDF export functionality
    alert('PDF export functionality will be implemented here');
  };

  return (
    <div className="flex gap-8">
      {/* Today's Passports - Left Column */}
      <div className="w-1/2">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Today's Passports</h2>
          <div className="overflow-x-auto">
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
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayPassports.map((passport, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {passport.passportId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {(passport.categoryNames || []).map((categoryName, idx) => (
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
                      {passport.missingRequirement ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {passport.missingRequirement === 'B1' ? 'Missing Documents' : 
                           passport.missingRequirement === 'B2' ? 'Invalid Documents' : 
                           passport.missingRequirement === 'B3' ? 'Additional Info Required' : 
                           passport.missingRequirement}
                        </span>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(passport.processedAt), 'HH:mm')}
                    </td>
                  </tr>
                ))}
                {todayPassports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No passports processed today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Process Passport - Right Column */}
      <div className="w-1/2">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Process Passport</h2>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Passport ID
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  value={passportId}
                  readOnly
                  className="input flex-1"
                  placeholder="Scan passport to get ID"
                />
                <button
                  onClick={handleScanPassport}
                  className="btn btn-primary ml-3"
                  disabled={loading}
                >
                  {loading ? 'Scanning...' : 'Scan Passport'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Category
              </label>
              <div className="mt-1">
                <select
                  value={selectedCategory?.id || ''}
                  onChange={(e) => {
                    const catId = parseInt(e.target.value);
                    const cat = categories.find(c => c.id === catId) || null;
                    setSelectedCategory(cat);
                  }}
                  className="input w-full"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Missing Requirements
              </label>
              <div className="mt-1">
                <select
                  value={missingRequirement}
                  onChange={(e) => setMissingRequirement(e.target.value)}
                  className="input"
                >
                  <option value="">No Missing Requirements</option>
                  <option value="B1">B1 - Missing Document</option>
                  <option value="B2">B2 - Invalid Document</option>
                  <option value="B3">B3 - Additional Information Required</option>
                </select>
              </div>
            </div>

            {showPdfButton && (
              <div className="flex justify-end">
                <button
                  onClick={handleExportPdf}
                  className="btn btn-secondary mr-3"
                >
                  Export PDF
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={!passportId || !selectedCategory || loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>

      {showConfirmation && (
        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleConfirmSubmit}
          passportId={passportId}
          scanType={scanType}
          categories={selectedCategory ? [selectedCategory] : []}
          missingRequirement={missingRequirement}
        />
      )}
    </div>
  );
};

export default PassportScanner; 