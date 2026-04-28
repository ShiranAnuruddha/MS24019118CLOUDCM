const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { pool } = require("./db");

const app = express();
const port = process.env.PORT || 4003;
const upload = multer({ storage: multer.memoryStorage() });

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
    CREATE TABLE IF NOT EXISTS hs_submissions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      booking_id INTEGER,
      github_url TEXT,
      storage_url TEXT,
      original_filename TEXT,
      notes TEXT,
      annotations TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

async function storeFile(fileBuffer, originalname) {
  const safeName = `${Date.now()}-${crypto.randomUUID()}-${originalname.replace(/\s+/g, "-")}`;

  if (process.env.S3_BUCKET) {
    const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: safeName,
      Body: fileBuffer,
      ContentType: "application/octet-stream",
    }));

    if (process.env.S3_PUBLIC_BASE_URL) {
      return `${process.env.S3_PUBLIC_BASE_URL}/${safeName}`;
    }
    return `s3://${process.env.S3_BUCKET}/${safeName}`;
  }

  const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  const target = path.join(uploadDir, safeName);
  fs.writeFileSync(target, fileBuffer);
  return `/uploads/${safeName}`;
}

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "submission-service" });
});

app.post("/submissions", upload.single("file"), async (req, res) => {
  const user = getUser(req);
  const { bookingId, githubUrl, notes = "" } = req.body;

  if (!req.file && !githubUrl) {
    return res.status(400).json({ message: "Attach a file or provide a GitHub URL" });
  }

  let storageUrl = null;
  let originalFilename = null;

  if (req.file) {
    storageUrl = await storeFile(req.file.buffer, req.file.originalname);
    originalFilename = req.file.originalname;
  }

  const result = await pool.query(`
    INSERT INTO hs_submissions (
      user_id, booking_id, github_url, storage_url, original_filename, notes, annotations
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
  `, [
    user.id,
    bookingId || null,
    githubUrl || null,
    storageUrl,
    originalFilename,
    notes,
    "",
  ]);

  res.status(201).json(result.rows[0]);
});

app.get("/submissions/mine", async (req, res) => {
  const user = getUser(req);
  const result = await pool.query(`
    SELECT * FROM hs_submissions
    WHERE user_id=$1
    ORDER BY created_at DESC
  `, [user.id]);

  res.json(result.rows);
});

app.get("/submissions/booking/:bookingId", async (req, res) => {
  const result = await pool.query(`
    SELECT * FROM hs_submissions
    WHERE booking_id=$1
    ORDER BY created_at DESC
  `, [req.params.bookingId]);

  res.json(result.rows);
});

app.patch("/submissions/:id/annotations", async (req, res) => {
  const user = getUser(req);
  if (user.role !== "interviewer") {
    return res.status(403).json({ message: "Only interviewers can annotate submissions" });
  }

  const { annotations = "" } = req.body;
  const result = await pool.query(`
    UPDATE hs_submissions
    SET annotations=$1
    WHERE id=$2
    RETURNING *
  `, [annotations, req.params.id]);

  if (!result.rows.length) {
    return res.status(404).json({ message: "Submission not found" });
  }

  res.json(result.rows[0]);
});

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log(`Submission service listening on ${port}`));
  })
  .catch((error) => {
    console.error("Failed to start submission service", error);
    process.exit(1);
  });
