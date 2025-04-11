#!/bin/bash

# Script to install required type definitions during Render build process
cd Backend
npm install --no-save @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken

# Fix the category.ts route to include proper typings
cat > src/routes/category.ts << 'EOF'
import express, { Request, Response } from 'express';
import sql from '../config/database';

const router = express.Router();

// Get all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await sql`SELECT * FROM categories ORDER BY name`;
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get category by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const categories = await sql`
      SELECT * FROM categories WHERE id = ${req.params.id}
    `;

    const category = categories[0];

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new category
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const result = await sql`
      INSERT INTO categories (name) VALUES (${name})
      RETURNING id
    `;

    res.status(201).json({
      message: 'Category created successfully',
      id: result[0].id
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update category
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const result = await sql`
      UPDATE categories SET name = ${name} WHERE id = ${req.params.id}
    `;

    if (result.count === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete category
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await sql`
      DELETE FROM categories WHERE id = ${req.params.id}
    `;

    if (result.count === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
EOF

# Fix passport.ts to include proper typings
cat > src/routes/passport.ts << 'EOF'
import express, { Request, Response } from 'express';
import sql from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all passports
router.get('/', async (req: Request, res: Response) => {
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
router.get('/:id', async (req: Request, res: Response) => {
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
router.post('/scan', authenticateToken, async (req: Request, res: Response) => {
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
router.post('/submit', authenticateToken, async (req: Request, res: Response) => {
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
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
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
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
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
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
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
EOF

# Fix stats.ts to include proper typings
cat > src/routes/stats.ts << 'EOF'
import express, { Request, Response } from 'express';
import sql from '../config/database';

const router = express.Router();

// Get daily statistics
router.get('/daily', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    const stats = await sql`
      WITH category_counts AS (
        SELECT 
          c.name as category_name,
          COUNT(DISTINCT p.id) as count
        FROM passports p
        JOIN passport_categories pc ON p.id = pc.passport_id
        JOIN categories c ON pc.category_id = c.id
        WHERE DATE(p.processed_at) = ${date}
        GROUP BY c.name
      )
      SELECT 
        COUNT(*) as "totalPassports",
        SUM(CASE WHEN scan_type = 'Inscan' THEN 1 ELSE 0 END) as "inscannedPassports",
        SUM(CASE WHEN scan_type = 'Outscan' THEN 1 ELSE 0 END) as "outscannedPassports",
        SUM(CASE WHEN status = 'C' THEN 1 ELSE 0 END) as "pendingOutscan",
        COALESCE((SELECT count FROM category_counts WHERE category_name = 'A'), 0) as "categoryA",
        COALESCE((SELECT count FROM category_counts WHERE category_name = 'B'), 0) as "categoryB",
        COALESCE((SELECT count FROM category_counts WHERE category_name = 'C'), 0) as "categoryC",
        COALESCE((SELECT count FROM category_counts WHERE category_name = 'D'), 0) as "categoryD",
        COUNT(DISTINCT CASE WHEN mr.requirement_type = 'B1' THEN p.id END) as "missingDocuments",
        COUNT(DISTINCT CASE WHEN mr.requirement_type = 'B2' THEN p.id END) as "invalidDocuments",
        COUNT(DISTINCT CASE WHEN mr.requirement_type = 'B3' THEN p.id END) as "additionalInfoRequired"
      FROM passports p
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE DATE(p.processed_at) = ${date}
    `;

    const result = {
      ...stats[0],
      date
    };

    console.log('Daily stats for date:', date, result);
    res.json(result);
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get history by date
router.get('/history', async (req: Request, res: Response) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];
    
    const history = await sql`
      SELECT 
        p.id,
        p.passport_id,
        p.scan_type,
        p.status,
        p.processed_at,
        u.name as processed_by,
        mr.requirement_type as missing_requirement,
        CASE 
          WHEN p.scan_type = 'Inscan' THEN 'Inscanned'
          WHEN p.scan_type = 'Outscan' THEN 'Outscanned'
          ELSE 'Not Scanned'
        END as scan_status,
        string_agg(DISTINCT c.name, ',') as category_names,
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'name', c.name
          )
        ) as categories
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE DATE(p.processed_at) = ${date}
      GROUP BY 
        p.id,
        p.passport_id,
        p.scan_type,
        p.status,
        p.processed_at,
        u.name,
        mr.requirement_type
      ORDER BY p.processed_at DESC
    `;

    const formattedHistory = history.map(entry => ({
      id: entry.id,
      passportId: entry.passport_id,
      scanType: entry.scan_type,
      scanStatus: entry.scan_status,
      status: entry.status,
      processedAt: entry.processed_at,
      processedBy: entry.processed_by,
      missingRequirement: entry.missing_requirement,
      categoryNames: entry.category_names ? entry.category_names.split(',') : [],
      categories: entry.categories || []
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
EOF

# Fix check-db.ts
cat > src/scripts/check-db.ts << 'EOF'
import sql from '../config/database';

async function checkDatabase() {
  try {
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('Available tables:', tables.map(t => t.table_name));
    
    // Check users table if it exists
    if (tables.some(t => t.table_name === 'users')) {
      const users = await sql`SELECT * FROM users`;
      console.log('Users count:', users.length);
      console.log('Sample user:', users[0]);
    } else {
      console.log('Users table does not exist');
    }
  } catch (error) {
    console.error('Database check failed:', error);
  }
}

checkDatabase();
EOF

# Fix create-user.ts
cat > src/scripts/create-user.ts << 'EOF'
import bcrypt from 'bcryptjs';
import sql from '../config/database';

async function createUser() {
  try {
    // Create admin user
    const username = 'admin';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user exists
    const existingUsers = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;
    
    if (existingUsers.length > 0) {
      console.log('Admin user already exists');
    } else {
      await sql`
        INSERT INTO users (username, password, name, role)
        VALUES (${username}, ${hashedPassword}, 'Administrator', 'admin')
      `;
      console.log('Admin user created successfully');
      console.log('Username:', username);
      console.log('Password:', password);
    }
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createUser();
EOF

# Update Render's build command to add node_modules/.bin to PATH
echo "Updated TypeScript files and installed required types for build"
exit 0 