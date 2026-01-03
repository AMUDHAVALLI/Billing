import { areStatesSame } from './stateMapping.js';

/**
 * Calculate GST for invoice items
 * @param {Array} items - Array of invoice items
 * @param {string} companyState - Company state name
 * @param {string} customerState - Customer state name
 * @param {string} companyStateCode - Company state code
 * @param {string} customerStateCode - Customer state code
 * @param {string} companyGSTIN - Company GSTIN
 * @param {string} customerGSTIN - Customer GSTIN
 * @returns {Object} - GST calculation details
 */
export function calculateGST(items, companyState, customerState, companyStateCode, customerStateCode, companyGSTIN = '', customerGSTIN = '') {
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  // Calculate subtotal and individual item GST
  const processedItems = items.map(item => {
    const amount = item.rate * item.quantity;
    const gstAmount = (amount * item.gstRate) / 100;
    
    subtotal += amount;
    
    return {
      ...item,
      amount: parseFloat(amount.toFixed(2)),
      gstAmount: parseFloat(gstAmount.toFixed(2))
    };
  });

  // Determine if intra-state or inter-state
  const isIntraState = areStatesSame(companyState, customerState, companyStateCode, customerStateCode, companyGSTIN, customerGSTIN);

  if (isIntraState) {
    // CGST + SGST for intra-state transactions
    processedItems.forEach(item => {
      const gstAmount = item.gstAmount;
      totalCGST += gstAmount / 2;
      totalSGST += gstAmount / 2;
    });
  } else {
    // IGST for inter-state transactions
    processedItems.forEach(item => {
      totalIGST += item.gstAmount;
    });
  }

  const totalBeforeRound = subtotal + totalCGST + totalSGST + totalIGST;
  const roundedTotal = Math.round(totalBeforeRound);
  const roundOff = roundedTotal - totalBeforeRound;

  return {
    items: processedItems,
    subtotal: parseFloat(subtotal.toFixed(2)),
    cgst: parseFloat(totalCGST.toFixed(2)),
    sgst: parseFloat(totalSGST.toFixed(2)),
    igst: parseFloat(totalIGST.toFixed(2)),
    roundOff: parseFloat(roundOff.toFixed(2)),
    total: roundedTotal,
    isIntraState
  };
}

/**
 * Convert number to words (Indian numbering system)
 */
export function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  let words = '';

  // Crores
  if (num >= 10000000) {
    words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }

  // Lakhs
  if (num >= 100000) {
    words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }

  // Thousands
  if (num >= 1000) {
    words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }

  // Hundreds
  if (num >= 100) {
    words += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }

  // Tens and Ones
  if (num >= 20) {
    words += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  } else if (num >= 10) {
    words += teens[num - 10] + ' ';
    num = 0;
  }

  if (num > 0) {
    words += ones[num] + ' ';
  }

  return words.trim();
}

/**
 * Format amount in words for invoice
 */
export function amountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = 'INR ' + numberToWords(rupees);
  
  if (paise > 0) {
    words += ' and ' + numberToWords(paise) + ' Paise';
  }
  
  words += ' Only';
  
  return words;
}
