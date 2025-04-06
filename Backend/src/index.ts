import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import passportRoutes from './routes/passport';
import categoryRoutes from './routes/category';
import statsRoutes from './routes/stats';
import { authenticateToken } from './middleware/auth';
import pool from './config/database';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/passports', authenticateToken, passportRoutes);
app.use('/api/categories', authenticateToken, categoryRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
}); 