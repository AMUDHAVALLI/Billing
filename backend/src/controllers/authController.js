import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

const TOKEN_TTL = '30d';

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// Only works once — the first account becomes the admin, and this closes
// itself after that. There is no multi-user model here, just one login
// gating the whole app, so an open registration endpoint would just be an
// unauthenticated way to create a session.
export async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await prisma.user.count();
    if (existing > 0) {
      return res.status(403).json({ error: 'An account already exists. Sign in instead.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase().trim(), passwordHash },
    });

    res.status(201).json({ token: issueToken(user), email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    // Same message either way — confirming which emails exist is its own leak.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Incorrect email or password' });
    }

    res.json({ token: issueToken(user), email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ error: 'Not signed in' });
    res.json({ email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Lets the frontend show "Create the first account" vs "Sign in" without
// guessing — registration is only ever valid once, before anyone exists.
export async function status(req, res) {
  try {
    const count = await prisma.user.count();
    res.json({ needsSetup: count === 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
