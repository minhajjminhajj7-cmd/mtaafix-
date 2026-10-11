async function notifyIncidentCitizens(client, incidentId, title, message, notificationType = "incident_update") {
  await client.query(
    `
    INSERT INTO notifications
      (user_id, incident_id, title, message, notification_type)
    SELECT DISTINCT
      r.user_id,
      r.incident_id,
      $2,
      $3,
      $4
    FROM reports r
    WHERE r.incident_id = $1
      AND r.user_id IS NOT NULL
    `,
    [incidentId, title, message, notificationType]
  );
}

async function notifyAuthorityUsers(client, authorityId, incidentId, title, message, notificationType = "department_message") {
  await client.query(
    `
    INSERT INTO notifications
      (user_id, incident_id, title, message, notification_type)
    SELECT
      u.id,
      $2,
      $3,
      $4,
      $5
    FROM users u
    WHERE u.authority_id = $1
      AND u.role = 'service_provider'
      AND u.is_active = TRUE
    `,
    [authorityId, incidentId, title, message, notificationType]
  );
}

module.exports = { notifyIncidentCitizens, notifyAuthorityUsers };
