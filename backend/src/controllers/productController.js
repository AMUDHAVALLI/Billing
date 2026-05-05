import prisma from '../config/database.js';

// Get all products with pagination and search
export async function getProducts(req, res) {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { hsnCode: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
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

// Get product by ID
export async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create product
export async function createProduct(req, res) {
  try {
    const product = await prisma.product.create({
      data: req.body
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update product
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const product = await prisma.product.update({
      where: { id },
      data: req.body
    });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete product
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id }
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
