// Type declarations for modules without type definitions

declare module 'express';
declare module 'cors';
declare module 'bcryptjs';
declare module 'jsonwebtoken';

// Declare global variables like process
declare var process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    DATABASE_URL?: string;
    DB_HOST?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
    DB_PORT?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
  };
  exit: (code?: number) => never;
};

// Declare Node.js globals
declare var __dirname: string;
declare var __filename: string;

// Declare Node.js modules
declare module 'fs' {
  export function readFileSync(path: string, options: { encoding: string }): string;
  export function readFileSync(path: string): Buffer;
}

declare module 'path' {
  export function join(...paths: string[]): string;
} 