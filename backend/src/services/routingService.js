const getRoutingAuthority = async (client, categoryId, problemTypeId = null) => {
  // Prefer routing configured directly on a problem type. This makes routing
  // specific enough for future categories that may contain several departments.
  if (problemTypeId) {
    const specific = await client.query(
      `
      SELECT
        a.id,
        a.name,
        a.authority_type,
        a.contact_phone,
        a.contact_email,
        a.contact_person,
        a.address
      FROM problem_types pt
      JOIN authorities a ON a.id = pt.authority_id
      WHERE pt.id = $1
        AND pt.active = TRUE
        AND a.is_active = TRUE
      LIMIT 1
      `,
      [problemTypeId]
    );

    if (specific.rows.length > 0) {
      return specific.rows[0];
    }
  }

  // Backward-compatible category routing fallback.
  const result = await client.query(
    `
    SELECT
      a.id,
      a.name,
      a.authority_type,
      a.contact_phone,
      a.contact_email,
      a.contact_person,
      a.address
    FROM routing_rules rr
    JOIN authorities a ON a.id = rr.authority_id
    WHERE rr.category_id = $1
      AND rr.active = TRUE
      AND a.is_active = TRUE
    ORDER BY rr.id
    LIMIT 1
    `,
    [categoryId]
  );

  return result.rows[0] || null;
};

module.exports = {
  getRoutingAuthority,
};
