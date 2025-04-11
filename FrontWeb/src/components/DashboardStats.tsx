import React from 'react';
import { StatsData } from '../services/api';
import {
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  stats: StatsData;
}

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color}`}>{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  // Safely get the total categories with fallback to 0
  const totalCategories = stats.categoriesStats 
    ? Object.values(stats.categoriesStats).reduce(
        (sum: number, count: number) => sum + count,
        0
      )
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Today's Overview</h2>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Passports Scanned"
          value={stats.totalScanned || stats.totalPassports || 0}
          icon={<DocumentCheckIcon className="h-6 w-6" />}
          color="text-green-600"
        />
        <StatCard
          title="Categories Processed"
          value={totalCategories}
          icon={<TagIcon className="h-6 w-6" />}
          color="text-blue-600"
        />
        <StatCard
          title="Pending Requirements"
          value={stats.pendingRequirements || (stats.missingDocuments + stats.invalidDocuments + stats.additionalInfoRequired) || 0}
          icon={<ExclamationTriangleIcon className="h-6 w-6" />}
          color="text-yellow-600"
        />
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Categories Breakdown
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.categoriesStats && Object.entries(stats.categoriesStats).map(([category, count]) => (
              <div
                key={category}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <span className="text-sm font-medium text-gray-600">
                  {category}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {count.toString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats; 