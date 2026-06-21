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
      orderBy: { invoiceNumber: 'desc' }
    });

    let sequence = 1;
    if (lastInvoice && lastInvoice.invoiceNumber.includes('-')) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }
    const invoiceNumber = `${yearMonth}-${String(sequence).padStart(3, '0')}`;

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

// Get monthly report for a specific year
export async function getMonthlyReport(req, res) {
  try {
    const { year } = req.query;
    const searchYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(searchYear, 0, 1);
    const endDate = new Date(searchYear + 1, 0, 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        subtotal: true,
        cgst: true,
        sgst: true,
        igst: true,
        total: true,
      },
    });

    const report = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(searchYear, i).toLocaleString('default', { month: 'long' }),
      invoiceCount: 0,
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0,
    }));

    invoices.forEach((inv) => {
      const month = inv.date.getMonth();
      report[month].invoiceCount += 1;
      report[month].subtotal += inv.subtotal;
      report[month].cgst += inv.cgst;
      report[month].sgst += inv.sgst;
      report[month].igst += inv.igst;
      report[month].total += inv.total;
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get yearly report
export async function getYearlyReport(req, res) {
  try {
    const invoices = await prisma.invoice.findMany({
      select: {
        date: true,
        subtotal: true,
        cgst: true,
        sgst: true,
        igst: true,
        total: true,
      },
    });

    const reportMap = {};

    invoices.forEach((inv) => {
      const year = inv.date.getFullYear();
      if (!reportMap[year]) {
        reportMap[year] = {
          year,
          invoiceCount: 0,
          subtotal: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total: 0,
        };
      }
      reportMap[year].invoiceCount += 1;
      reportMap[year].subtotal += (inv.subtotal || 0);
      reportMap[year].cgst += (inv.cgst || 0);
      reportMap[year].sgst += (inv.sgst || 0);
      reportMap[year].igst += (inv.igst || 0);
      reportMap[year].total += (inv.total || 0);
    });

    const report = Object.values(reportMap).sort((a, b) => b.year - a.year);

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get HSN code wise monthly report
export async function getHsnReport(req, res) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const searchYear = parseInt(year);
    const searchMonth = parseInt(month) - 1; // JS months are 0-indexed
    const startDate = new Date(searchYear, searchMonth, 1);
    const endDate = new Date(searchYear, searchMonth + 1, 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        items: true,
      },
    });

    const reportMap = {};

    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const hsnCode = item.hsnCode || 'N/A';
        if (!reportMap[hsnCode]) {
          reportMap[hsnCode] = {
            hsnCode,
            totalQuantity: 0,
            totalAmount: 0,
            taxAmount: 0,
          };
        }
        reportMap[hsnCode].totalQuantity += (item.quantity || 0);
        reportMap[hsnCode].totalAmount += (item.amount || 0);
        reportMap[hsnCode].taxAmount += (item.gstAmount || 0);
      });
    });

    const report = Object.values(reportMap).sort((a, b) => a.hsnCode.localeCompare(b.hsnCode));

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get tax report (month wise bill based)
export async function getTaxReport(req, res) {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const searchYear = parseInt(year);
    const searchMonth = parseInt(month) - 1; // JS months are 0-indexed
    const startDate = new Date(searchYear, searchMonth, 1);
    const endDate = new Date(searchYear, searchMonth + 1, 1);

    const invoices = await prisma.invoice.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    const report = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date,
      customerName: inv.customer.name,
      customerGstin: inv.customer.gstin || 'N/A',
      subtotal: inv.subtotal,
      cgst: inv.cgst,
      sgst: inv.sgst,
      igst: inv.igst,
      totalTax: inv.cgst + inv.sgst + inv.igst,
      total: inv.total,
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

