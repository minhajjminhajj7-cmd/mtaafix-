const pool = require("../config/database");
const crypto = require("crypto");

const {
  assessPriority,
} = require("../services/priorityService");

const {
  getRoutingAuthority,
} = require("../services/routingService");

// ====================================================
// Calculate GPS distance in metres
// ====================================================

const calculateDistance = (
  lat1,
  lon1,
  lat2,
  lon2
) => {
  const R = 6371000;

  const toRadians = (degrees) =>
    degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;
};

// ====================================================
// CREATE REPORT
// ====================================================

const createReport = async (req, res) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const {
      categoryId,
      problemTypeId,
      description,
      latitude,
      longitude,
      reporterName,
      reporterPhone,
      reporterEmail,
      isAnonymous,
      attachToIncidentId,
      forceNew,
    } = req.body || {};

    // ==================================================
    // Validate required fields
    // ==================================================

    if (
      !categoryId ||
      !problemTypeId ||
      !description ||
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Category, problem type, description, latitude and longitude are required",
      });
    }

    // ==================================================
    // Require at least one evidence file.
    // Supports the legacy `image` field and the new
    // `evidence` multi-file field (images or videos).
    // ==================================================

    const legacyImage = req.file || req.files?.image?.[0] || null;
    const evidenceFiles = [
      ...(legacyImage ? [legacyImage] : []),
      ...(req.files?.evidence || []),
    ];

    if (evidenceFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one photo or video of the infrastructure issue is required",
      });
    }

    const parsedCategoryId =
      Number(categoryId);

    const parsedProblemTypeId =
      Number(problemTypeId);

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      !Number.isInteger(parsedCategoryId) ||
      !Number.isInteger(parsedProblemTypeId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid category or problem type",
      });
    }

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GPS coordinates",
      });
    }

    // ==================================================
    // Primary evidence URL (kept for backward
    // compatibility with the existing mobile app).
    // ==================================================

    const primaryEvidence = evidenceFiles[0];
    const imageUrl = `/uploads/reports/${primaryEvidence.filename}`;

    const anonymous = String(isAnonymous || '').toLowerCase() === 'true';
    const trackingCode = `MTF-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

    if (!req.user && !anonymous && !reporterPhone && !reporterEmail) {
      return res.status(400).json({
        success: false,
        message: "Guests must provide a phone/email or choose anonymous reporting",
      });
    }

    // ==================================================
    // Validate category
    // ==================================================

    const categoryResult =
      await client.query(
        `
        SELECT
          id,
          name
        FROM categories
        WHERE id = $1
        `,
        [parsedCategoryId]
      );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const category =
      categoryResult.rows[0];

    // ==================================================
    // Validate problem type
    //
    // IMPORTANT:
    // The problem type MUST belong to the selected
    // category.
    // ==================================================

    const problemTypeResult =
      await client.query(
        `
        SELECT
          id,
          category_id,
          name,
          description,
          default_priority,
          safety_message,
          emergency_contact_recommended
        FROM problem_types
        WHERE id = $1
          AND category_id = $2
          AND active = TRUE
        `,
        [
          parsedProblemTypeId,
          parsedCategoryId,
        ]
      );

    if (
      problemTypeResult.rows.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The selected problem type does not belong to this category",
      });
    }

    const problemType =
      problemTypeResult.rows[0];

    // ==================================================
    // Determine responsible authority
    // ==================================================

    const routingAuthority =
      await getRoutingAuthority(
        client,
        parsedCategoryId,
        parsedProblemTypeId
      );

    // ==================================================
    // Begin transaction
    // ==================================================

    await client.query("BEGIN");

    transactionStarted = true;

    // ==================================================
    // Search unresolved incidents
    //
    // IMPORTANT:
    // Duplicate matching now uses:
    //
    // SAME CATEGORY
    // + SAME PROBLEM TYPE
    // + WITHIN 30 METRES
    //
    // Therefore a broken streetlight will not merge
    // with an exposed electrical wire simply because
    // they belong to the same broad category.
    // ==================================================

    const existingResult =
      await client.query(
        `
        SELECT
          id,
          category_id,
          problem_type_id,
          title,
          description,
          latitude,
          longitude,
          status,
          priority,
          report_count,
          authority_id
        FROM incidents
        WHERE category_id = $1
          AND problem_type_id = $2
          AND status NOT IN (
            'resolved',
            'closed',
            'rejected',
            'archived'
          )
        `,
        [
          parsedCategoryId,
          parsedProblemTypeId,
        ]
      );

    let matchedIncident = null;
    let distanceFromIncident = null;
    const forceCreateNew = String(forceNew || '').toLowerCase() === 'true';

    // Citizen may explicitly confirm a nearby existing incident.
    // We still validate the type and distance server-side.
    if (attachToIncidentId && !forceCreateNew) {
      const explicit = existingResult.rows.find((item) => String(item.id) === String(attachToIncidentId));
      if (explicit && explicit.latitude !== null && explicit.longitude !== null) {
        const explicitDistance = calculateDistance(lat, lon, Number(explicit.latitude), Number(explicit.longitude));
        if (explicitDistance <= 100) {
          matchedIncident = explicit;
          distanceFromIncident = explicitDistance;
        }
      }
    }

    if (!matchedIncident && !forceCreateNew) for (
      const existingIncident
      of existingResult.rows
    ) {
      if (
        existingIncident.latitude === null ||
        existingIncident.longitude === null
      ) {
        continue;
      }

      const distance =
        calculateDistance(
          lat,
          lon,
          Number(
            existingIncident.latitude
          ),
          Number(
            existingIncident.longitude
          )
        );

      if (
        distance <= 30 &&
        (
          distanceFromIncident === null ||
          distance <
            distanceFromIncident
        )
      ) {
        matchedIncident =
          existingIncident;

        distanceFromIncident =
          distance;
      }
    }

    let incident;
    let duplicate = false;

    // ==================================================
    // Existing master incident
    // ==================================================

    if (matchedIncident) {
      duplicate = true;

      const updatedIncident =
        await client.query(
          `
          UPDATE incidents
          SET
            report_count =
              report_count + 1,

            authority_id =
              COALESCE(
                authority_id,
                $2
              ),

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING *
          `,
          [
            matchedIncident.id,
            routingAuthority
              ? routingAuthority.id
              : null,
          ]
        );

      incident =
        updatedIncident.rows[0];
    }

    // ==================================================
    // Create new master incident
    // ==================================================

    else {
      const initialPriority =
        assessPriority({
          defaultPriority:
            problemType.default_priority,

          problemTypeName:
            problemType.name,

          reportCount: 1,
        });

      const newIncident =
        await client.query(
          `
          INSERT INTO incidents
          (
            category_id,
            problem_type_id,
            authority_id,
            title,
            description,
            latitude,
            longitude,
            status,
            priority,
            report_count
          )
          VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            'open',
            $8,
            1
          )
          RETURNING *
          `,
          [
            parsedCategoryId,
            parsedProblemTypeId,

            routingAuthority
              ? routingAuthority.id
              : null,

            problemType.name,

            description,

            lat,
            lon,

            initialPriority.priority,
          ]
        );

      incident =
        newIncident.rows[0];
    }

    // ==================================================
    // Store citizen report
    // ==================================================

    const reportResult =
      await client.query(
        `
        INSERT INTO reports
        (
          user_id,
          category_id,
          problem_type_id,
          incident_id,
          description,
          latitude,
          longitude,
          image_url,
          reporter_name,
          reporter_phone,
          reporter_email,
          is_anonymous,
          tracking_code
        )
        VALUES
        (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
        )
        RETURNING *
        `,
        [
          req.user?.id || null,
          parsedCategoryId,
          parsedProblemTypeId,
          incident.id,
          description,
          lat,
          lon,
          imageUrl,
          req.user ? req.user.full_name : (anonymous ? null : (reporterName || null)),
          req.user ? req.user.phone : (anonymous ? null : (reporterPhone || null)),
          req.user ? req.user.email : (anonymous ? null : (reporterEmail || null)),
          anonymous,
          trackingCode,
        ]
      );

    // ==================================================
    // Store all evidence records
    // ==================================================

    for (const file of evidenceFiles) {
      const mediaType = String(file.mimetype || '').startsWith('video/')
        ? 'video'
        : 'image';

      await client.query(
        `
        INSERT INTO report_evidence
        (report_id, file_url, media_type, mime_type, original_name)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          reportResult.rows[0].id,
          `/uploads/reports/${file.filename}`,
          mediaType,
          file.mimetype || null,
          file.originalname || null,
        ]
      );
    }

    // ==================================================
    // Calculate final priority
    //
    // Base safety priority comes from problem type.
    // Community reports may increase attention.
    // ==================================================

    const priorityAssessment =
      assessPriority({
        defaultPriority:
          problemType.default_priority,

        problemTypeName:
          problemType.name,

        reportCount:
          incident.report_count,
      });

    // ==================================================
    // Store calculated priority
    // ==================================================

    const priorityResult =
      await client.query(
        `
        UPDATE incidents
        SET
          priority = $1,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [
          priorityAssessment.priority,
          incident.id,
        ]
      );

    incident =
      priorityResult.rows[0];

    // ==================================================
    // Commit
    // ==================================================

    await client.query("COMMIT");

    transactionStarted = false;

    // ==================================================
    // Determine whether emergency contact should
    // be emphasized to the citizen.
    // ==================================================

    const showEmergencyContact =
      problemType
        .emergency_contact_recommended ===
        true ||
      priorityAssessment.priority ===
        "critical";

    // ==================================================
    // Response
    // ==================================================

    return res.status(201).json({
      success: true,

      message: duplicate
        ? "Report added to an existing incident"
        : "New incident created successfully",

      duplicate,

      distanceFromIncident:
        distanceFromIncident === null
          ? null
          : Math.round(
              distanceFromIncident * 10
            ) / 10,

      category: {
        id: category.id,
        name: category.name,
      },

      problemType: {
        id: problemType.id,
        name: problemType.name,

        defaultPriority:
          problemType.default_priority,

        safetyMessage:
          problemType.safety_message,

        emergencyContactRecommended:
          problemType
            .emergency_contact_recommended,
      },

      priorityAssessment,

      routing: routingAuthority
        ? {
            authorityId:
              routingAuthority.id,

            authorityName:
              routingAuthority.name,

            authorityType:
              routingAuthority
                .authority_type,

            contactPhone:
              routingAuthority
                .contact_phone,

            contactEmail:
              routingAuthority
                .contact_email,

            showEmergencyContact,
          }
        : null,

      safety: {
        urgent:
          priorityAssessment.priority ===
            "critical",

        message:
          problemType.safety_message,

        showEmergencyContact,
      },

      incident: {
        id: incident.id,

        title:
          problemType.name,

        status:
          incident.status,

        priority:
          incident.priority,

        reportCount:
          incident.report_count,

        authorityId:
          incident.authority_id,

        problemTypeId:
          incident.problem_type_id,
      },

      trackingCode,

      report:
        reportResult.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query(
          "ROLLBACK"
        );
      } catch (rollbackError) {
        console.error(
          "Rollback error:",
          rollbackError
        );
      }
    }

    console.error(
      "Create report error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to submit report",
    });
  } finally {
    client.release();
  }
};

// ====================================================
// PUBLIC: FIND POSSIBLE EXISTING INCIDENTS NEAR LOCATION
// ====================================================
const getNearbyIncidents = async (req, res) => {
  try {
    const categoryId = Number(req.query.categoryId);
    const problemTypeId = Number(req.query.problemTypeId);
    const latitude = Number(req.query.latitude);
    const longitude = Number(req.query.longitude);
    const radius = Math.min(Math.max(Number(req.query.radius || 100), 10), 250);

    if (!Number.isInteger(categoryId) || !Number.isInteger(problemTypeId) ||
        !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ success: false, message: 'Category, problem type and valid location are required' });
    }

    const result = await pool.query(
      `SELECT i.id,i.title,i.description,i.latitude,i.longitude,i.status,i.priority,i.report_count,
              i.created_at,a.name AS authority_name
       FROM incidents i
       LEFT JOIN authorities a ON a.id=i.authority_id
       WHERE i.category_id=$1 AND i.problem_type_id=$2
         AND i.status NOT IN ('resolved','closed','rejected','archived')
         AND i.latitude IS NOT NULL AND i.longitude IS NOT NULL`,
      [categoryId, problemTypeId]
    );

    const nearby = result.rows
      .map((item) => ({
        ...item,
        distanceMetres: Math.round(calculateDistance(latitude, longitude, Number(item.latitude), Number(item.longitude)) * 10) / 10,
      }))
      .filter((item) => item.distanceMetres <= radius)
      .sort((a, b) => a.distanceMetres - b.distanceMetres)
      .slice(0, 5);

    return res.status(200).json({ success: true, count: nearby.length, radiusMetres: radius, data: nearby });
  } catch (error) {
    console.error('Nearby incidents error:', error);
    return res.status(500).json({ success: false, message: 'Unable to check nearby incidents' });
  }
};

// ====================================================
// GET LOGGED-IN CITIZEN REPORTS
// ====================================================

const getMyReports = async (
  req,
  res
) => {
  try {
    const result =
      await pool.query(
        `
        SELECT
          r.id,
          r.description,
          r.latitude,
          r.longitude,
          r.image_url,
          r.tracking_code,
          r.created_at,

          c.name AS category_name,

          pt.id AS problem_type_id,
          pt.name AS problem_type_name,

          i.id AS incident_id,
          i.title AS incident_title,
          i.status,
          i.priority,
          i.report_count,
          i.reviewed_at,
          i.accepted_at,
          i.work_started_at,
          i.resolution_submitted_at,
          i.resolved_at,

          a.name AS authority_name,
          a.contact_phone AS authority_phone,
          a.contact_email AS authority_email,
          reviewer.full_name AS reviewed_by_name,
          assigner.full_name AS assigned_by_name,
          accepter.full_name AS accepted_by_name,
          starter.full_name AS work_started_by_name,
          resolver.full_name AS resolution_reviewed_by_name

        FROM reports r

        JOIN categories c
          ON c.id =
            r.category_id

        JOIN incidents i
          ON i.id =
            r.incident_id

        LEFT JOIN problem_types pt
          ON pt.id =
            r.problem_type_id

        LEFT JOIN authorities a
          ON a.id =
            i.authority_id

        LEFT JOIN users reviewer ON reviewer.id=i.reviewed_by
        LEFT JOIN users assigner ON assigner.id=i.assigned_by
        LEFT JOIN users accepter ON accepter.id=i.accepted_by
        LEFT JOIN users starter ON starter.id=i.work_started_by
        LEFT JOIN users resolver ON resolver.id=COALESCE(i.resolved_by, i.resolution_reviewed_by)

        WHERE r.user_id = $1

        ORDER BY
          r.created_at DESC
        `,
        [req.user.id]
      );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(
      "Get my reports error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve your reports",
    });
  }
};


// ====================================================
// PUBLIC: TRACK REPORT BY REFERENCE CODE
// ====================================================
const trackReport = async (req, res) => {
  try {
    const trackingCode = String(req.params.trackingCode || '').trim().toUpperCase();

    const result = await pool.query(
      `
      SELECT
        r.id AS report_id,
        r.tracking_code,
        r.created_at AS reported_at,
        r.description,
        i.id AS incident_id,
        i.status,
        i.priority,
        i.updated_at,
        i.reviewed_at,
        i.accepted_at,
        i.work_started_at,
        i.resolution_submitted_at,
        i.resolved_at,
        c.name AS category_name,
        pt.name AS problem_type_name,
        a.name AS authority_name,
        a.contact_person AS authority_contact_person,
        a.contact_phone AS authority_contact_phone,
        a.contact_email AS authority_contact_email,
        reviewer.full_name AS reviewed_by_name,
        assigner.full_name AS assigned_by_name,
        accepter.full_name AS accepted_by_name,
        starter.full_name AS work_started_by_name,
        resolver.full_name AS resolution_reviewed_by_name
      FROM reports r
      JOIN incidents i ON i.id = r.incident_id
      LEFT JOIN categories c ON c.id = r.category_id
      LEFT JOIN problem_types pt ON pt.id = r.problem_type_id
      LEFT JOIN authorities a ON a.id = i.authority_id
      LEFT JOIN users reviewer ON reviewer.id=i.reviewed_by
      LEFT JOIN users assigner ON assigner.id=i.assigned_by
      LEFT JOIN users accepter ON accepter.id=i.accepted_by
      LEFT JOIN users starter ON starter.id=i.work_started_by
      LEFT JOIN users resolver ON resolver.id=COALESCE(i.resolved_by, i.resolution_reviewed_by)
      WHERE UPPER(r.tracking_code) = $1
      LIMIT 1
      `,
      [trackingCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tracking code not found' });
    }

    const tracked = result.rows[0];
    const history = await pool.query(
      `SELECT h.action, h.from_status, h.to_status, h.note, h.created_at,
              u.full_name AS actor_name, u.role AS actor_role
       FROM incident_history h
       LEFT JOIN users u ON u.id=h.actor_user_id
       WHERE h.incident_id=$1
       ORDER BY h.created_at ASC`,
      [tracked.incident_id]
    );

    const progressEvidence = await pool.query(
      `SELECT file_url,media_type,mime_type,original_name,note,created_at
       FROM incident_progress_evidence WHERE incident_id=$1 ORDER BY created_at ASC`,
      [tracked.incident_id]
    );
    const resolutionEvidence = await pool.query(
      `SELECT file_url,media_type,mime_type,original_name,created_at
       FROM incident_resolution_evidence WHERE incident_id=$1 ORDER BY created_at ASC`,
      [tracked.incident_id]
    );

    return res.status(200).json({ success: true, data: {
      ...tracked,
      history: history.rows,
      progress_evidence: progressEvidence.rows,
      resolution_evidence: resolutionEvidence.rows,
    } });
  } catch (error) {
    console.error('Track report error:', error);
    return res.status(500).json({ success: false, message: 'Unable to track report' });
  }
};

const deleteMyReport = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    const result = await client.query(
      `SELECT r.id, r.incident_id, i.status, i.report_count
       FROM reports r
       JOIN incidents i ON i.id=r.incident_id
       WHERE r.id=$1 AND r.user_id=$2
       LIMIT 1`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    const item = result.rows[0];
    if (!['open','under_review'].includes(item.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'A report can only be deleted before it is assigned for field work' });
    }

    await client.query(`DELETE FROM reports WHERE id=$1`, [id]);
    if (Number(item.report_count) <= 1) {
      await client.query(`DELETE FROM incidents WHERE id=$1`, [item.incident_id]);
    } else {
      await client.query(
        `UPDATE incidents SET report_count=GREATEST(report_count-1,0), updated_at=CURRENT_TIMESTAMP WHERE id=$1`,
        [item.incident_id]
      );
    }
    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Report deleted' });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Delete report error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete report' });
  } finally {
    client.release();
  }
};

module.exports = {
  createReport,
  getNearbyIncidents,
  getMyReports,
  trackReport,
  deleteMyReport,
};
