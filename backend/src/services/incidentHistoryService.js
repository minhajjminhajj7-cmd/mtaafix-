async function recordIncidentHistory(client, {
  incidentId,
  actorUserId = null,
  action,
  fromStatus = null,
  toStatus = null,
  note = null,
  metadata = null,
}) {
  await client.query(
    `
    INSERT INTO incident_history
    (
      incident_id,
      actor_user_id,
      action,
      from_status,
      to_status,
      note,
      metadata
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    `,
    [
      incidentId,
      actorUserId,
      action,
      fromStatus,
      toStatus,
      note,
      metadata ? JSON.stringify(metadata) : null,
    ],
  );
}

module.exports = { recordIncidentHistory };
