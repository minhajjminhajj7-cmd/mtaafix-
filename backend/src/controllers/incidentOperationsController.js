const pool = require('../config/database');
const { recordIncidentHistory } = require('../services/incidentHistoryService');
const { notifyIncidentCitizens, notifyAuthorityUsers } = require('../services/notificationService');
const { getRoutingAuthority } = require('../services/routingService');
const { assessPriority } = require('../services/priorityService');

async function getIncident(client, id) {
  const result = await client.query(
    `SELECT id, status, authority_id, accepted_at FROM incidents WHERE id=$1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}


// Super Admin can create an operational incident received through another channel
// (telephone, field officer, walk-in report). It is intentionally report_count=0
// because no citizen report record exists for a manually-created incident.
const createManualIncident = async (req, res) => {
  const client = await pool.connect();
  try {
    const categoryId = Number(req.body.categoryId);
    const problemTypeId = Number(req.body.problemTypeId);
    const description = String(req.body.description || '').trim();
    const latitude = Number(req.body.latitude);
    const longitude = Number(req.body.longitude);
    const requestedPriority = req.body.priority ? String(req.body.priority) : null;

    if (!Number.isInteger(categoryId) || !Number.isInteger(problemTypeId) || description.length < 5 ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ success: false, message: 'Problem type, description and valid location are required' });
    }

    const ptResult = await client.query(
      `SELECT pt.id,pt.category_id,pt.name,pt.default_priority,pt.active
       FROM problem_types pt
       WHERE pt.id=$1 AND pt.category_id=$2 AND pt.active=TRUE LIMIT 1`,
      [problemTypeId, categoryId]
    );
    if (ptResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive problem type' });
    }
    const pt = ptResult.rows[0];
    const routingAuthority = await getRoutingAuthority(client, categoryId, problemTypeId);
    const priority = ['low','normal','high','critical'].includes(requestedPriority)
      ? requestedPriority
      : assessPriority({ defaultPriority: pt.default_priority, problemTypeName: pt.name, reportCount: 0 }).priority;

    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO incidents
       (category_id,problem_type_id,authority_id,title,description,latitude,longitude,status,priority,report_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'open',$8,0)
       RETURNING *`,
      [categoryId, problemTypeId, routingAuthority?.id || null, pt.name, description, latitude, longitude, priority]
    );
    await recordIncidentHistory(client, {
      incidentId: result.rows[0].id,
      actorUserId: req.user.id,
      action: 'manual_incident_created',
      fromStatus: null,
      toStatus: 'open',
      note: 'Created by Super Admin from an offline/operational report channel',
    });
    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: 'Incident created and routed', data: result.rows[0] });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Create manual incident error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create incident' });
  } finally {
    client.release();
  }
};

const updateIncidentPriority = async (req, res) => {
  try {
    const priority = String(req.body.priority || '').trim();
    if (!['low','normal','high','critical'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }
    const before = await pool.query('SELECT id,status,priority FROM incidents WHERE id=$1 LIMIT 1', [req.params.id]);
    if (before.rows.length === 0) return res.status(404).json({ success: false, message: 'Incident not found' });
    const result = await pool.query(
      `UPDATE incidents SET priority=$2,updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *`,
      [req.params.id, priority]
    );
    await recordIncidentHistory(pool, {
      incidentId: req.params.id,
      actorUserId: req.user.id,
      action: 'priority_overridden',
      fromStatus: before.rows[0].status,
      toStatus: before.rows[0].status,
      note: `Priority changed from ${before.rows[0].priority} to ${priority}`,
    });
    return res.status(200).json({ success: true, message: 'Priority updated', data: result.rows[0] });
  } catch (error) {
    console.error('Priority update error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update priority' });
  }
};

const restoreIncident = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE incidents
       SET status='open',archived_at=NULL,updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND status='archived'
       RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Only archived incidents can be restored' });
    }
    await recordIncidentHistory(pool, {
      incidentId: req.params.id,
      actorUserId: req.user.id,
      action: 'incident_restored',
      fromStatus: 'archived',
      toStatus: 'open',
      note: String(req.body.note || '').trim() || null,
    });
    return res.status(200).json({ success: true, message: 'Incident restored to active register', data: result.rows[0] });
  } catch (error) {
    console.error('Restore incident error:', error);
    return res.status(500).json({ success: false, message: 'Unable to restore incident' });
  }
};

