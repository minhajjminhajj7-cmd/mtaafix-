const pool = require("../config/database");
const { recordIncidentHistory } = require("../services/incidentHistoryService");
const { notifyIncidentCitizens } = require("../services/notificationService");


// ====================================================
// HELPER: INCIDENT ACCESS
// ====================================================
const buildIncidentAccess = (user, startIndex = 1) => {
  if (user.role === "service_provider") {
    return {
      clause: `i.authority_id = $${startIndex}`,
      params: [user.authority_id]
    };
  }

  return {
    clause: "TRUE",
    params: []
  };
};


// ====================================================
// GET ALL INCIDENTS
// ====================================================
const getIncidents = async (req, res) => {
  try {
    if (
      req.user.role === "service_provider" &&
      !req.user.authority_id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This department account is not linked to a department"
      });
    }

    const access = buildIncidentAccess(
      req.user,
      1
    );

    const result = await pool.query(
      `
      SELECT
        i.id,
        i.title,
        i.description,
        i.latitude,
        i.longitude,
        i.status,
        i.priority,
        i.report_count,
        i.created_at,
        i.updated_at,

        c.id AS category_id,
        c.name AS category_name,

        pt.id AS problem_type_id,
        pt.name AS problem_type_name,
        pt.default_priority,
        pt.safety_message,
        pt.emergency_contact_recommended,

        a.id AS authority_id,
        a.name AS authority_name,
        a.authority_type,
        a.contact_person,
        a.contact_phone,
        a.contact_email,
        a.address

      FROM incidents i

      LEFT JOIN categories c
        ON c.id = i.category_id

      LEFT JOIN problem_types pt
        ON pt.id = i.problem_type_id

      LEFT JOIN authorities a
        ON a.id = i.authority_id

      WHERE ${access.clause}

      ORDER BY
        CASE i.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        i.created_at DESC
      `,
      access.params
    );

    const incidents = result.rows;

    const activeIncidents =
      incidents.filter(
        (incident) =>
          !["resolved", "closed", "rejected", "archived"].includes(
            incident.status
          )
      );

    const stats = {
      total: incidents.length,

      active: activeIncidents.length,

      open: incidents.filter(
        (incident) =>
          incident.status === "open"
      ).length,

      underReview: incidents.filter(
        (incident) =>
          incident.status ===
          "under_review"
      ).length,

      assigned: incidents.filter(
        (incident) =>
          incident.status === "assigned"
      ).length,

      inProgress: incidents.filter(
        (incident) =>
          incident.status ===
          "in_progress"
      ).length,

      resolutionSubmitted: incidents.filter(
        (incident) => incident.status === "resolution_submitted"
      ).length,

      resolved: incidents.filter(
        (incident) =>
          incident.status === "resolved"
      ).length,

      closed: incidents.filter(
        (incident) =>
          incident.status === "closed"
      ).length,

      critical: activeIncidents.filter(
        (incident) =>
          incident.priority === "critical"
      ).length,

      high: activeIncidents.filter(
        (incident) =>
          incident.priority === "high"
      ).length,

      normal: activeIncidents.filter(
        (incident) =>
          incident.priority === "normal"
      ).length,

      low: activeIncidents.filter(
        (incident) =>
          incident.priority === "low"
      ).length,

      totalReports: incidents.reduce(
        (sum, incident) => sum + Number(incident.report_count || 0),
        0
      ),

      overdue: activeIncidents.filter((incident) => {
        const updated = new Date(incident.updated_at || incident.created_at).getTime();
        const ageHours = (Date.now() - updated) / 3600000;
        const limit = incident.priority === 'critical' ? 24
          : incident.priority === 'high' ? 48
          : incident.priority === 'normal' ? 72
          : 120;
        return ageHours > limit;
      }).length
    };

    return res.status(200).json({
      success: true,
      count: incidents.length,
      stats,
      data: incidents
    });

  } catch (error) {
    console.error(
      "Get incidents error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve incidents"
    });
  }
};


