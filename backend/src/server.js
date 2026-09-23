import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import cashBillRoutes from './routes/cashBillRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Vercel's serverless functions sit behind a proxy — express-rate-limit needs
// this to read the real client IP from X-Forwarded-For instead of erroring.
app.set('trust proxy', 1);

// Fixed known origins, plus this project's own Vercel preview-deploy pattern
// (each preview gets a random subdomain, so it can't be listed by name).
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://billing-web-alpha.vercel.app',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()) : []),
];
const VERCEL_PREVIEW_PATTERN = /^https:\/\/billing-web-[a-z0-9]+-amudhas-projects-8accd42e\.vercel\.app$/;

// Middleware
// This API is called cross-origin by the frontend on its own Vercel domain,
// so the resource policy has to allow that explicitly — helmet's "same-origin"
// default would otherwise let CORS through but still have the browser block
// the response body.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header at all means a non-browser caller (curl, server-to-server,
      // Vercel's own health checks) — not something CORS is meant to police.
      if (!origin || ALLOWED_ORIGINS.includes(origin) || VERCEL_PREVIEW_PATTERN.test(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// /api/auth is deliberately not behind requireAuth — that's where a session
// comes from in the first place. Everything else needs one.
app.use('/api/auth', authRoutes);
app.use('/api/companies', requireAuth, companyRoutes);
app.use('/api/customers', requireAuth, customerRoutes);
app.use('/api/products', requireAuth, productRoutes);
app.use('/api/invoices', requireAuth, invoiceRoutes);
app.use('/api/cash-bills', requireAuth, cashBillRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Billing API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server only in local development (not in Vercel serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 API Documentation available at http://localhost:${PORT}/health`);
  });
}

export default app;
