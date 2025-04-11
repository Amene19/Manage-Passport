import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import sql from '../config/database';
import dotenv from 'dotenv';
import { User } from '../types';
import { generateToken, verifyToken } from '../utils/jwt';

dotenv.config();

const router = express.Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    // Get user from database
    const users = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;

    const user = users[0];
    console.log('User found:', user ? { id: user.id, username: user.username, role: user.role } : 'Not found');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password verification:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const secret: Secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const decoded = verifyToken(token);
      const userId = decoded.userId;

      const users = await sql`
        SELECT id, username, name, role FROM users WHERE id = ${userId}
      `;

      const user = users[0];

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;