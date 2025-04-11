import { Request } from 'express';

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  created_at: Date;
}

export interface Category {
  id: number;
  name: string;
  created_at: Date;
}

export interface Passport {
  id: number;
  passport_id: string;
  scan_type: 'Inscan' | 'Outscan';
  status: 'Processing' | 'Completed' | 'Rejected';
  processed_by: number;
  processed_at: Date;
  categories?: string;
  missing_requirement?: string;
  processed_by_name?: string;
}

export interface MissingRequirement {
  id: number;
  passport_id: number;
  requirement_type: string;
  created_at: Date;
}

export interface DailyStats {
  total: number;
  categories: Array<{
    name: string;
    count: number;
  }>;
  scanTypes: Array<{
    scan_type: string;
    count: number;
  }>;
  missingRequirements: Array<{
    requirement_type: string;
    count: number;
  }>;
  workerPerformance: Array<{
    name: string;
    total_processed: number;
    inscanned: number;
    outscanned: number;
  }>;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    name: string;
    role: string;
  };
} 