// ====================================================
// GET SINGLE INCIDENT
// ====================================================
const getIncidentById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      req.user.role === "service_provider" &&
      !req.user.authority_id
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This department account is not linked to a department"
      });
    }

    let accessClause = "";
    const params = [id];

    if (
      req.user.role ===
      "service_provider"
    ) {
      params.push(
        req.user.authority_id
      );

      accessClause =
        "AND i.authority_id = $2";
    }

    const incidentResult =
      await pool.query(
        `
        SELECT
          i.id,
          i.title,
          i.description,
          i.latitude,
          i.longitude,
          i.status,
          i.priority,
          i.report_count,
          i.created_at,
          i.updated_at,
          i.accepted_at,
          i.work_started_at,
          i.resolution_note,
          i.resolution_submitted_at,
          i.resolved_at,
          i.closed_at,
          i.rejected_at,
          i.rejection_reason,
          i.archived_at,
          i.reviewed_at,
          i.verification_evidence_uploaded_at,

          reviewer.full_name AS reviewed_by_name,
          reviewer.role AS reviewed_by_role,
          assigner.full_name AS assigned_by_name,
          assigner.role AS assigned_by_role,
          accepter.full_name AS accepted_by_name,
          accepter.role AS accepted_by_role,
          starter.full_name AS work_started_by_name,
          starter.role AS work_started_by_role,
          resolver.full_name AS resolved_by_name,
          resolver.role AS resolved_by_role,

          c.id AS category_id,
          c.name AS category_name,

          pt.id AS problem_type_id,
          pt.name AS problem_type_name,
          pt.description
            AS problem_type_description,
          pt.default_priority,
          pt.safety_message,
          pt.emergency_contact_recommended,

          a.id AS authority_id,
          a.name AS authority_name,
          a.authority_type,
          a.contact_person,
          a.contact_phone,
          a.contact_email,
          a.address

        FROM incidents i

        LEFT JOIN categories c
          ON c.id = i.category_id

        LEFT JOIN problem_types pt
          ON pt.id =
             i.problem_type_id

        LEFT JOIN authorities a
          ON a.id =
             i.authority_id

        LEFT JOIN users reviewer
          ON reviewer.id = i.reviewed_by

        LEFT JOIN users assigner
          ON assigner.id = i.assigned_by

        LEFT JOIN users accepter
          ON accepter.id = i.accepted_by

        LEFT JOIN users starter
          ON starter.id = i.work_started_by

        LEFT JOIN users resolver
          ON resolver.id = COALESCE(i.resolved_by, i.resolution_reviewed_by)

        WHERE i.id = $1
        ${accessClause}
        `,
        params
      );

    if (
      incidentResult.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Incident not found or you do not have access to it"
      });
    }

    const reportsResult =
      await pool.query(
        `
        SELECT
          r.id,
          r.description,
          r.latitude,
          r.longitude,
          r.image_url,
          r.created_at,
          r.tracking_code,
          r.is_anonymous,
          r.reporter_phone,
          r.reporter_email,

          CASE
            WHEN r.is_anonymous = TRUE THEN 'Anonymous Citizen'
            ELSE COALESCE(u.full_name, r.reporter_name, 'Guest Citizen')
          END AS citizen_name

        FROM reports r

        LEFT JOIN users u
          ON u.id = r.user_id

        WHERE r.incident_id = $1

        ORDER BY
          r.created_at ASC
        `,
        [id]
      );

    const incident = incidentResult.rows[0];
    const reports = reportsResult.rows;

    const reportIds = reports.map((report) => report.id);
    if (reportIds.length > 0) {
      const evidenceResult = await pool.query(
        `
        SELECT id, report_id, file_url, media_type, mime_type, original_name, created_at
        FROM report_evidence
        WHERE report_id = ANY($1::uuid[])
        ORDER BY created_at ASC
        `,
        [reportIds]
      );

      const byReport = new Map();
      for (const item of evidenceResult.rows) {
        if (!byReport.has(item.report_id)) byReport.set(item.report_id, []);
        byReport.get(item.report_id).push(item);
      }

      for (const report of reports) {
        report.evidence = byReport.get(report.id) || [];
      }
    }

    const resolutionEvidenceResult = await pool.query(
      `
      SELECT id, file_url, media_type, mime_type, original_name, created_at
      FROM incident_resolution_evidence
      WHERE incident_id = $1
      ORDER BY created_at ASC
      `,
      [id]
    );

    const progressEvidenceResult = await pool.query(
      `
      SELECT
        e.id, e.file_url, e.media_type, e.mime_type, e.original_name, e.note, e.created_at,
        u.full_name AS uploaded_by_name, u.role AS uploaded_by_role
      FROM incident_progress_evidence e
      LEFT JOIN users u ON u.id = e.uploaded_by
      WHERE e.incident_id = $1
      ORDER BY e.created_at ASC
      `,
      [id]
    );

    const adminEvidenceResult = await pool.query(
      `
      SELECT
        e.id, e.file_url, e.media_type, e.mime_type, e.original_name, e.note, e.created_at,
        u.full_name AS uploaded_by_name, u.role AS uploaded_by_role
      FROM incident_admin_evidence e
      LEFT JOIN users u ON u.id = e.uploaded_by
      WHERE e.incident_id = $1
      ORDER BY e.created_at ASC
      `,
      [id]
    );

    const historyResult = await pool.query(
      `
      SELECT
        h.id, h.action, h.from_status, h.to_status, h.note, h.metadata, h.created_at,
        u.full_name AS actor_name, u.role AS actor_role
      FROM incident_history h
      LEFT JOIN users u ON u.id = h.actor_user_id
      WHERE h.incident_id = $1
      ORDER BY h.created_at ASC
      `,
      [id]
    );

    return res.status(200).json({
      success: true,

      data: {
        incident,
        reports,
        resolutionEvidence: resolutionEvidenceResult.rows,
        progressEvidence: progressEvidenceResult.rows,
        adminEvidence: adminEvidenceResult.rows,
        history: historyResult.rows
      },

      incident,
      reports,
      resolutionEvidence: resolutionEvidenceResult.rows,
      progressEvidence: progressEvidenceResult.rows,
      adminEvidence: adminEvidenceResult.rows,
      history: historyResult.rows
    });

  } catch (error) {
    console.error(
      "Get incident error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve incident"
    });
  }
};


