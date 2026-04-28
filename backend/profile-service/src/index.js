const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { pool } = require("./db");

const app = express();
const port = process.env.PORT || 4001;

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

function requireInternal(req, res, next) {
  const token = req.headers["x-internal-token"];
  if (token !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({ message: "Forbidden internal route" });
  }
  next();
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hs_profiles (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      profile_type TEXT NOT NULL CHECK (profile_type IN ('candidate', 'interviewer')),
      full_name TEXT NOT NULL,
      domain TEXT,
      interview_types TEXT[] DEFAULT '{}',
      experience_level TEXT,
      ratings NUMERIC(3,2) DEFAULT 5.0,
      specialization_badges TEXT[] DEFAULT '{}',
      bio TEXT,
      hourly_rate NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hs_availability_slots (
      id SERIAL PRIMARY KEY,
      interviewer_id TEXT NOT NULL REFERENCES hs_profiles(user_id) ON DELETE CASCADE,
      slot_start TIMESTAMPTZ NOT NULL,
      slot_end TIMESTAMPTZ NOT NULL,
      is_booked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    INSERT INTO hs_profiles (
      user_id, email, profile_type, full_name, domain, interview_types, experience_level,
      ratings, specialization_badges, bio, hourly_rate
    )
    VALUES
      ('int-1','alice@hiresphere.local','interviewer','Alice Fernando','Backend', ARRAY['DSA','System Design'], 'Senior', 4.80, ARRAY['Java','Spring','Distributed Systems'], 'Senior backend engineer and interviewer.', 45),
      ('int-2','bob@hiresphere.local','interviewer','Bob Perera','Frontend', ARRAY['Behavioral','System Design'], 'Staff', 4.90, ARRAY['React','Architecture'], 'Frontend architect focusing on product interviews.', 55),
      ('int-3','carla@hiresphere.local','interviewer','Carla De Silva','AI/ML', ARRAY['DSA','Behavioral'], 'Principal', 4.95, ARRAY['Python','ML'], 'Principal ML engineer with hiring experience.', 65)
    ON CONFLICT (user_id) DO NOTHING
  `);

  await pool.query(`
    INSERT INTO hs_availability_slots (interviewer_id, slot_start, slot_end, is_booked)
    SELECT 'int-1', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 1 hour', FALSE
    WHERE NOT EXISTS (SELECT 1 FROM hs_availability_slots WHERE interviewer_id='int-1')
  `);

  await pool.query(`
    INSERT INTO hs_availability_slots (interviewer_id, slot_start, slot_end, is_booked)
    SELECT 'int-2', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 1 hour', FALSE
    WHERE NOT EXISTS (SELECT 1 FROM hs_availability_slots WHERE interviewer_id='int-2')
  `);

  await pool.query(`
    INSERT INTO hs_availability_slots (interviewer_id, slot_start, slot_end, is_booked)
    SELECT 'int-3', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 1 hour', FALSE
    WHERE NOT EXISTS (SELECT 1 FROM hs_availability_slots WHERE interviewer_id='int-3')
  `);
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "profile-service" });
});

app.get("/profiles/me", async (req, res) => {
  const user = getUser(req);
  const result = await pool.query("SELECT * FROM hs_profiles WHERE user_id=$1", [user.id]);
  if (!result.rows.length) {
    return res.json({
      user_id: user.id,
      email: user.email,
      full_name: user.name,
      profile_type: user.role,
      interview_types: [],
      specialization_badges: [],
      ratings: 5,
      bio: "",
      hourly_rate: 0,
    });
  }
  res.json(result.rows[0]);
});

app.post("/profiles/me/upsert", async (req, res) => {
  const user = getUser(req);
  const {
    full_name,
    profile_type,
    domain,
    interview_types = [],
    experience_level,
    ratings = 5,
    specialization_badges = [],
    bio = "",
    hourly_rate = 0,
  } = req.body;

  const result = await pool.query(`
    INSERT INTO hs_profiles (
      user_id, email, profile_type, full_name, domain, interview_types,
      experience_level, ratings, specialization_badges, bio, hourly_rate, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      email=EXCLUDED.email,
      profile_type=EXCLUDED.profile_type,
      full_name=EXCLUDED.full_name,
      domain=EXCLUDED.domain,
      interview_types=EXCLUDED.interview_types,
      experience_level=EXCLUDED.experience_level,
      ratings=EXCLUDED.ratings,
      specialization_badges=EXCLUDED.specialization_badges,
      bio=EXCLUDED.bio,
      hourly_rate=EXCLUDED.hourly_rate,
      updated_at=NOW()
    RETURNING *
  `, [
    user.id,
    user.email,
    profile_type || user.role,
    full_name || user.name,
    domain || null,
    interview_types,
    experience_level || null,
    ratings,
    specialization_badges,
    bio,
    hourly_rate,
  ]);

  res.json(result.rows[0]);
});

app.get("/profiles/interviewers", async (req, res) => {
  const { domain, interviewType, experienceLevel, available, minRating = 0 } = req.query;

  const result = await pool.query(`
    SELECT p.*,
      COALESCE(
        json_agg(
          json_build_object('id', s.id, 'slot_start', s.slot_start, 'slot_end', s.slot_end, 'is_booked', s.is_booked)
        ) FILTER (WHERE s.id IS NOT NULL),
        '[]'
      ) AS slots
    FROM hs_profiles p
    LEFT JOIN hs_availability_slots s
      ON s.interviewer_id = p.user_id
      AND s.is_booked = FALSE
      AND ($4::boolean IS NULL OR s.slot_start >= NOW())
    WHERE p.profile_type = 'interviewer'
      AND ($1::text IS NULL OR p.domain = $1)
      AND ($2::text IS NULL OR $2 = ANY(p.interview_types))
      AND ($3::text IS NULL OR p.experience_level = $3)
      AND p.ratings >= $5
    GROUP BY p.user_id
    ORDER BY p.ratings DESC, p.full_name ASC
  `, [
    domain || null,
    interviewType || null,
    experienceLevel || null,
    available === undefined ? null : available === "true",
    Number(minRating || 0),
  ]);

  res.json(result.rows);
});

app.post("/profiles/interviewer/slots", async (req, res) => {
  const user = getUser(req);
  const { slot_start, slot_end } = req.body;

  const profile = await pool.query("SELECT * FROM hs_profiles WHERE user_id=$1", [user.id]);
  if (!profile.rows.length || profile.rows[0].profile_type !== "interviewer") {
    return res.status(403).json({ message: "Only interviewer profiles can create slots" });
  }

  const result = await pool.query(`
    INSERT INTO hs_availability_slots (interviewer_id, slot_start, slot_end)
    VALUES ($1,$2,$3)
    RETURNING *
  `, [user.id, slot_start, slot_end]);

  res.status(201).json(result.rows[0]);
});

app.get("/profiles/interviewer/me/slots", async (req, res) => {
  const user = getUser(req);
  const result = await pool.query(`
    SELECT * FROM hs_availability_slots
    WHERE interviewer_id=$1
    ORDER BY slot_start ASC
  `, [user.id]);
  res.json(result.rows);
});

app.get("/profiles/internal/slots/:slotId", requireInternal, async (req, res) => {
  const result = await pool.query(`
    SELECT s.*, p.full_name AS interviewer_name, p.domain, p.hourly_rate
    FROM hs_availability_slots s
    JOIN hs_profiles p ON p.user_id = s.interviewer_id
    WHERE s.id=$1
  `, [req.params.slotId]);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Slot not found" });
  }

  res.json(result.rows[0]);
});

app.post("/profiles/internal/slots/:slotId/reserve", requireInternal, async (req, res) => {
  const result = await pool.query(`
    UPDATE hs_availability_slots
    SET is_booked=TRUE
    WHERE id=$1 AND is_booked=FALSE
    RETURNING *
  `, [req.params.slotId]);

  if (!result.rows.length) {
    return res.status(409).json({ message: "Slot already reserved" });
  }

  res.json(result.rows[0]);
});

app.post("/profiles/internal/slots/:slotId/release", requireInternal, async (req, res) => {
  const result = await pool.query(`
    UPDATE hs_availability_slots
    SET is_booked=FALSE
    WHERE id=$1
    RETURNING *
  `, [req.params.slotId]);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Slot not found" });
  }

  res.json(result.rows[0]);
});

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log(`Profile service listening on ${port}`));
  })
  .catch((error) => {
    console.error("Failed to start profile service", error);
    process.exit(1);
  });
