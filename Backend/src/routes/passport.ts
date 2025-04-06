import express from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all passports
router.get('/', async (req, res) => {
  try {
    const [passports] = await pool.execute(`
      SELECT p.*, u.name as processed_by_name,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        mr.requirement_type as missing_requirement
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      GROUP BY p.id
      ORDER BY p.processed_at DESC
    `);

    res.json(passports);
  } catch (error) {
    console.error('Get passports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get passport by ID
router.get('/:id', async (req, res) => {
  try {
    const [passports] = await pool.execute(
      `SELECT p.*, u.name as processed_by_name,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        mr.requirement_type as missing_requirement
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE p.id = ?
      GROUP BY p.id`,
      [req.params.id]
    );

    const passport = (passports as any[])[0];

    if (!passport) {
      return res.status(404).json({ message: 'Passport not found' });
    }

    res.json(passport);
  } catch (error) {
    console.error('Get passport error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Scan passport - generates a new passport ID
router.post('/scan', authenticateToken, async (req, res) => {
  try {
    const { scanType } = req.body;
    const randomId = Math.random().toString(36).substring(2, 11).toUpperCase();
    const passportId = `ESP-${randomId}`;
    
    res.json({ passportId, scanType });
  } catch (error) {
    console.error('Scan passport error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit passport data
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { passportId, scanType, categories, missingRequirement } = req.body;
    const userId = (req as any).user.userId;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert passport
      const [result] = await connection.execute(
        'INSERT INTO passports (passport_id, scan_type, status, processed_by) VALUES (?, ?, ?, ?)',
        [passportId, scanType, scanType === 'Inscan' ? 'Processing' : 'Completed', userId]
      );

      const newPassportId = (result as any).insertId;

      // Insert categories
      if (categories && categories.length > 0) {
        const categoryValues = categories.map((categoryId: number) => [newPassportId, categoryId]);
        await connection.query(
          'INSERT INTO passport_categories (passport_id, category_id) VALUES ?',
          [categoryValues]
        );
      }

      // Insert missing requirement if exists
      if (missingRequirement) {
        await connection.execute(
          'INSERT INTO missing_requirements (passport_id, requirement_type) VALUES (?, ?)',
          [newPassportId, missingRequirement]
        );
      }

      await connection.commit();

      res.status(201).json({ 
        message: 'Passport processed successfully', 
        passportId: newPassportId 
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Submit passport error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get passport history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const query = `
      SELECT p.*, u.name as processed_by_name,
        GROUP_CONCAT(DISTINCT c.name) as categories,
        mr.requirement_type as missing_requirement
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE DATE(p.processed_at) = ?
      GROUP BY p.id
      ORDER BY p.processed_at DESC
    `;

    const [passports] = await pool.execute(query, [date]);
    res.json(passports);
  } catch (error) {
    console.error('Get passport history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update passport
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { applicantName, applicantId, category, status, missingRequirements } = req.body;
    const userId = (req as any).user.userId;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update passport basic info
      await connection.execute(
        `UPDATE passports 
         SET applicant_name = ?, 
             applicant_id = ?, 
             status = ?, 
             processed_by = ?,
             processed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [applicantName, applicantId, status, userId, id]
      );

      // Update category
      if (category) {
        // First delete existing categories
        await connection.execute(
          'DELETE FROM passport_categories WHERE passport_id = ?',
          [id]
        );

        // Then insert new category
        await connection.execute(
          'INSERT INTO passport_categories (passport_id, category_id) VALUES (?, ?)',
          [id, category]
        );
      }

      // Update missing requirements
      if (missingRequirements) {
        // First delete existing missing requirements
        await connection.execute(
          'DELETE FROM missing_requirements WHERE passport_id = ?',
          [id]
        );

        // Then insert new missing requirements
        if (Array.isArray(missingRequirements) && missingRequirements.length > 0) {
          const requirementValues = missingRequirements.map(req => [id, req]);
          await connection.query(
            'INSERT INTO missing_requirements (passport_id, requirement_type) VALUES ?',
            [requirementValues]
          );
        }
      }

      await connection.commit();

      // Fetch updated passport
      const [updatedPassport] = await connection.execute(
        `SELECT p.*, u.name as processed_by_name,
          GROUP_CONCAT(DISTINCT c.name) as categories,
          GROUP_CONCAT(DISTINCT mr.requirement_type) as missing_requirements
        FROM passports p
        LEFT JOIN users u ON p.processed_by = u.id
        LEFT JOIN passport_categories pc ON p.id = pc.passport_id
        LEFT JOIN categories c ON pc.category_id = c.id
        LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
        WHERE p.id = ?
        GROUP BY p.id`,
        [id]
      );

      res.json((updatedPassport as any[])[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update passport error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete passport
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete related records first
      await connection.execute(
        'DELETE FROM passport_categories WHERE passport_id = ?',
        [id]
      );

      await connection.execute(
        'DELETE FROM missing_requirements WHERE passport_id = ?',
        [id]
      );

      // Finally delete the passport
      await connection.execute(
        'DELETE FROM passports WHERE id = ?',
        [id]
      );

      await connection.commit();
      res.json({ message: 'Passport deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete passport error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 