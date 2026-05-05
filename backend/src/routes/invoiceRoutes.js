import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
  getDashboardStats,
  getMonthlyReport,
  getYearlyReport,
  getHsnReport
} from '../controllers/invoiceController.js';

const router = express.Router();

router.get('/dashboard/stats', getDashboardStats);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', downloadInvoicePDF);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

router.get('/reports/monthly', getMonthlyReport);
router.get('/reports/yearly', getYearlyReport);
router.get('/reports/hsn', getHsnReport);

export default router;
