const pool = require('../config/database');

function accessFor(user, alias = 'i', startIndex = 1) {
  if (user.role === 'service_provider') {
    return { clause: `${alias}.authority_id = $${startIndex}`, params: [user.authority_id] };
  }
  return { clause: 'TRUE', params: [] };
}

const getAnalyticsSummary = async (req, res) => {
  try {
    if (req.user.role === 'service_provider' && !req.user.authority_id) {
      return res.status(403).json({ success: false, message: 'Your account is not linked to a department' });
    }

    const access = accessFor(req.user);
    const where = access.clause;
    const params = access.params;

    const overviewResult = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE i.status NOT IN ('resolved','closed','rejected','archived'))::int AS active,
         COUNT(*) FILTER (WHERE i.status='open')::int AS open,
         COUNT(*) FILTER (WHERE i.status='under_review')::int AS reviewed,
         COUNT(*) FILTER (WHERE i.status='assigned')::int AS accepted,
         COUNT(*) FILTER (WHERE i.status='in_progress')::int AS in_progress,
         COUNT(*) FILTER (WHERE i.status='resolved')::int AS resolved,
         COUNT(*) FILTER (WHERE i.priority='critical' AND i.status NOT IN ('resolved','closed','rejected','archived'))::int AS critical,
         COUNT(*) FILTER (
           WHERE i.status NOT IN ('resolved','closed','rejected','archived')
             AND CURRENT_TIMESTAMP - COALESCE(i.updated_at,i.created_at) >
               CASE i.priority
                 WHEN 'critical' THEN INTERVAL '24 hours'
                 WHEN 'high' THEN INTERVAL '48 hours'
                 WHEN 'normal' THEN INTERVAL '72 hours'
                 ELSE INTERVAL '120 hours'
               END
         )::int AS overdue,
         COALESCE(SUM(i.report_count),0)::int AS citizen_reports,
         ROUND((AVG(EXTRACT(EPOCH FROM (i.resolved_at - i.created_at))/3600.0)
           FILTER (WHERE i.resolved_at IS NOT NULL))::numeric,1) AS avg_resolution_hours
       FROM incidents i
       WHERE ${where}`,
      params
    );

    const categoryResult = await pool.query(
      `SELECT c.id, c.name,
              COUNT(i.id)::int AS total,
              COUNT(i.id) FILTER (WHERE i.status NOT IN ('resolved','closed','rejected','archived'))::int AS active,
              COUNT(i.id) FILTER (WHERE i.status='resolved')::int AS resolved
       FROM categories c
       LEFT JOIN incidents i ON i.category_id=c.id
         ${req.user.role === 'service_provider' ? 'AND i.authority_id=$1' : ''}
       WHERE c.active=TRUE
       GROUP BY c.id,c.name
       ORDER BY total DESC,c.name`,
      params
    );

    const priorityResult = await pool.query(
      `SELECT COALESCE(i.priority,'normal') AS key, COUNT(*)::int AS value
       FROM incidents i
       WHERE ${where}
         AND i.status NOT IN ('closed','rejected','archived')
       GROUP BY COALESCE(i.priority,'normal')
       ORDER BY CASE COALESCE(i.priority,'normal') WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END`,
      params
    );

    const statusResult = await pool.query(
      `SELECT i.status AS key, COUNT(*)::int AS value
       FROM incidents i
       WHERE ${where}
       GROUP BY i.status
       ORDER BY value DESC`,
      params
    );

    const trendResult = await pool.query(
      `WITH days AS (
         SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day')::date AS day
       )
       SELECT d.day,
              COUNT(i.id) FILTER (WHERE i.created_at::date=d.day)::int AS reported,
              COUNT(i.id) FILTER (WHERE i.resolved_at::date=d.day)::int AS resolved
       FROM days d
       LEFT JOIN incidents i ON (${where})
         AND (i.created_at::date=d.day OR i.resolved_at::date=d.day)
       GROUP BY d.day
       ORDER BY d.day`,
      params
    );

    const hotspotResult = await pool.query(
      `SELECT ROUND(i.latitude::numeric,3) AS latitude,
              ROUND(i.longitude::numeric,3) AS longitude,
              COUNT(*)::int AS incident_count,
              COUNT(*) FILTER (WHERE i.status NOT IN ('resolved','closed','rejected','archived'))::int AS active_count,
              COUNT(*) FILTER (WHERE i.priority='critical')::int AS critical_count
       FROM incidents i
       WHERE ${where}
         AND i.latitude IS NOT NULL AND i.longitude IS NOT NULL
       GROUP BY ROUND(i.latitude::numeric,3), ROUND(i.longitude::numeric,3)
       HAVING COUNT(*) >= 1
       ORDER BY incident_count DESC, critical_count DESC
       LIMIT 8`,
      params
    );

    let departments = [];
    if (req.user.role === 'super_admin') {
      const departmentResult = await pool.query(
        `SELECT a.id,a.name,a.contact_phone,a.contact_email,a.is_active,
                COUNT(i.id)::int AS total,
                COUNT(i.id) FILTER (WHERE i.status NOT IN ('resolved','closed','rejected','archived'))::int AS active,
                COUNT(i.id) FILTER (WHERE i.status='resolved')::int AS resolved,
                COUNT(i.id) FILTER (WHERE i.priority='critical' AND i.status NOT IN ('resolved','closed','rejected','archived'))::int AS critical,
                COUNT(i.id) FILTER (
                  WHERE i.status NOT IN ('resolved','closed','rejected','archived')
                    AND CURRENT_TIMESTAMP - COALESCE(i.updated_at,i.created_at) >
                      CASE i.priority
                        WHEN 'critical' THEN INTERVAL '24 hours'
                        WHEN 'high' THEN INTERVAL '48 hours'
                        WHEN 'normal' THEN INTERVAL '72 hours'
                        ELSE INTERVAL '120 hours'
                      END
                )::int AS overdue,
                ROUND((AVG(EXTRACT(EPOCH FROM (i.resolved_at-i.created_at))/3600.0)
                  FILTER (WHERE i.resolved_at IS NOT NULL))::numeric,1) AS avg_resolution_hours
         FROM authorities a
         LEFT JOIN incidents i ON i.authority_id=a.id
         GROUP BY a.id,a.name,a.contact_phone,a.contact_email,a.is_active
         ORDER BY overdue DESC, active DESC, a.name`);
      departments = departmentResult.rows;
    }

    return res.status(200).json({
      success: true,
      data: {
        overview: overviewResult.rows[0],
        categories: categoryResult.rows,
        priorities: priorityResult.rows,
        statuses: statusResult.rows,
        trend: trendResult.rows,
        hotspots: hotspotResult.rows,
        departments,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics summary error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load analytics' });
  }
};

module.exports = { getAnalyticsSummary };
