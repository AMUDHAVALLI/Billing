import prisma from '../config/database.js';

// Get all customers with pagination and search
export async function getCustomers(req, res) {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get customer by ID
export async function getCustomerById(req, res) {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create customer
export async function createCustomer(req, res) {
  try {
    const customer = await prisma.customer.create({
      data: req.body
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update customer
export async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.update({
      where: { id },
      data: req.body
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete customer
export async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    await prisma.customer.delete({
      where: { id }
    });
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