// ====================================================
// UPDATE INCIDENT STATUS
// SUPER ADMIN / ADMIN ONLY FOR NOW
// ====================================================
const updateIncidentStatus = async (
  req,
  res
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "open",
      "under_review",
      "assigned",
      "in_progress",
      "resolution_submitted",
      "resolved",
      "closed",
      "rejected",
      "archived"
    ];

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid incident status"
      });
    }

    const before = await pool.query(
      `SELECT status FROM incidents WHERE id = $1`,
      [id]
    );

    const result = await pool.query(
      `
      UPDATE incidents
      SET
        status = $1,
        resolved_at = CASE WHEN $1 = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END,
        closed_at = CASE WHEN $1 = 'closed' THEN CURRENT_TIMESTAMP ELSE closed_at END,
        rejected_at = CASE WHEN $1 = 'rejected' THEN CURRENT_TIMESTAMP ELSE rejected_at END,
        archived_at = CASE WHEN $1 = 'archived' THEN CURRENT_TIMESTAMP ELSE archived_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Incident not found"
      });
    }

    await recordIncidentHistory(pool, {
      incidentId: id,
      actorUserId: req.user.id,
      action: "status_changed",
      fromStatus: before.rows[0]?.status || null,
      toStatus: status,
    });

    return res.status(200).json({
      success: true,
      message:
        "Incident status updated successfully",
      data: result.rows[0],
      incident: result.rows[0]
    });

  } catch (error) {
    console.error(
      "Update incident error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update incident status"
    });
  }
};



// ====================================================
// DEPARTMENT: ACCEPT RESPONSIBILITY
// ====================================================
const acceptIncident = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.authority_id) {
      return res.status(403).json({
        success: false,
        message: "Your account is not linked to a department"
      });
    }

    const result = await pool.query(
      `
      UPDATE incidents
      SET
        status = 'assigned',
        accepted_at = CURRENT_TIMESTAMP,
        accepted_by = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND authority_id = $2
        AND status = 'under_review'
      RETURNING *
      `,
      [id, req.user.authority_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Review the incident first before accepting responsibility"
      });
    }

    await recordIncidentHistory(pool, {
      incidentId: id,
      actorUserId: req.user.id,
      action: "department_accepted",
      fromStatus: "under_review",
      toStatus: "assigned",
    });

    await notifyIncidentCitizens(
      pool,
      id,
      "Department accepted incident",
      "The responsible department has accepted responsibility for your incident.",
      "accepted"
    );

    return res.status(200).json({
      success: true,
      message: "Incident accepted successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Accept incident error:", error);
    return res.status(500).json({ success: false, message: "Unable to accept incident" });
  }
};


// ====================================================
// SERVICE PROVIDER: START WORK
// ====================================================
const startIncidentWork = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE incidents
      SET
        status = 'in_progress',
        work_started_at = CURRENT_TIMESTAMP,
        work_started_by = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND authority_id = $2
        AND status = 'assigned'
        AND accepted_at IS NOT NULL
      RETURNING *
      `,
      [id, req.user.authority_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Incident must be accepted before work can begin"
      });
    }

    await recordIncidentHistory(pool, {
      incidentId: id,
      actorUserId: req.user.id,
      action: "work_started",
      fromStatus: "assigned",
      toStatus: "in_progress",
    });

    await notifyIncidentCitizens(
      pool,
      id,
      "Repair work started",
      "The responsible department has started working on your incident.",
      "work_started"
    );

    return res.status(200).json({
      success: true,
      message: "Incident work started successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Start incident work error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start incident work"
    });
  }
};


