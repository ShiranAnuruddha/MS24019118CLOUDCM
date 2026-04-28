const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { pool } = require("./db");

const app = express();
const port = process.env.PORT || 4002;

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
    CREATE TABLE IF NOT EXISTS hs_bookings (
      id SERIAL PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      candidate_email TEXT NOT NULL,
      interviewer_id TEXT NOT NULL,
      slot_id INTEGER NOT NULL,
      interview_type TEXT NOT NULL,
      scheduled_start TIMESTAMPTZ NOT NULL,
      scheduled_end TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','failed','refunded')),
      amount NUMERIC(10,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "booking-service" });
});

app.post("/bookings", async (req, res) => {
  const user = getUser(req);
  if (user.role !== "candidate") {
    return res.status(403).json({ message: "Only candidates can create bookings" });
  }

  const { interviewerId, slotId, interviewType, notes = "" } = req.body;
  if (!interviewerId || !slotId || !interviewType) {
    return res.status(400).json({ message: "interviewerId, slotId and interviewType are required" });
  }

  const slotRes = await fetch(`${process.env.PROFILE_SERVICE_URL}/profiles/internal/slots/${slotId}`, {
    headers: { "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN },
  });

  if (!slotRes.ok) {
    return res.status(404).json({ message: "Slot not found" });
  }

  const slot = await slotRes.json();

  const reserveRes = await fetch(`${process.env.PROFILE_SERVICE_URL}/profiles/internal/slots/${slotId}/reserve`, {
    method: "POST",
    headers: { "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN },
  });

  if (!reserveRes.ok) {
    return res.status(409).json({ message: "Selected slot is not available" });
  }

  try {
    const result = await pool.query(`
      INSERT INTO hs_bookings (
        candidate_id, candidate_email, interviewer_id, slot_id, interview_type,
        scheduled_start, scheduled_end, amount, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      user.id,
      user.email || `${user.id}@local`,
      interviewerId,
      slotId,
      interviewType,
      slot.slot_start,
      slot.slot_end,
      slot.hourly_rate || 0,
      notes,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await fetch(`${process.env.PROFILE_SERVICE_URL}/profiles/internal/slots/${slotId}/release`, {
      method: "POST",
      headers: { "x-internal-token": process.env.INTERNAL_SERVICE_TOKEN },
    });
    throw error;
  }
});

app.post("/bookings/:id/pay", async (req, res) => {
  const user = getUser(req);
  const booking = await pool.query("SELECT * FROM hs_bookings WHERE id=$1", [req.params.id]);

  if (!booking.rows.length) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.rows[0].candidate_id !== user.id) {
    return res.status(403).json({ message: "You can only pay for your own booking" });
  }

  const result = await pool.query(`
    UPDATE hs_bookings
    SET payment_status='paid', updated_at=NOW()
    WHERE id=$1
    RETURNING *
  `, [req.params.id]);

  res.json({
    paymentGateway: "mock-payment",
    paymentReference: `PAY-${req.params.id}-${Date.now()}`,
    booking: result.rows[0],
  });
});

app.get("/bookings/mine", async (req, res) => {
  const user = getUser(req);
  let query;
  let params;
  if (user.role === "interviewer") {
    query = "SELECT * FROM hs_bookings WHERE interviewer_id=$1 ORDER BY scheduled_start DESC";
    params = [user.id];
  } else {
    query = "SELECT * FROM hs_bookings WHERE candidate_id=$1 ORDER BY scheduled_start DESC";
    params = [user.id];
  }

  const result = await pool.query(query, params);
  res.json(result.rows);
});

app.patch("/bookings/:id/status", async (req, res) => {
  const user = getUser(req);
  const { status } = req.body;

  if (!["accepted", "rejected", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const booking = await pool.query("SELECT * FROM hs_bookings WHERE id=$1", [req.params.id]);
  if (!booking.rows.length) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const current = booking.rows[0];
  const allowed =
    (user.role === "interviewer" && current.interviewer_id === user.id && ["accepted", "rejected", "completed"].includes(status)) ||
    (user.role === "candidate" && current.candidate_id === user.id && status === "cancelled");

  if (!allowed) {
    return res.status(403).json({ message: "Not allowed to update this booking" });
  }

  const result = await pool.query(`
    UPDATE hs_bookings
    SET status=$1, updated_at=NOW()
    WHERE id=$2
    RETURNING *
  `, [status, req.params.id]);

  res.json(result.rows[0]);
});

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log(`Booking service listening on ${port}`));
  })
  .catch((error) => {
    console.error("Failed to start booking service", error);
    process.exit(1);
  });
