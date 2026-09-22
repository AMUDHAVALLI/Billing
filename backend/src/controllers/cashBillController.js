import prisma from '../config/database.js';
import { generateCashBillPDF } from '../utils/cashBillPdfGenerator.js';

// Get all cash bills with pagination and search
export async function getCashBills(req, res) {
  try {
    const { search, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { billNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [cashBills, total] = await Promise.all([
      prisma.cashBill.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          items: true
        },
        orderBy: { date: 'desc' }
      }),
      prisma.cashBill.count({ where })
    ]);

    res.json({
      cashBills,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.max(1, Math.ceil(total / limitNum))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get cash bill by ID
export async function getCashBillById(req, res) {
  try {
    const { id } = req.params;
    const cashBill = await prisma.cashBill.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!cashBill) {
      return res.status(404).json({ error: 'Cash Bill not found' });
    }

    res.json(cashBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create new Cash / Service Bill
export async function createCashBill(req, res) {
  try {
    const { billNumber: customBillNum, clientName, date, items, status } = req.body;

    if (!clientName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Client Name and at least one item are required.' });
    }

    // Process items & calculate total
    let grandTotal = 0;
    const processedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = parseFloat((qty * rate).toFixed(2));
      grandTotal += amount;
      return {
        particulars: item.particulars || 'Service/Item',
        quantity: qty,
        rate: rate,
        amount: amount
      };
    });

    // Determine Bill Number
    let finalBillNumber = customBillNum;
    if (!finalBillNumber || finalBillNumber.trim() === '') {
      const lastBill = await prisma.cashBill.findFirst({
        orderBy: { createdAt: 'desc' }
      });

      let nextSeq = 200;
      if (lastBill && lastBill.billNumber) {
        const match = lastBill.billNumber.match(/\d+/);
        if (match) {
          nextSeq = parseInt(match[0]) + 1;
        }
      }
      finalBillNumber = `${nextSeq}`;
    }

    // Save CashBill to database
    const cashBill = await prisma.cashBill.create({
      data: {
        billNumber: finalBillNumber,
        clientName: clientName.trim(),
        date: date ? new Date(date) : new Date(),
        total: parseFloat(grandTotal.toFixed(2)),
        status: status || 'paid',
        items: {
          create: processedItems
        }
      },
      include: { items: true }
    });

    res.status(201).json(cashBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update Cash / Service Bill
export async function updateCashBill(req, res) {
  try {
    const { id } = req.params;
    const { billNumber, clientName, date, items, status } = req.body;

    const existingBill = await prisma.cashBill.findUnique({ where: { id } });
    if (!existingBill) {
      return res.status(404).json({ error: 'Cash Bill not found' });
    }

    let grandTotal = existingBill.total;
    let processedItems = null;

    if (items && Array.isArray(items)) {
      grandTotal = 0;
      processedItems = items.map(item => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount = parseFloat((qty * rate).toFixed(2));
        grandTotal += amount;
        return {
          particulars: item.particulars || 'Service/Item',
          quantity: qty,
          rate: rate,
          amount: amount
        };
      });

      // Delete old items before re-creating
      await prisma.cashBillItem.deleteMany({
        where: { cashBillId: id }
      });
    }

    const updatedBill = await prisma.cashBill.update({
      where: { id },
      data: {
        billNumber: billNumber || existingBill.billNumber,
        clientName: clientName ? clientName.trim() : existingBill.clientName,
        date: date ? new Date(date) : existingBill.date,
        total: parseFloat(grandTotal.toFixed(2)),
        status: status || existingBill.status,
        ...(processedItems && {
          items: {
            create: processedItems
          }
        })
      },
      include: { items: true }
    });

    res.json(updatedBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete Cash / Service Bill
export async function deleteCashBill(req, res) {
  try {
    const { id } = req.params;
    await prisma.cashBill.delete({ where: { id } });
    res.json({ message: 'Cash Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Stream PDF for Cash / Service Bill
export async function downloadCashBillPDF(req, res) {
  try {
    const { id } = req.params;
    const cashBill = await prisma.cashBill.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!cashBill) {
      return res.status(404).json({ error: 'Cash Bill not found' });
    }

    // Fetch primary company profile if available
    const company = await prisma.company.findFirst();

    const pdfBuffer = await generateCashBillPDF(cashBill, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=cash-bill-${cashBill.billNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