// ====================================================
// DEPARTMENT: RESOLVE INCIDENT WITH EVIDENCE
// ====================================================
const submitIncidentResolution = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const resolutionNote = String(req.body.resolutionNote || '').trim();
    const evidenceFiles = req.files || [];

    if (resolutionNote.length < 5) {
      return res.status(400).json({ success: false, message: 'Resolution note is required' });
    }
    if (evidenceFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Upload at least one photo or video showing the completed work'
      });
    }
    if (!req.user.authority_id) {
      return res.status(403).json({ success: false, message: 'Your account is not linked to a department' });
    }

    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE incidents
       SET status='resolved',
           resolution_note=$1,
           resolution_submitted_at=CURRENT_TIMESTAMP,
           resolved_at=CURRENT_TIMESTAMP,
           resolved_by=$4,
           updated_at=CURRENT_TIMESTAMP
       WHERE id=$2
         AND authority_id=$3
         AND status='in_progress'
       RETURNING *`,
      [resolutionNote, id, req.user.authority_id, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Only work currently in progress can be marked resolved'
      });
    }

    for (const file of evidenceFiles) {
      const mediaType = String(file.mimetype || '').startsWith('video/') ? 'video' : 'image';
      await client.query(
        `INSERT INTO incident_resolution_evidence
         (incident_id, uploaded_by, file_url, media_type, mime_type, original_name)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          id,
          req.user.id,
          `/uploads/resolutions/${file.filename}`,
          mediaType,
          file.mimetype || null,
          file.originalname || null,
        ]
      );
    }

    await recordIncidentHistory(client, {
      incidentId: id,
      actorUserId: req.user.id,
      action: 'incident_resolved',
      fromStatus: 'in_progress',
      toStatus: 'resolved',
      note: resolutionNote,
      metadata: { evidenceCount: evidenceFiles.length },
    });

    await notifyIncidentCitizens(
      client,
      id,
      'Incident resolved',
      'The responsible department marked the problem resolved and uploaded completion evidence.',
      'resolved'
    );

    await client.query('COMMIT');
    return res.status(200).json({
      success: true,
      message: 'Incident resolved with evidence',
      data: result.rows[0]
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Resolve incident error:', error);
    return res.status(500).json({ success: false, message: 'Unable to resolve incident' });
  } finally {
    client.release();
  }
};


// ====================================================
// SERVICE PROVIDER: ADD WORK PROGRESS EVIDENCE
// ====================================================
const addIncidentProgress = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const note = String(req.body.note || '').trim();
    const files = req.files || [];

    if (!req.user.authority_id) {
      return res.status(403).json({ success: false, message: 'Department account is not linked to a department' });
    }
    if (!note && files.length === 0) {
      return res.status(400).json({ success: false, message: 'Add a progress note, photo or video' });
    }

    await client.query('BEGIN');
    const current = await client.query(
      `SELECT id, status FROM incidents WHERE id=$1 AND authority_id=$2 LIMIT 1`,
      [id, req.user.authority_id]
    );
    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Incident not found or not assigned to your organization' });
    }
    if (current.rows[0].status !== 'in_progress') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Progress evidence can only be added while work is in progress' });
    }

    for (const file of files) {
      const mediaType = String(file.mimetype || '').startsWith('video/') ? 'video' : 'image';
      await client.query(
        `INSERT INTO incident_progress_evidence
         (incident_id, uploaded_by, note, file_url, media_type, mime_type, original_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          id,
          req.user.id,
          note || null,
          `/uploads/progress/${file.filename}`,
          mediaType,
          file.mimetype || null,
          file.originalname || null,
        ]
      );
    }

    await recordIncidentHistory(client, {
      incidentId: id,
      actorUserId: req.user.id,
      action: 'progress_updated',
      fromStatus: 'in_progress',
      toStatus: 'in_progress',
      note: note || null,
      metadata: { evidenceCount: files.length },
    });

    await client.query(`UPDATE incidents SET updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [id]);
    await notifyIncidentCitizens(
      client,
      id,
      'Work progress updated',
      note || 'The responsible department added new field evidence.',
      'work_progress'
    );

    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: 'Progress update saved', evidenceCount: files.length });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Progress update error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save progress update' });
  } finally {
    client.release();
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  acceptIncident,
  startIncidentWork,
  submitIncidentResolution,
  addIncidentProgress
};
