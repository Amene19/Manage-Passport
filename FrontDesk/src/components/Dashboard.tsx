import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface StatsData {
  totalPassports: number;
  inscannedPassports: number;
  outscannedPassports: number;
  pendingOutscan: number;
  categoryA: number;
  categoryB: number;
  categoryC: number;
  categoryD: number;
  missingDocuments: number;
  invalidDocuments: number;
  additionalInfoRequired: number;
  date: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadStats();
  }, [selectedDate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await window.api.callApi('/stats/daily', 'GET', { date: selectedDate });
      setStats(response);
    } catch (err) {
      console.error('Failed to load stats:', err);
      setError('Failed to load statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const prepareCategoryData = () => {
    if (!stats) return [];
    
    const data = [
      { name: 'Category A', value: stats.categoryA || 0 },
      { name: 'Category B', value: stats.categoryB || 0 },
      { name: 'Category C', value: stats.categoryC || 0 },
      { name: 'Category D', value: stats.categoryD || 0 },
    ];

    console.log('Category Data:', {
      raw: stats,
      prepared: data
    });

    return data;
  };

  const prepareMissingReqData = () => {
    if (!stats) return [];
    
    const data = [
      { name: 'Missing Docs', value: stats.missingDocuments || 0 },
      { name: 'Invalid Docs', value: stats.invalidDocuments || 0 },
      { name: 'Additional Info', value: stats.additionalInfoRequired || 0 },
    ];

    console.log('Missing Requirements Data:', {
      raw: stats,
      prepared: data
    });

    return data;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    console.log('Stats updated:', stats);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
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

      {stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Processed</h3>
              <p className="text-3xl font-bold text-indigo-600">{stats.totalPassports || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inscanned Today</h3>
              <p className="text-3xl font-bold text-green-600">{stats.inscannedPassports || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Processing</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingOutscan || 0}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareCategoryData()}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {prepareCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Missing Requirements Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Requirements</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareMissingReqData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#FF5252" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 