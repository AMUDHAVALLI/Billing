import prisma from '../config/database.js';
import { calculateGST } from '../utils/gstCalculator.js';
import { generateQuotationPDF } from '../utils/quotationPdfGenerator.js';

// Get all quotations with pagination and filtering
export async function getQuotations(req, res) {
  try {
    const { search, status, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    if (status) {
      where.status = status;
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          customer: true,
          company: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.quotation.count({ where })
    ]);

    res.json({
      quotations,
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

// Get quotation by ID
export async function getQuotationById(req, res) {
  try {
    const { id } = req.params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        company: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create quotation
export async function createQuotation(req, res) {
  try {
    const { companyId, customerId, items, date } = req.body;

    // Get company and customer details
    const [company, customer] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.customer.findUnique({ where: { id: customerId } })
    ]);

    if (!company || !customer) {
      return res.status(404).json({ error: 'Company or Customer not found' });
    }

    // Calculate GST
    const calculation = calculateGST(
      items,
      company.state,
      customer.state,
      company.stateCode,
      customer.stateCode,
      company.gstin,
      customer.gstin
    );

    // Generate quotation number (format: QTN-YYYYMM-XXX)
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

    const lastQuotation = await prisma.quotation.findFirst({
      orderBy: { quotationNumber: 'desc' }
    });

    let sequence = 1;
    if (lastQuotation && lastQuotation.quotationNumber.includes('-')) {
      const parts = lastQuotation.quotationNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
    const quotationNumber = `QTN-${yearMonth}-${String(sequence).padStart(3, '0')}`;

    // Create quotation with items
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        date: date ? new Date(date) : new Date(),
        companyId,
        customerId,
        subtotal: calculation.subtotal,
        cgst: calculation.cgst,
        sgst: calculation.sgst,
        igst: calculation.igst,
        roundOff: calculation.roundOff,
        total: calculation.total,
        status: 'draft',
        items: {
          create: calculation.items.map(item => ({
            productId: item.productId,
            description: item.description,
            hsnCode: item.hsnCode,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
            gstRate: item.gstRate,
            gstAmount: item.gstAmount
          }))
        }
      },
      include: {
        items: true,
        customer: true,
        company: true
      }
    });

    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update quotation
export async function updateQuotation(req, res) {
  try {
    const { id } = req.params;
    const { items, ...quotationData } = req.body;

    // Normalize/validate date if present
    if (quotationData.date) {
      const parsedDate = new Date(quotationData.date);
      if (isNaN(parsedDate)) {
        return res.status(400).json({ error: 'Invalid date format. Expected an ISO-8601 date or DateTime.' });
      }
      quotationData.date = parsedDate;
    }

    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingQuotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const companyId = quotationData.companyId || existingQuotation.companyId;
    const customerId = quotationData.customerId || existingQuotation.customerId;
    const finalItems = items || existingQuotation.items;

    const [latestCompany, latestCustomer] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.customer.findUnique({ where: { id: customerId } })
    ]);

    if (!latestCompany || !latestCustomer) {
      return res.status(404).json({ error: 'Company or Customer not found' });
    }

    const calculation = calculateGST(
      finalItems,
      latestCompany.state,
      latestCustomer.state,
      latestCompany.stateCode,
      latestCustomer.stateCode,
      latestCompany.gstin,
      latestCustomer.gstin
    );

    await prisma.quotationItem.deleteMany({
      where: { quotationId: id }
    });

    const updatedQuotation = await prisma.quotation.update({
      where: { id },
      data: {
        ...quotationData,
        subtotal: calculation.subtotal,
        cgst: calculation.cgst,
        sgst: calculation.sgst,
        igst: calculation.igst,
        roundOff: calculation.roundOff,
        total: calculation.total,
        items: {
          create: calculation.items.map(item => ({
            productId: item.productId,
            description: item.description,
            hsnCode: item.hsnCode,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
            gstRate: item.gstRate,
            gstAmount: item.gstAmount
          }))
        }
      },
      include: {
        items: true,
        customer: true,
        company: true
      }
    });

    res.json(updatedQuotation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete quotation
export async function deleteQuotation(req, res) {
  try {
    const { id } = req.params;
    await prisma.quotation.delete({
      where: { id }
    });
    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Generate PDF for quotation
export async function downloadQuotationPDF(req, res) {
  try {
    const { id } = req.params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        company: true,
        items: true
      }
    });

    if (!quotation) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const pdfBuffer = await generateQuotationPDF(quotation, quotation.company, quotation.customer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=quotation-${quotation.quotationNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

