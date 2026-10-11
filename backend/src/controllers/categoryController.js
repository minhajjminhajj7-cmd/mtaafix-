const pool = require('../config/database');

const getCategories = async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'super_admin';
    const result = await pool.query(
      `SELECT id, name, description, active, created_at, updated_at
       FROM categories
       ${includeInactive ? '' : 'WHERE active = TRUE'}
       ORDER BY id`
    );

    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve categories' });
  }
};

const createCategory = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const description = String(req.body.description || '').trim();
    if (name.length < 2) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const result = await pool.query(
      `INSERT INTO categories (name, description, active, updated_at)
       VALUES ($1,$2,TRUE,CURRENT_TIMESTAMP)
       RETURNING id, name, description, active, created_at, updated_at`,
      [name, description || null]
    );
    return res.status(201).json({ success: true, message: 'Category created', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A category with this name already exists' });
    }
    console.error('Create category error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name === undefined ? null : String(req.body.name).trim();
    const description = req.body.description === undefined ? null : String(req.body.description).trim();
    const active = req.body.active;

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($2, name),
           description = CASE WHEN $3::text IS NULL THEN description ELSE NULLIF($3,'') END,
           active = CASE WHEN $4::boolean IS NULL THEN active ELSE $4 END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, name, description, active, created_at, updated_at`,
      [id, name || null, description, typeof active === 'boolean' ? active : null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({ success: true, message: 'Category updated', data: result.rows[0] });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const usage = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM problem_types WHERE category_id=$1) AS problem_types,
         (SELECT COUNT(*) FROM incidents WHERE category_id=$1) AS incidents,
         (SELECT COUNT(*) FROM reports WHERE category_id=$1) AS reports`,
      [id]
    );
    const row = usage.rows[0];
    if (Number(row.problem_types) > 0 || Number(row.incidents) > 0 || Number(row.reports) > 0) {
      return res.status(409).json({
        success: false,
        message: 'This category has historical data. Deactivate it instead of deleting it.'
      });
    }

    const result = await pool.query('DELETE FROM categories WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    return res.status(200).json({ success: true, message: 'Category permanently deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete category' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
