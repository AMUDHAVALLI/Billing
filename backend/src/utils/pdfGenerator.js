import PDFDocument from 'pdfkit';
import { amountInWords } from './gstCalculator.js';

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(invoice, company, customer) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 20, size: 'A4' }); // Reduced margin to fit content
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Layout Constants
      const startX = 25;
      const endX = 570; // A4 width is ~595. 
      const width = endX - startX;
      
      // Column Definitions (Total width ~545)
      // SI No | Description | HSN/SAC | GST Rate | Quantity | Rate | Rate(Incl) | per | Amount
      
      const cols = {
        si: { x: startX, w: 25 },
        desc: { x: startX + 25, w: 200 },
        hsn: { x: startX + 225, w: 40 },
        gst: { x: startX + 265, w: 30 },
        qty: { x: startX + 295, w: 45 },
        rateIncl: { x: startX + 340, w: 55 },
        rate: { x: startX + 395, w: 55 },
        per: { x: startX + 450, w: 35 },
        amount: { x: startX + 485, w: 60 }
      };

      // Header lines
      doc.lineWidth(0.5);
      
      // Helper function to draw border on a page
      const drawMainBorder = () => {
        doc.lineWidth(0.5);
        // Shortened to 760 to leave space for outer footer text
        doc.rect(startX, 20, width, 760).stroke();
      };

      // Draw border on first page
      drawMainBorder();
      
      // Vertical line separating Left (Company) and Right (Details)
      const splitX = 340;
      doc.moveTo(splitX, 20).lineTo(splitX, 150).stroke();
      // doc.moveTo(endX, 20).lineTo(endX, 150).stroke(); // Right border - covered by rect
      // doc.moveTo(startX, 20).lineTo(startX, 150).stroke(); // Left border - covered by rect
      
      // Company Details
      // Compact spacing adjustments with dynamic height check to prevent overlaps
      let companyY = 25;
      const companyLeftX = startX + 5;
      const companyWidth = 300;
      
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text(company.name, companyLeftX, companyY, { width: companyWidth });
      companyY += doc.heightOfString(company.name, { width: companyWidth }) + 2;
      
      doc.font('Helvetica').fontSize(9);
      doc.text(company.address, companyLeftX, companyY, { width: companyWidth });
      companyY += doc.heightOfString(company.address, { width: companyWidth }) + 2;
      
      // doc.text(company.city, companyLeftX, companyY); 
      // companyY += 12;
      
      doc.text(`${company.state} - ${company.pincode}`, companyLeftX, companyY); 
      companyY += 12;
      
      // 8870844429 - Removed raw contact line to avoid duplication with labeled line below
      // companyY += 12; 
      
      const labelW = 60;
      const valueX = companyLeftX + labelW;
      
      doc.text('GSTIN/UIN', companyLeftX, companyY);
      doc.text(`: ${company.gstin}`, valueX, companyY);
      companyY += 12;
      
      doc.text('State Name', companyLeftX, companyY);
      doc.text(`: ${company.state}, Code : 34`, valueX, companyY); 
      companyY += 12;
      
      doc.text('Contact', companyLeftX, companyY);
      doc.text(`: ${company.contact}`, valueX, companyY);
      companyY += 12;
      
      doc.text('E-Mail', companyLeftX, companyY);
      doc.text(`: ${company.email}`, valueX, companyY);

      // Right Side Header
      doc.font('Helvetica-Bold').fontSize(12).text('INVOICE CUM CHALLAN', splitX, 25, { width: endX - splitX, align: 'center' });
      
      // Horizontal lines in Right Box
      const rightBoxY = 45;
      doc.moveTo(splitX, rightBoxY).lineTo(endX, rightBoxY).stroke();
      
      // Split Right Box into 4 quadrants
      const midRightX = splitX + ((endX - splitX) / 2);
      const midRightY = 100;
      
      doc.moveTo(midRightX, rightBoxY).lineTo(midRightX, 150).stroke();
      doc.moveTo(splitX, midRightY).lineTo(endX, midRightY).stroke();
      doc.moveTo(splitX, 75).lineTo(endX, 75).stroke(); 
      
      doc.font('Helvetica').fontSize(9);
      // Quadrant 1
      doc.text('Invoice No.', splitX + 5, rightBoxY + 5);
      doc.font('Helvetica-Bold').text(invoice.invoiceNumber, splitX + 5, rightBoxY + 18);
      
      // Quadrant 2
      doc.font('Helvetica').text('Dated', midRightX + 5, rightBoxY + 5);
      doc.font('Helvetica-Bold').text(new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }), midRightX + 5, rightBoxY + 18);

      // Quadrant 3
      doc.font('Helvetica').text('Buyer\'s Order No.', splitX + 5, 80);
      // doc.text('...', splitX + 5, 93);
      
      // Quadrant 4
      doc.text('Dated', midRightX + 5, 80);
      // doc.text('...', midRightX + 5, 93);
      
      // Bottom of header section
      doc.moveTo(startX, 150).lineTo(endX, 150).stroke();
      
      // Customer details section
      doc.font('Helvetica').fontSize(10).text('Buyer (Bill to)', startX + 5, 155);
      doc.font('Helvetica-Bold').fontSize(10).text(`${customer.name}`, startX + 5, 170); 
      
      doc.font('Helvetica').fontSize(9);
      let customerY = 185;
      if (customer.address) {
          doc.text(customer.address, startX + 5, customerY, { width: 200 }); // Reduced width to force multi-line
          customerY += doc.heightOfString(customer.address, { width: 200 }) + 2;
      }
      
      if (customer.gstin) {
        doc.text(`GSTIN/UIN : ${customer.gstin}`, startX + 5, customerY);
        customerY += 12;
      }
      
      doc.text('State Name', startX + 5, customerY);
      doc.text(`: ${customer.state}, Code : ${customer.stateCode}`, startX + 55, customerY);
      
      const tableTop = Math.max(215, customerY + 20);
      doc.moveTo(startX, tableTop).lineTo(endX, tableTop).stroke();
      
      // Table Header Text
      const headerY = tableTop + 5;
      const headerHeight = 35;
      doc.font('Helvetica-Bold').fontSize(8);
      
      // Vertical lines for columns
      Object.values(cols).forEach(col => {
         doc.moveTo(col.x, tableTop).lineTo(col.x, tableTop + headerHeight).stroke();
      });
      doc.moveTo(endX, tableTop).lineTo(endX, tableTop + headerHeight).stroke(); 

      // SI No
      doc.text('SI', cols.si.x, headerY, { width: cols.si.w, align: 'center' });
      doc.text('No.', cols.si.x, headerY + 10, { width: cols.si.w, align: 'center' });
      
      // Description
      doc.text('Description of Goods', cols.desc.x, headerY + 10, { width: cols.desc.w, align: 'center' });
      
      // HSN/SAC
      doc.text('HSN/SAC', cols.hsn.x, headerY + 10, { width: cols.hsn.w, align: 'center' });
      
      // GST Rate
      doc.text('GST', cols.gst.x, headerY, { width: cols.gst.w, align: 'center' });
      doc.text('Rate', cols.gst.x, headerY + 10, { width: cols.gst.w, align: 'center' });
      
      // Quantity
      doc.text('Quantity', cols.qty.x, headerY + 10, { width: cols.qty.w, align: 'center' });
      
      // Rate (Incl Tax)
      doc.text('Rate', cols.rateIncl.x, headerY, { width: cols.rateIncl.w, align: 'center' });
      doc.text('(Incl. of Tax)', cols.rateIncl.x, headerY + 10, { width: cols.rateIncl.w, align: 'center' });
      
      // Rate
      doc.text('Rate', cols.rate.x, headerY + 10, { width: cols.rate.w, align: 'center' });
      
      // per
      doc.text('per', cols.per.x, headerY + 10, { width: cols.per.w, align: 'center' });
      
      // Amount
      doc.text('Amount', cols.amount.x, headerY + 10, { width: cols.amount.w, align: 'center' });
      
      doc.moveTo(startX, tableTop + headerHeight).lineTo(endX, tableTop + headerHeight).stroke();
      
      // Items
      let y = tableTop + headerHeight + 5;
      doc.font('Helvetica').fontSize(8);
      
      invoice.items.forEach((item, i) => {
        const startY = y;
        const descHeight = doc.heightOfString(item.description, { width: cols.desc.w - 4 });
        const rowHeight = Math.max(20, descHeight + 10);
        
        // All items on one page as requested
        /*
        if (y + rowHeight > 750) {
            doc.addPage({ margin: 20, size: 'A4' });
            drawMainBorder();
            y = 40;
        }
        */

        Object.values(cols).forEach(col => {
             doc.moveTo(col.x, startY - 5).lineTo(col.x, startY + rowHeight - 5).stroke();
        });
        doc.moveTo(endX, startY - 5).lineTo(endX, startY + rowHeight - 5).stroke();

        doc.text((i + 1).toString(), cols.si.x, y, { width: cols.si.w, align: 'center' });
        doc.text(item.description, cols.desc.x + 2, y, { width: cols.desc.w - 4 });
        doc.text(item.hsnCode, cols.hsn.x, y, { width: cols.hsn.w, align: 'center' });
        doc.text(`${item.gstRate} %`, cols.gst.x, y, { width: cols.gst.w, align: 'center' });
        
        doc.text(`${item.quantity} ${item.unit}`, cols.qty.x, y, { width: cols.qty.w, align: 'center' });
        
        const rateIncl = item.rate * (1 + item.gstRate/100);
        doc.text(rateIncl.toFixed(2), cols.rateIncl.x, y, { width: cols.rateIncl.w, align: 'center' });
        
        doc.text(item.rate.toFixed(2), cols.rate.x, y, { width: cols.rate.w, align: 'center' });
        doc.text(item.unit, cols.per.x, y, { width: cols.per.w, align: 'center' });
        doc.text(item.amount.toFixed(2), cols.amount.x, y, { width: cols.amount.w - 2, align: 'right' });
        
        y += rowHeight;
      });
      
      doc.moveTo(startX, y - 5).lineTo(endX, y - 5).stroke();
      
      // Totals
      y += 5;
      const totalLabelX = cols.rateIncl.x; 
      const totalValueX = cols.amount.x;
      
       if (invoice.cgst > 0) {
        doc.font('Helvetica-Bold').text('CGST', totalLabelX, y, { align: 'right', width: 60 });
        doc.font('Helvetica').text(invoice.cgst.toFixed(2), totalValueX, y, { align: 'right', width: cols.amount.w - 2 });
        y += 12;
        doc.font('Helvetica-Bold').text('SGST', totalLabelX, y, { align: 'right', width: 60 });
        doc.font('Helvetica').text(invoice.sgst.toFixed(2), totalValueX, y, { align: 'right', width: cols.amount.w - 2 });
        y += 12;
      } else if (invoice.igst > 0) {
        doc.font('Helvetica-Bold').text('IGST', totalLabelX, y, { align: 'right', width: 60 });
        doc.font('Helvetica').text(invoice.igst.toFixed(2), totalValueX, y, { align: 'right', width: cols.amount.w - 2 });
        y += 12;
      }
      
      if (invoice.roundOff) {
        doc.font('Helvetica-Bold').text('ROUND OFF', totalLabelX, y, { align: 'right', width: 60 });
        doc.font('Helvetica').text(invoice.roundOff.toFixed(2), totalValueX, y, { align: 'right', width: cols.amount.w - 2 });
        y += 12;
      }
      
      doc.moveTo(startX, y).lineTo(endX, y).stroke();
      y += 5;
      
      // Grand Total
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('Total', totalLabelX, y, { align: 'right', width: 60 });
      doc.text(invoice.total.toFixed(2), totalValueX, y, { align: 'right', width: cols.amount.w - 2 });
      
      // Amount in words
      const paddedLeftX = startX + 5;
      y += 1;
      
      doc.fontSize(9).font('Helvetica').text('Amount Chargeable (in words)', paddedLeftX, y);
      y += 10;
      doc.font('Helvetica-Bold').fontSize(8).text(amountInWords(invoice.total), paddedLeftX, y);
      
      y += 7;
      doc.moveTo(startX, y).lineTo(endX, y).stroke();
      
      // Footer Section: Terms and Bank Details Side-by-Side
      y += 10;
      const footerStartY = y;
      
      // Column 1: Terms and Conditions (Left Side)
      const termsX = paddedLeftX;
      const termsWidth = 310;
      
      doc.font('Helvetica-Bold').fontSize(9).text('Terms & Conditions (E.& O.E.)', termsX, footerStartY, { width: termsWidth });
      doc.font('Helvetica').fontSize(8);
      
      let currentTermsY = footerStartY + 15;
      doc.text('1. Goods once sold will not be taken back.', termsX, currentTermsY, { width: termsWidth });
      currentTermsY += doc.heightOfString('1. Goods once sold will not be taken back.', { width: termsWidth }) + 2;
      
      doc.text('2. Interest @ 18% p.a. will be charged if the payment is not made with in the stibulated time.', termsX, currentTermsY, { width: termsWidth });
      currentTermsY += doc.heightOfString('2. Interest @ 18% p.a. will be charged if the payment is not made with in the stibulated time.', { width: termsWidth }) + 2;
      
      doc.text(`3. Subject to ' ${company.city} ' jurisdiction only.`, termsX, currentTermsY, { width: termsWidth });
      currentTermsY += 12; // final padding for terms
      
      // Column 2: Bank Details (Right Side)
      let currentBankY = footerStartY;
      if (company.bankName) {
         doc.font('Helvetica-Bold').fontSize(9).text("Company's Bank Details", 350, currentBankY);
         currentBankY += 15;
         doc.font('Helvetica').fontSize(9);
         
         const labelX = 350;
         const valueX = 435;
         
         doc.text('Bank Name', labelX, currentBankY);
         doc.text(`: ${company.bankName}`, valueX, currentBankY);
         currentBankY += 12;
         
         doc.text('A/c No.', labelX, currentBankY);
         doc.text(`: ${company.accountNumber || 'N/A'}`, valueX, currentBankY);
         currentBankY += 12;
         
         doc.text('Branch & IFS Code', labelX, currentBankY);
         doc.text(`: ${company.branch || ''} & ${company.ifscCode || ''}`, valueX, currentBankY);
         currentBankY += 12;
      }

      // Next section starts below the tallest column
      y = Math.max(currentTermsY, currentBankY) + 20;
      
      // Signatures
      doc.text("Customer's Seal and Signature", paddedLeftX, y + 20);
      doc.text(`For ${company.name}`, 350, y, { align: 'right', width: 200 });
      doc.text("Authorized Signatory", 350, y + 30, { align: 'right', width: 200 });

      // Bottom Jurisdiction and Computer Generated Text - Outer of the border
      const footerY = 785; // Outside the 760px height border (ends at 780)
      doc.text(`SUBJECT TO ${company.state.toUpperCase()} JURISDICTION`, startX, footerY, { align: 'center', width: width }); 
      doc.text('This is a Computer Generated Invoice', startX, footerY + 12, { align: 'center', width: width }); 
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
