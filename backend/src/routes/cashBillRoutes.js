import express from 'express';
import {
  getCashBills,
  getCashBillById,
  createCashBill,
  updateCashBill,
  deleteCashBill,
  downloadCashBillPDF
} from '../controllers/cashBillController.js';

const router = express.Router();

router.get('/', getCashBills);
router.get('/:id', getCashBillById);
router.post('/', createCashBill);
router.put('/:id', updateCashBill);
router.delete('/:id', deleteCashBill);
router.get('/:id/pdf', downloadCashBillPDF);

export default router;
