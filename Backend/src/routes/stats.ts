import express from 'express';
import sql from '../config/database';

const router = express.Router();

// Get daily statistics
router.get('/daily', async (req, res) => {
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
router.get('/history', async (req, res) => {
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