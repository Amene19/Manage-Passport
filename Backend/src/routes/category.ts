import express from 'express';
import sql from '../config/database';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await sql`SELECT * FROM categories ORDER BY name`;
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
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
router.post('/', async (req, res) => {
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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