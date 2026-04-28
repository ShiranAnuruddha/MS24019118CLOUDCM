const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { pool } = require("./db");

const app = express();
const port = process.env.PORT || 4004;

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

function getUser(req) {
  return {
    id: req.headers["x-user-id"],
    email: req.headers["x-user-email"],
    role: req.headers["x-user-role"] || "candidate",
    name: req.headers["x-user-name"] || "Unknown User",
  };
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hs_messages (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      sender_id TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "messaging-service" });
});

app.get("/messages/threads/:bookingId", async (req, res) => {
  const result = await pool.query(`
    SELECT * FROM hs_messages
    WHERE booking_id=$1
    ORDER BY created_at ASC
  `, [req.params.bookingId]);

  res.json(result.rows);
});

app.post("/messages/threads/:bookingId/messages", async (req, res) => {
  const user = getUser(req);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Message content is required" });
  }

  const result = await pool.query(`
    INSERT INTO hs_messages (booking_id, sender_id, sender_role, sender_name, content)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
  `, [req.params.bookingId, user.id, user.role, user.name, content.trim()]);

  res.status(201).json(result.rows[0]);
});

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log(`Messaging service listening on ${port}`));
  })
  .catch((error) => {
    console.error("Failed to start messaging service", error);
    process.exit(1);
  });
