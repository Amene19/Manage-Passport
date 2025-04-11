import express from 'express';
import sql from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all passports
router.get('/', async (req, res) => {
  try {
    const passports = await sql`
      SELECT p.*, u.name as processed_by_name,
        string_agg(DISTINCT c.name, ',') as categories,
        mr.requirement_type as missing_requirement
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      GROUP BY p.id, u.name, mr.requirement_type
      ORDER BY p.processed_at DESC
    `;

    res.json(passports);
  } catch (error) {
    console.error('Get passports error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get passport by ID
router.get('/:id', async (req, res) => {
  try {
    const passports = await sql`
      SELECT p.*, u.name as processed_by_name,
        string_agg(DISTINCT c.name, ',') as categories,
        mr.requirement_type as missing_requirement
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE p.id = ${req.params.id}
      GROUP BY p.id, u.name, mr.requirement_type
    `;

    const passport = passports[0];

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
    await sql.begin(async (txn) => {
      // Insert passport
      const result = await txn`
        INSERT INTO passports (passport_id, scan_type, status, processed_by) 
        VALUES (${passportId}, ${scanType}, ${scanType === 'Inscan' ? 'Processing' : 'Completed'}, ${userId})
        RETURNING id
      `;

      const newPassportId = result[0].id;

      // Insert categories
      if (categories && categories.length > 0) {
        for (const categoryId of categories) {
          await txn`
            INSERT INTO passport_categories (passport_id, category_id) 
            VALUES (${newPassportId}, ${categoryId})
          `;
        }
      }

      // Insert missing requirement if exists
      if (missingRequirement) {
        await txn`
          INSERT INTO missing_requirements (passport_id, requirement_type) 
          VALUES (${newPassportId}, ${missingRequirement})
        `;
      }
    });

    res.status(201).json({ 
      message: 'Passport processed successfully', 
      passportId 
    });
  } catch (error) {
    console.error('Submit passport error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get passport history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const date = req.query.date as string;
    
    const passports = await sql`
      SELECT p.*, u.name as processed_by_name,
        string_agg(DISTINCT c.name, ',') as categories,
        mr.requirement_type as missing_requirement
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE DATE(p.processed_at) = ${date}
      GROUP BY p.id, u.name, mr.requirement_type
      ORDER BY p.processed_at DESC
    `;
    
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
    await sql.begin(async (txn) => {
      // Update passport basic info
      await txn`
        UPDATE passports 
        SET applicant_name = ${applicantName}, 
            applicant_id = ${applicantId}, 
            status = ${status}, 
            processed_by = ${userId},
            processed_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;

      // Update category
      if (category) {
        // First delete existing categories
        await txn`
          DELETE FROM passport_categories 
          WHERE passport_id = ${id}
        `;

        // Then insert new category
        await txn`
          INSERT INTO passport_categories (passport_id, category_id) 
          VALUES (${id}, ${category})
        `;
      }

      // Update missing requirements
      if (missingRequirements) {
        // First delete existing missing requirements
        await txn`
          DELETE FROM missing_requirements 
          WHERE passport_id = ${id}
        `;

        // Then insert new missing requirements
        if (Array.isArray(missingRequirements) && missingRequirements.length > 0) {
          for (const req of missingRequirements) {
            await txn`
              INSERT INTO missing_requirements (passport_id, requirement_type) 
              VALUES (${id}, ${req})
            `;
          }
        }
      }
    });

    // Fetch updated passport
    const updatedPassport = await sql`
      SELECT p.*, u.name as processed_by_name,
        string_agg(DISTINCT c.name, ',') as categories,
        string_agg(DISTINCT mr.requirement_type, ',') as missing_requirements
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE p.id = ${id}
      GROUP BY p.id, u.name
    `;

    res.json(updatedPassport[0]);
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
    await sql.begin(async (txn) => {
      // Delete passport categories
      await txn`
        DELETE FROM passport_categories 
        WHERE passport_id = ${id}
      `;
      
      // Delete missing requirements
      await txn`
        DELETE FROM missing_requirements 
        WHERE passport_id = ${id}
      `;
      
      // Delete passport
      await txn`
        DELETE FROM passports 
        WHERE id = ${id}
      `;
    });

    res.json({ message: 'Passport deleted successfully' });
  } catch (error) {
    console.error('Delete passport error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 