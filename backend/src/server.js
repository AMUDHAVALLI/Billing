import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import companyRoutes from './routes/companyRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import productRoutes from './routes/productRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/companies', companyRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/invoices', invoiceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Billing API is running' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API Documentation available at http://localhost:${PORT}/health`);
});

export default app;
