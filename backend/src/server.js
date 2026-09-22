import express from 'express';
import cors from 'cors';
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

// Middleware
app.use(cors());
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
