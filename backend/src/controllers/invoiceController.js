import prisma from '../config/database.js';
import { calculateGST } from '../utils/gstCalculator.js';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

// Get all invoices with pagination and filtering
export async function getInvoices(req, res) {
  try {
    const { search, status, page, limit } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.invoiceNumber = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: skip,
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
      prisma.invoice.count({ where })
    ]);

    res.json({
      invoices,
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

// Get invoice by ID
export async function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
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

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create invoice
export async function createInvoice(req, res) {
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

    // Generate invoice number (format: YYYYMM-XXX)
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: yearMonth
        }
      },
      orderBy: { invoiceNumber: 'desc' }
    });

    let invoiceNumber;
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[1]);
      invoiceNumber = `${yearMonth}-${String(lastNum + 1).padStart(3, '0')}`;
    } else {
      invoiceNumber = `${yearMonth}-001`;
    }

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
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

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update invoice
export async function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const { items, ...invoiceData } = req.body;

    // Normalize/validate date if present
    if (invoiceData.date) {
      const parsedDate = new Date(invoiceData.date);
      if (isNaN(parsedDate)) {
        return res.status(400).json({ error: 'Invalid date format. Expected an ISO-8601 date or DateTime.' });
      }
      invoiceData.date = parsedDate;
    }

    // Fetch existing invoice to get current company/customer/items if not provided
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const companyId = invoiceData.companyId || existingInvoice.companyId;
    const customerId = invoiceData.customerId || existingInvoice.customerId;
    const finalItems = items || existingInvoice.items;

    // Fetch latest company and customer details to ensure correct state/GSTIN
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

    // Delete old items and create new ones (syncs all calculations)
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...invoiceData,
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

    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete invoice
export async function deleteInvoice(req, res) {
  try {
    const { id } = req.params;
    await prisma.invoice.delete({
      where: { id }
    });
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Generate PDF for invoice
export async function downloadInvoicePDF(req, res) {
  try {
    const { id } = req.params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        company: true,
        items: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice, invoice.company, invoice.customer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.invoiceNumber}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get dashboard statistics
export async function getDashboardStats(req, res) {
  try {
    const [totalCustomers, totalProducts, totalInvoices, recentInvoices] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      prisma.invoice.count(),
      prisma.invoice.findMany({
        take: 5,
        include: {
          customer: true
        },
        orderBy: { date: 'desc' }
      })
    ]);

    const totalRevenue = await prisma.invoice.aggregate({
      _sum: {
        total: true
      }
    });

    res.json({
      totalCustomers,
      totalProducts,
      totalInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
      recentInvoices
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
