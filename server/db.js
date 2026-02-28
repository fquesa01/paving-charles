import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function saveRadioLog({ channel, userName, transcript, durationSec }) {
  const result = await pool.query(
    `INSERT INTO radio_logs (channel, user_name, transcript, audio_duration_sec)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [channel, userName, transcript, durationSec || 0]
  );
  return result.rows[0];
}

export async function getRadioLogs(channel, limit = 50) {
  const result = await pool.query(
    `SELECT * FROM radio_logs WHERE channel = $1 ORDER BY created_at DESC LIMIT $2`,
    [channel, limit]
  );
  return result.rows.reverse();
}

export async function saveChecklistAction({ radioLogId, projectId, actionType, itemText }) {
  const result = await pool.query(
    `INSERT INTO checklist_actions (radio_log_id, project_id, action_type, item_text)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [radioLogId, projectId, actionType, itemText]
  );
  return result.rows[0];
}

export async function getChecklistActions(projectId) {
  const result = await pool.query(
    `SELECT ca.*, rl.transcript, rl.user_name, rl.channel
     FROM checklist_actions ca
     LEFT JOIN radio_logs rl ON ca.radio_log_id = rl.id
     WHERE ca.project_id = $1
     ORDER BY ca.created_at DESC`,
    [projectId]
  );
  return result.rows;
}

export default pool;
