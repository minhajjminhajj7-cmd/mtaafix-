const pool = require('../config/database');

const getProblemTypes = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'super_admin';
    const values = [];
    const where = [];

    if (!includeInactive) where.push('pt.active = TRUE');
    if (categoryId) {
      const parsed = Number(categoryId);
      if (!Number.isInteger(parsed)) {
        return res.status(400).json({ success: false, message: 'Invalid category ID' });
      }
      values.push(parsed);
      where.push(`pt.category_id = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT
         pt.id,
         pt.category_id,
         c.name AS category_name,
         pt.name,
         pt.description,
         pt.default_priority,
         pt.safety_message,
         pt.emergency_contact_recommended,
         pt.active,
         pt.authority_id,
         a.name AS authority_name,
         a.contact_person AS authority_contact_person,
         a.contact_phone AS authority_contact_phone,
         a.contact_email AS authority_contact_email,
         pt.created_at,
         pt.updated_at
       FROM problem_types pt
       JOIN categories c ON c.id = pt.category_id
       LEFT JOIN authorities a ON a.id = pt.authority_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY pt.category_id, pt.id`,
      values
    );

    return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    console.error('Get problem types error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve problem types' });
  }
};

function parsePayload(body) {
  const categoryId = Number(body.categoryId ?? body.category_id);
  const authorityIdRaw = body.authorityId ?? body.authority_id;
  const authorityId = authorityIdRaw === '' || authorityIdRaw === null || authorityIdRaw === undefined
    ? null
    : Number(authorityIdRaw);
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const defaultPriority = String(body.defaultPriority ?? body.default_priority ?? 'normal').trim();
  const safetyMessage = String(body.safetyMessage ?? body.safety_message ?? '').trim();
  const emergency = body.emergencyContactRecommended ?? body.emergency_contact_recommended ?? false;
  return { categoryId, authorityId, name, description, defaultPriority, safetyMessage, emergency: Boolean(emergency) };
}

const createProblemType = async (req, res) => {
  try {
    const p = parsePayload(req.body || {});
    if (!Number.isInteger(p.categoryId) || p.name.length < 2) {
      return res.status(400).json({ success: false, message: 'Category and problem type name are required' });
    }
    if (p.authorityId !== null && !Number.isInteger(p.authorityId)) {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }
    if (!['low','normal','high','critical'].includes(p.defaultPriority)) {
      return res.status(400).json({ success: false, message: 'Invalid default priority' });
    }

    const result = await pool.query(
      `INSERT INTO problem_types
       (category_id, authority_id, name, description, default_priority, safety_message,
        emergency_contact_recommended, active, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE,CURRENT_TIMESTAMP)
       RETURNING *`,
      [p.categoryId, p.authorityId, p.name, p.description || null, p.defaultPriority,
       p.safetyMessage || null, p.emergency]
    );
    return res.status(201).json({ success: true, message: 'Problem type created', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'This problem type already exists in the selected category' });
    }
    if (error.code === '23503') {
      return res.status(400).json({ success: false, message: 'Selected category or department does not exist' });
    }
    console.error('Create problem type error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create problem type' });
  }
};

const updateProblemType = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query('SELECT * FROM problem_types WHERE id=$1 LIMIT 1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Problem type not found' });
    }
    const existing = current.rows[0];
    const merged = {
      categoryId: req.body.categoryId ?? req.body.category_id ?? existing.category_id,
      authorityId: req.body.authorityId ?? req.body.authority_id ?? existing.authority_id,
      name: req.body.name ?? existing.name,
      description: req.body.description ?? existing.description ?? '',
      defaultPriority: req.body.defaultPriority ?? req.body.default_priority ?? existing.default_priority,
      safetyMessage: req.body.safetyMessage ?? req.body.safety_message ?? existing.safety_message ?? '',
      emergencyContactRecommended: req.body.emergencyContactRecommended ?? req.body.emergency_contact_recommended ?? existing.emergency_contact_recommended,
    };
    const p = parsePayload(merged);
    const active = typeof req.body.active === 'boolean' ? req.body.active : existing.active;

    if (!Number.isInteger(p.categoryId) || p.name.length < 2 ||
        (p.authorityId !== null && !Number.isInteger(p.authorityId)) ||
        !['low','normal','high','critical'].includes(p.defaultPriority)) {
      return res.status(400).json({ success: false, message: 'Invalid problem type values' });
    }

    const result = await pool.query(
      `UPDATE problem_types
       SET category_id=$2, authority_id=$3, name=$4, description=$5,
           default_priority=$6, safety_message=$7,
           emergency_contact_recommended=$8, active=$9, updated_at=CURRENT_TIMESTAMP
       WHERE id=$1
       RETURNING *`,
      [id, p.categoryId, p.authorityId, p.name, p.description || null, p.defaultPriority,
       p.safetyMessage || null, p.emergency, active]
    );
    return res.status(200).json({ success: true, message: 'Problem type updated', data: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'This problem type already exists in the selected category' });
    }
    console.error('Update problem type error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update problem type' });
  }
};

const deleteProblemType = async (req, res) => {
  try {
    const { id } = req.params;
    const usage = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM incidents WHERE problem_type_id=$1) AS incidents,
         (SELECT COUNT(*) FROM reports WHERE problem_type_id=$1) AS reports`,
      [id]
    );
    if (Number(usage.rows[0].incidents) > 0 || Number(usage.rows[0].reports) > 0) {
      return res.status(409).json({
        success: false,
        message: 'This problem type has historical reports. Deactivate it instead of deleting it.'
      });
    }

    const result = await pool.query('DELETE FROM problem_types WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Problem type not found' });
    }
    return res.status(200).json({ success: true, message: 'Problem type permanently deleted' });
  } catch (error) {
    console.error('Delete problem type error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete problem type' });
  }
};

module.exports = { getProblemTypes, createProblemType, updateProblemType, deleteProblemType };
