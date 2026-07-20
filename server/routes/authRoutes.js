// server/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/User.js";

const router = express.Router();
const useGoogleBypass = process.env.GOOGLE_OAUTH_BYPASS === "true";

const getFrontendUrl = (req) => {
  const fallback = process.env.FRONTEND_URL || "https://runli.vercel.app";
  const redirect = typeof req.query.redirect === "string" ? req.query.redirect : "";
  if (!redirect) return fallback;
  try {
    const url = new URL(redirect);
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;
    return `${url.protocol}//${url.host}`;
  } catch {
    return fallback;
  }
};

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Google Auth Routes
router.get('/google', async (req, res, next) => {
  const frontendUrl = getFrontendUrl(req);

  if (useGoogleBypass) {
    try {
      let user = await User.findOne({ email: "test.google.user@example.com" });
      if (!user) {
        user = await User.create({
          name: "Google Test User",
          email: "test.google.user@example.com",
          password: Math.random().toString(36).slice(-8)
        });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (err) {
      console.error("Google Bypass Error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  }

  req.session.oauthRedirect = frontendUrl;
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const frontendUrl = req.session?.oauthRedirect || getFrontendUrl(req);

  if (useGoogleBypass) {
    return res.redirect(`${frontendUrl}/login`);
  }

  return passport.authenticate('google', { failureRedirect: `${frontendUrl}/login` }, (err, user) => {
    if (req.session) {
      delete req.session.oauthRedirect;
    }

    if (err || !user) {
      if (err) console.error("Google OAuth Error:", err);
      return res.redirect(`${frontendUrl}/login`);
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  })(req, res, next);
});

// DELETE /api/auth/account - Delete user account and memories
router.delete("/account", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Delete user from DB
    await User.findByIdAndDelete(userId);

    // Also delete memories in Vector DB (fire and forget)
    import('../services/ragService.js').then(({ deleteUserMemories }) => {
        deleteUserMemories(userId);
    }).catch(err => console.error("Failed to load ragService for deletion:", err));

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
