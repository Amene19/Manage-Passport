import express from 'express';
import pool from '../config/database';

const router = express.Router();

// Get daily statistics
router.get('/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as totalPassports,
        SUM(CASE WHEN scan_type = 'Inscan' THEN 1 ELSE 0 END) as inscannedPassports,
        SUM(CASE WHEN scan_type = 'Outscan' THEN 1 ELSE 0 END) as outscannedPassports,
        SUM(CASE WHEN status = 'C' THEN 1 ELSE 0 END) as pendingOutscan,
        (
          SELECT COUNT(DISTINCT p2.id)
          FROM passports p2
          JOIN passport_categories pc ON p2.id = pc.passport_id
          JOIN categories c ON pc.category_id = c.id
          WHERE DATE(p2.processed_at) = ? AND c.name = 'A'
        ) as categoryA,
        (
          SELECT COUNT(DISTINCT p2.id)
          FROM passports p2
          JOIN passport_categories pc ON p2.id = pc.passport_id
          JOIN categories c ON pc.category_id = c.id
          WHERE DATE(p2.processed_at) = ? AND c.name = 'B'
        ) as categoryB,
        (
          SELECT COUNT(DISTINCT p2.id)
          FROM passports p2
          JOIN passport_categories pc ON p2.id = pc.passport_id
          JOIN categories c ON pc.category_id = c.id
          WHERE DATE(p2.processed_at) = ? AND c.name = 'C'
        ) as categoryC,
        (
          SELECT COUNT(DISTINCT p2.id)
          FROM passports p2
          JOIN passport_categories pc ON p2.id = pc.passport_id
          JOIN categories c ON pc.category_id = c.id
          WHERE DATE(p2.processed_at) = ? AND c.name = 'D'
        ) as categoryD,
        COUNT(DISTINCT CASE WHEN mr.requirement_type = 'B1' THEN p.id END) as missingDocuments,
        COUNT(DISTINCT CASE WHEN mr.requirement_type = 'B2' THEN p.id END) as invalidDocuments,
        COUNT(DISTINCT CASE WHEN mr.requirement_type = 'B3' THEN p.id END) as additionalInfoRequired
      FROM passports p
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE DATE(p.processed_at) = ?
    `, [targetDate, targetDate, targetDate, targetDate, targetDate]);

    const result = {
      ...(stats as any[])[0],
      date: targetDate
    };

    console.log('Daily stats for date:', targetDate, result);
    res.json(result);
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get history by date
router.get('/history', async (req, res) => {
  try {
    const { date } = req.query;
    const [history] = await pool.execute(`
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
        GROUP_CONCAT(DISTINCT c.name) as category_names,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', c.id,
            'name', c.name
          )
        ) as categories
      FROM passports p
      LEFT JOIN users u ON p.processed_by = u.id
      LEFT JOIN passport_categories pc ON p.id = pc.passport_id
      LEFT JOIN categories c ON pc.category_id = c.id
      LEFT JOIN missing_requirements mr ON p.id = mr.passport_id
      WHERE DATE(p.processed_at) = ?
      GROUP BY 
        p.id,
        p.passport_id,
        p.scan_type,
        p.status,
        p.processed_at,
        u.name,
        mr.requirement_type
      ORDER BY p.processed_at DESC
    `, [date || new Date().toISOString().split('T')[0]]);

    const formattedHistory = (history as any[]).map(entry => ({
      id: entry.id,
      passportId: entry.passport_id,
      scanType: entry.scan_type,
      scanStatus: entry.scan_status,
      status: entry.status,
      processedAt: entry.processed_at,
      processedBy: entry.processed_by,
      missingRequirement: entry.missing_requirement,
      categoryNames: entry.category_names ? entry.category_names.split(',') : [],
      categories: entry.categories ? JSON.parse(`[${entry.categories}]`) : []
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 