import express from 'express';
import {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  downloadQuotationPDF
} from '../controllers/quotationController.js';

const router = express.Router();

router.get('/', getQuotations);
router.get('/:id', getQuotationById);
router.get('/:id/pdf', downloadQuotationPDF);
router.post('/', createQuotation);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

export default router;

