import prisma from '../config/database.js';

// Get all companies
export async function getCompanies(req, res) {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get company by ID
export async function getCompanyById(req, res) {
  try {
    const { id } = req.params;
    const company = await prisma.company.findUnique({
      where: { id }
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Create company
export async function createCompany(req, res) {
  try {
    const company = await prisma.company.create({
      data: req.body
    });
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update company
export async function updateCompany(req, res) {
  try {
    const { id } = req.params;
    const company = await prisma.company.update({
      where: { id },
      data: req.body
    });
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Delete company
export async function deleteCompany(req, res) {
  try {
    const { id } = req.params;
    await prisma.company.delete({
      where: { id }
    });
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
