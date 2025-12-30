import fs from 'fs';
import { generateInvoicePDF } from './src/utils/pdfGenerator.js';

const mockCompany = {
  name: 'SRI AADINATH COMPUTERS',
  address: '131, VAZHUDAVUR ROAD\nGANDHI NAGAR',
  city: 'PONDICHERRY',
  state: 'Puducherry',
  pincode: '605 009',
  gstin: '34AXBPT2731M1ZA',
  contact: '8870844429',
  email: 'sriaadinathcomputers@gmail.com',
  bankName: 'STATE BANK OF INDIA',
  accountNumber: '38548048472',
  branch: 'KAMARAJAR SALAI',
  ifscCode: 'SBIN000079', 
};

const mockCustomer = {
  name: 'AIRTEL PAYMENT',
  state: 'Puducherry',
  stateCode: '34',
  gstin: '33AAAAA0000A1Z5',
  address: 'No. 10, Main Road,\nOulgaret, Puducherry'
};

const mockInvoice = {
  invoiceNumber: '06401/2025-26',
  date: new Date('2025-12-12'),
  items: [
    {
      description: 'MAXXION 2U RACK PRO',
      hsnCode: '84733099',
      gstRate: 18,
      quantity: 1,
      unit: 'NOS',
      rate: 800.00,
      amount: 800.00
    },
    {
      description: 'CAMERA DAHUA DH-HAC-HFW1209CLP-A 2MP C+M PLASTIC DT',
      hsnCode: '85258090',
      gstRate: 18,
      quantity: 2,
      unit: 'NOS',
      rate: 1600.00,
      amount: 4999.99
    },
    {
        description: 'CAMERA - DAHUA DH-HAC-HDW-1209CLQP-A CLR+MIC\nBatch : Am0de76pca88658',
        hsnCode: '8525',
        gstRate: 18,
        quantity: 1,
        unit: 'NOS',
        rate: 1550.00,
        amount: 1313.56
    },
    {
        description: 'DVR - DAHUA DH-XVR4B04-I\nBatch : BE0C95EPCAFC803',
        hsnCode: '8521',
        gstRate: 18,
        quantity: 1,
        unit: 'NOS',
        rate: 2450.00,
        amount: 2076.27
    },
    {
      description: 'HARDDISK - KRYSTAA 500GB HDD\nBatch : K0260112',
      hsnCode: '8528',
      gstRate: 18,
      quantity: 1,
      unit: 'NOS',
      rate: 2200.00,
      amount: 1864.41
    },
    {
        description: 'MISCELLANEOUS - PVC BOX 4 *4',
        hsnCode: '3926',
        gstRate: 18,
        quantity: 3,
        unit: 'NOS',
        rate: 25.00,
        amount: 63.57
    }
  ],
  subtotal: 11000,
  cgst: 900,
  sgst: 900,
  igst: 0,
  roundOff: 0.02,
  total: 10275.00
};

async function run() {
  try {
    const pdfBuffer = await generateInvoicePDF(mockInvoice, mockCompany, mockCustomer);
    const filename = `test-invoice-${Date.now()}.pdf`;
    fs.writeFileSync(filename, pdfBuffer);
    console.log(`PDF generated: ${filename}`);
  } catch (error) {
    console.error('Error generating PDF:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

run();
