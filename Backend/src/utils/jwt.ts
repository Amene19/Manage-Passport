import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '../types';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

export const generateToken = (user: User): string => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}; 