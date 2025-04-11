import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { passportService, StatsData, authService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadStats();
  }, []);

  const checkAuthAndLoadStats = async () => {
    try {
      // First check if we're authenticated
      await authService.getCurrentUser();
      // If we are, load the stats
      const statsData = await passportService.getDailyStats();
      setStats(statsData);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // If unauthorized, redirect to login
        navigate('/login');
      } else {
        setError('Failed to load statistics. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!stats) return [];
    
    return [
      { name: 'Category A', count: stats.categoryA },
      { name: 'Category B', count: stats.categoryB },
      { name: 'Category C', count: stats.categoryC },
      { name: 'Category D', count: stats.categoryD },
    ];
  };

  const prepareMissingReqData = () => {
    if (!stats) return [];
    
    return [
      { name: 'Missing Docs', count: stats.missingDocuments },
      { name: 'Invalid Docs', count: stats.invalidDocuments },
      { name: 'Additional Info', count: stats.additionalInfoRequired },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading today's statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Today's Passport Processing</h2>
        <p className="text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {stats && (
        <>
          {/* Scan Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Processed</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.totalPassports}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inscanned</h3>
              <p className="text-3xl font-bold text-green-600">{stats.inscannedPassports}</p>
              <p className="text-sm text-gray-500 mt-1">New Passports</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingOutscan}</p>
              <p className="text-sm text-gray-500 mt-1">In Process</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareChartData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#4f46e5" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Requirements</h3>
              <div className="h-64">
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
                    <Bar dataKey="count" fill="#ef4444" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Category A</h3>
              <p className="text-3xl font-bold text-green-600">{stats.categoryA}</p>
              <p className="text-sm text-gray-500 mt-1">Tourist & Family Visas</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Category B</h3>
              <p className="text-3xl font-bold text-yellow-600">{stats.categoryB}</p>
              <p className="text-sm text-gray-500 mt-1">Work & Student Visas</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Category C</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.categoryC}</p>
              <p className="text-sm text-gray-500 mt-1">Business & Medical Visas</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Category D</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.categoryD}</p>
              <p className="text-sm text-gray-500 mt-1">Special & Official Visas</p>
            </div>
          </div>

          {/* Missing Requirements */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Missing Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Missing Documents</p>
                <p className="text-2xl font-semibold text-red-600">{stats.missingDocuments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invalid Documents</p>
                <p className="text-2xl font-semibold text-red-600">{stats.invalidDocuments}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Additional Info Required</p>
                <p className="text-2xl font-semibold text-red-600">{stats.additionalInfoRequired}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard; 