// Super Admin uses assignment only as a routing correction/reassignment tool.
const assignIncident = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const authorityId = Number(req.body.authorityId);
    if (!Number.isInteger(authorityId)) {
      return res.status(400).json({ success: false, message: 'Valid department is required' });
    }

    const authority = await client.query(
      `SELECT id, name, is_active FROM authorities WHERE id=$1 LIMIT 1`,
      [authorityId]
    );
    if (authority.rows.length === 0 || authority.rows[0].is_active === false) {
      return res.status(400).json({ success: false, message: 'Department not found or inactive' });
    }

    await client.query('BEGIN');
    const before = await getIncident(client, id);
    if (!before) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    if (['resolved','closed','archived'].includes(before.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Resolved or archived incidents cannot be reassigned' });
    }

    const result = await client.query(
      `UPDATE incidents
       SET authority_id=$1,
           assigned_by=$3,
           accepted_at=NULL,
           accepted_by=NULL,
           work_started_at=NULL,
           work_started_by=NULL,
           status='open',
           updated_at=CURRENT_TIMESTAMP
       WHERE id=$2
       RETURNING *`,
      [authorityId, id, req.user.id]
    );

    await recordIncidentHistory(client, {
      incidentId: id,
      actorUserId: req.user.id,
      action: before.authority_id && Number(before.authority_id) !== authorityId
        ? 'incident_reassigned'
        : 'routing_confirmed',
      fromStatus: before.status,
      toStatus: 'open',
      note: String(req.body.note || '').trim() || null,
      metadata: { fromAuthorityId: before.authority_id, toAuthorityId: authorityId },
    });

    await notifyIncidentCitizens(
      client,
      id,
      'Responsible department updated',
      `Your incident is now with ${authority.rows[0].name}.`,
      'routing'
    );

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Responsible department updated', data: result.rows[0] });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Assign incident error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update responsible department' });
  } finally {
    client.release();
  }
};

// The responsible department reviews its own automatically-routed incident.
const reviewIncident = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const note = String(req.body.note || '').trim();
    if (!req.user.authority_id) {
      return res.status(403).json({ success: false, message: 'Your account is not linked to a department' });
    }

    await client.query('BEGIN');
    const beforeResult = await client.query(
      `SELECT id, status, authority_id FROM incidents WHERE id=$1 AND authority_id=$2 LIMIT 1`,
      [id, req.user.authority_id]
    );
    if (beforeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Incident not found in your department' });
    }
    const before = beforeResult.rows[0];
    if (before.status !== 'open') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Only a newly reported incident can be marked reviewed' });
    }

    const result = await client.query(
      `UPDATE incidents
       SET status='under_review', reviewed_at=CURRENT_TIMESTAMP, reviewed_by=$2, updated_at=CURRENT_TIMESTAMP
       WHERE id=$1
       RETURNING *`,
      [id, req.user.id]
    );

    await recordIncidentHistory(client, {
      incidentId: id,
      actorUserId: req.user.id,
      action: 'department_reviewed',
      fromStatus: 'open',
      toStatus: 'under_review',
      note: note || null,
    });

    await notifyIncidentCitizens(
      client,
      id,
      'Department reviewing report',
      'The responsible department has reviewed your report and is preparing the response.',
      'reviewed'
    );

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Incident marked as reviewed', data: result.rows[0] });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Review incident error:', error);
    return res.status(500).json({ success: false, message: 'Unable to review incident' });
  } finally {
    client.release();
  }
};

const archiveIncident = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const note = String(req.body.note || '').trim();
    if (note.length < 3) {
      return res.status(400).json({ success: false, message: 'Give a short reason for archiving this incident' });
    }
    await client.query('BEGIN');
    const before = await getIncident(client, id);
    if (!before) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    const result = await client.query(
      `UPDATE incidents SET status='archived', archived_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 RETURNING *`,
      [id]
    );
    await recordIncidentHistory(client, {
      incidentId: id,
      actorUserId: req.user.id,
      action: 'incident_archived',
      fromStatus: before.status,
      toStatus: 'archived',
      note,
    });
    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Incident archived', data: result.rows[0] });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Archive incident error:', error);
    return res.status(500).json({ success: false, message: 'Unable to archive incident' });
  } finally {
    client.release();
  }
};

const deleteIncident = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    const reportCount = await client.query('SELECT COUNT(*)::int AS count FROM reports WHERE incident_id=$1', [id]);
    if (Number(reportCount.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'This incident has citizen reports and cannot be permanently deleted. Archive it instead.'
      });
    }
    const result = await client.query('DELETE FROM incidents WHERE id=$1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Incident permanently deleted' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Delete incident error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete incident' });
  } finally {
    client.release();
  }
};

// Super Admin escalation is a consultation message, not an approval step.
const messageDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const message = String(req.body.message || '').trim();
    if (message.length < 3) {
      return res.status(400).json({ success: false, message: 'Write a message to the department' });
    }

    const incident = await pool.query(
      `SELECT i.id, i.status, i.authority_id, a.name AS authority_name
       FROM incidents i LEFT JOIN authorities a ON a.id=i.authority_id
       WHERE i.id=$1 LIMIT 1`,
      [id]
    );
    if (incident.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }
    if (!incident.rows[0].authority_id) {
      return res.status(400).json({ success: false, message: 'This incident has no responsible department yet' });
    }

    await recordIncidentHistory(pool, {
      incidentId: id,
      actorUserId: req.user.id,
      action: 'super_admin_message',
      fromStatus: incident.rows[0].status,
      toStatus: incident.rows[0].status,
      note: message,
      metadata: { authorityId: incident.rows[0].authority_id, authorityName: incident.rows[0].authority_name },
    });

    await notifyAuthorityUsers(
      pool,
      incident.rows[0].authority_id,
      id,
      'Super Admin follow-up',
      message,
      'department_message'
    );

    return res.status(201).json({ success: true, message: 'Message sent to the department' });
  } catch (error) {
    console.error('Message department error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send department message' });
  }
};

module.exports = {
  createManualIncident,
  updateIncidentPriority,
  restoreIncident,
  assignIncident,
  archiveIncident,
  deleteIncident,
  reviewIncident,
  messageDepartment,
};
