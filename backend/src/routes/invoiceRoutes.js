import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
  getDashboardStats
} from '../controllers/invoiceController.js';

const router = express.Router();

router.get('/dashboard/stats', getDashboardStats);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.get('/:id/pdf', downloadInvoicePDF);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

export default router;
