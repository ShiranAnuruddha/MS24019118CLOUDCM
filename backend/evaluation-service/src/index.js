const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { pool } = require("./db");

const app = express();
const port = process.env.PORT || 4005;

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
    CREATE TABLE IF NOT EXISTS hs_evaluation_reports (
      id SERIAL PRIMARY KEY,
      booking_id INTEGER NOT NULL,
      candidate_id TEXT NOT NULL,
      interviewer_id TEXT NOT NULL,
      scores JSONB NOT NULL,
      summary TEXT NOT NULL,
      strengths TEXT[] DEFAULT '{}',
      improvements TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "evaluation-service" });
});

app.post("/evaluations/reports", async (req, res) => {
  const user = getUser(req);
  if (user.role !== "interviewer") {
    return res.status(403).json({ message: "Only interviewers can create reports" });
  }

  const {
    bookingId,
    candidateId,
    scores = {},
    summary = "",
    strengths = [],
    improvements = [],
  } = req.body;

  if (!bookingId || !candidateId || !summary) {
    return res.status(400).json({ message: "bookingId, candidateId and summary are required" });
  }

  const result = await pool.query(`
    INSERT INTO hs_evaluation_reports (
      booking_id, candidate_id, interviewer_id, scores, summary, strengths, improvements
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `, [bookingId, candidateId, user.id, scores, summary, strengths, improvements]);

  res.status(201).json(result.rows[0]);
});

app.get("/evaluations/reports/mine", async (req, res) => {
  const user = getUser(req);
  const query = user.role === "interviewer"
    ? "SELECT * FROM hs_evaluation_reports WHERE interviewer_id=$1 ORDER BY created_at DESC"
    : "SELECT * FROM hs_evaluation_reports WHERE candidate_id=$1 ORDER BY created_at DESC";
  const result = await pool.query(query, [user.id]);
  res.json(result.rows);
});

app.get("/evaluations/reports/booking/:bookingId", async (req, res) => {
  const result = await pool.query(`
    SELECT * FROM hs_evaluation_reports
    WHERE booking_id=$1
    ORDER BY created_at DESC
  `, [req.params.bookingId]);

  res.json(result.rows);
});

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log(`Evaluation service listening on ${port}`));
  })
  .catch((error) => {
    console.error("Failed to start evaluation service", error);
    process.exit(1);
  });
