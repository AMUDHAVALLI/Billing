import PDFDocument from 'pdfkit';
import path from 'path';
import { amountInWords } from './gstCalculator.js';

const LOGO_PATH = path.join(import.meta.dirname, '../assets/system-doctor-logo.png');

/**
 * Draws one full bill using its own fixed coordinate system (as if onto a
 * ~595x785 portrait canvas starting at the origin). Callers position it by
 * wrapping the call in doc.save() / doc.translate() / doc.scale() / doc.restore()
 * — the drawing code itself never needs to know where on the real page it
 * ends up, which is what makes printing two copies on one landscape page
 * just a matter of calling this twice instead of a second, parallel layout.
 */
function drawOneBill(doc, cashBill, company) {
         // Default company details if none provided
         const compName = company?.name || 'Sri Balaji Computers';
         const compAddress = company?.address
            ? `${company.address}, ${company.city || ''} ${company.state || ''} - ${company.pincode || ''}`
            : 'No.75, East Pondy Main Road, Villianur, Puducherry - 110.';
         const compEmail = company?.email || 'sbcdoctor14@gmail.com';
         const compPhone = company?.phone || company?.contact || '72 00 11 33 44';

         // Outer boundary dimensions
         const startX = 30;
         const endX = 565;
         const width = endX - startX;
         const topY = 25;
         const maxY = 760;

         // Draw Main Border
         doc.lineWidth(1);
         doc.rect(startX, topY, width, maxY - topY).stroke();

         // --- TOP BADGE: CASH / SERVICE BILL ---
         const badgeWidth = 160;
         const badgeHeight = 22;
         const badgeX = startX + (width - badgeWidth) / 2;
         const badgeY = topY + 8;

         doc.lineWidth(0.8);
         doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10).stroke();
         doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B')
            .text('CASH / SERVICE BILL', badgeX, badgeY + 6, { width: badgeWidth, align: 'center' });

         // --- TOP RIGHT: CELL NO ---
         doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A')
            .text(`Cell : ${compPhone}`, endX - 180, topY + 12, { width: 170, align: 'right' });

         // --- TOP LEFT LOGO --- fills the header block down to the rule
         // under the address/email lines, not just a small corner mark.
         try {
            doc.image(LOGO_PATH, startX + 4, topY + 3, {
               fit: [100, 88],
               align: 'center',
               valign: 'center',
            });
         } catch (err) {
            // Missing/unreadable logo file shouldn't block the bill itself.
         }

         // --- COMPANY HEADER DETAILS ---
         let headerY = topY + 35;
         doc.font('Helvetica-Bold').fontSize(22).fillColor('#0F172A')
            .text(compName, startX, headerY, { width: width, align: 'center' });

         headerY += 26;
         doc.font('Helvetica').fontSize(10).fillColor('#334155')
            .text(compAddress, startX, headerY, { width: width, align: 'center' });

         headerY += 14;
         doc.font('Helvetica').fontSize(10).fillColor('#334155')
            .text(`E-mail : ${compEmail}`, startX, headerY, { width: width, align: 'center' });

         headerY += 18;
         doc.lineWidth(0.8).strokeColor('#475569');
         doc.moveTo(startX, headerY).lineTo(endX, headerY).stroke();

         // --- METADATA SECTION: Sl.No, Date, Client Name ---
         let metaY = headerY + 10;

         // Sl.No.
         doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('Sl.No. :', startX + 10, metaY);
         doc.font('Helvetica-Bold').fontSize(14).fillColor('#DC2626').text(cashBill.billNumber, startX + 55, metaY - 2);

         // Date
         const formattedDate = new Date(cashBill.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
         });
         doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('Date :', endX - 160, metaY);
         doc.font('Helvetica-Bold').fontSize(11).fillColor('#1E293B').text(formattedDate, endX - 120, metaY);

         metaY += 24;

         // Client Name
         doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('Client Name :', startX + 10, metaY);
         doc.font('Helvetica-Bold').fontSize(11).fillColor('#1E293B').text(cashBill.clientName || 'N/A', startX + 90, metaY);

         // Dotted underline for client name line
         doc.lineWidth(0.5).strokeColor('#94A3B8').dash(2, { space: 2 });
         doc.moveTo(startX + 88, metaY + 13).lineTo(endX - 10, metaY + 13).stroke();
         doc.undash(); // Reset line dash

         metaY += 25;
         doc.lineWidth(1).strokeColor('#0F172A');
         doc.moveTo(startX, metaY).lineTo(endX, metaY).stroke();

         // --- TABLE LAYOUT ---
         const tableTop = metaY;
         const headerHeight = 25;
         const tableBottom = 620;

         // Columns specification
         const cols = {
            particulars: { x: startX, w: width - 210 },
            qty: { x: endX - 210, w: 55 },
            rate: { x: endX - 155, w: 65 },
            amount: { x: endX - 90, w: 90 }
         };

         // Header row background & text
         const thY = tableTop + 6;
         doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A');
         doc.text('Particulars', cols.particulars.x + 10, thY, { width: cols.particulars.w - 15, align: 'left' });
         doc.text('Qty.', cols.qty.x, thY, { width: cols.qty.w, align: 'center' });
         doc.text('Rate', cols.rate.x, thY, { width: cols.rate.w, align: 'center' });
         doc.text('Amount Rs.', cols.amount.x, thY, { width: cols.amount.w - 10, align: 'right' });

         // Table Header Bottom Line
         doc.lineWidth(1).strokeColor('#0F172A');
         doc.moveTo(startX, tableTop + headerHeight).lineTo(endX, tableTop + headerHeight).stroke();

         // Draw Column Vertical Lines down to tableBottom
         Object.values(cols).forEach(col => {
            doc.moveTo(col.x, tableTop).lineTo(col.x, tableBottom).stroke();
         });
         doc.moveTo(endX, tableTop).lineTo(endX, tableBottom).stroke();

         // --- ITEMS ROWS ---
         let itemY = tableTop + headerHeight + 8;
         doc.font('Helvetica').fontSize(10).fillColor('#1E293B');

         cashBill.items.forEach((item, index) => {
            const rowHeight = 22;
            doc.text(`${index + 1}.  ${item.particulars}`, cols.particulars.x + 8, itemY, { width: cols.particulars.w - 12 });
            doc.text(item.quantity.toString(), cols.qty.x, itemY, { width: cols.qty.w, align: 'center' });
            doc.text(item.rate.toFixed(2), cols.rate.x, itemY, { width: cols.rate.w, align: 'center' });
            doc.text(item.amount.toFixed(2), cols.amount.x, itemY, { width: cols.amount.w - 10, align: 'right' });

            itemY += rowHeight;
         });

         // --- FOOTER SECTION: TOTAL & RUPEES IN WORDS ---
         doc.lineWidth(1).strokeColor('#0F172A');
         doc.moveTo(startX, tableBottom).lineTo(endX, tableBottom).stroke();

         const footerRowY = tableBottom + 10;

         // Rupees in words
         doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text('Rupees :', startX + 10, footerRowY);
         const wordsText = amountInWords(cashBill.total);
         doc.font('Helvetica-Bold').fontSize(10).fillColor('#1E293B')
            .text(wordsText, startX + 65, footerRowY, { width: width - 230 });

         // TOTAL Box
         doc.font('Helvetica-Bold').fontSize(12).fillColor('#0F172A')
            .text('TOTAL Rs.', cols.rate.x - 30, footerRowY, { width: 85, align: 'right' });
         doc.font('Helvetica-Bold').fontSize(13).fillColor('#0F172A')
            .text(`${cashBill.total.toFixed(2)} /-`, cols.amount.x, footerRowY, { width: cols.amount.w - 10, align: 'right' });

         // Line separating total from signatures & logos
         const signY = tableBottom + 45;
         doc.lineWidth(1).strokeColor('#0F172A');
         doc.moveTo(startX, signY).lineTo(endX, signY).stroke();

         // --- BRAND LOGOS & SIGNATURE ---
         const brandY = signY + 15;
         let brandX = startX + 10;

         // 1. intel logo (Oval ring around "intel")
         doc.save();
         doc.lineWidth(1.5).strokeColor('#0071C5');
         doc.ellipse(brandX + 30, brandY + 13, 30, 14).stroke();
         doc.font('Helvetica-BoldOblique').fontSize(14).fillColor('#0071C5');
         doc.text('intel', brandX, brandY + 6, { width: 60, align: 'center' });
         doc.restore();
         brandX += 68;

         // 2. hp logo (Filled rounded rectangle with slanted white "hp" text)
         doc.save();
         doc.roundedRect(brandX, brandY - 2, 30, 28, 6).fill('#0096D6');
         doc.font('Helvetica-BoldOblique').fontSize(16).fillColor('#FFFFFF');
         doc.text('hp', brandX, brandY + 4, { width: 30, align: 'center' });
         doc.restore();
         brandX += 40;

         // 3. DELL logo (Circle stroke with "DELL" text inside)
         doc.save();
         doc.lineWidth(1.5).strokeColor('#007DB8');
         doc.circle(brandX + 16, brandY + 12, 15).stroke();
         doc.font('Helvetica-Bold').fontSize(11).fillColor('#007DB8');
         doc.text('DELL', brandX + 1, brandY + 7, { width: 30, align: 'center' });
         doc.restore();
         brandX += 44;

         // 4. IBM logo (IBM bold striped letter style)
         doc.save();
         doc.font('Helvetica-Bold').fontSize(16).fillColor('#052F5F');
         doc.text('IBM', brandX, brandY + 3, { width: 38, align: 'left' });
         // IBM horizontal white stripes overlay
         doc.lineWidth(0.9).strokeColor('#FFFFFF');
         [brandY + 7, brandY + 11, brandY + 15, brandY + 19].forEach(lineY => {
            doc.moveTo(brandX, lineY).lineTo(brandX + 34, lineY).stroke();
         });
         doc.restore();
         brandX += 46;

         // 5. Logitech logo (Dot + crescent icon mark + "logitech" text)
         doc.save();
         doc.circle(brandX + 6, brandY + 4, 4).fill('#00B8A9');
         doc.path(`M ${brandX} ${brandY + 20} Q ${brandX + 8} ${brandY + 10} ${brandX + 15} ${brandY + 15} Q ${brandX + 8} ${brandY + 22} ${brandX} ${brandY + 20}`)
            .fill('#00B8A9');
         doc.font('Helvetica-Bold').fontSize(13).fillColor('#2D3748');
         doc.text('logitech', brandX + 20, brandY + 6);
         doc.restore();

         // Right Signatory Box
         doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A')
            .text(`For ${compName}`, endX - 220, signY + 12, { width: 210, align: 'right' });

         doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569')
            .text('Authorised Signatory', endX - 220, maxY - 25, { width: 210, align: 'right' });
}

/**
 * Generate Cash / Service Bill PDF — one A4 landscape page holding two
 * copies of the same bill side by side (the usual "customer copy / office
 * copy" printing convention), with a dashed cut guide down the middle.
 * @param {Object} cashBill - The CashBill database record with items
 * @param {Object} [company] - Optional Company record for header details
 */
export async function generateCashBillPDF(cashBill, company = null) {
   return new Promise((resolve, reject) => {
      try {
         const doc = new PDFDocument({ margin: 0, size: 'A4', layout: 'landscape' });
         const chunks = [];

         doc.on('data', chunk => chunks.push(chunk));
         doc.on('end', () => resolve(Buffer.concat(chunks)));
         doc.on('error', reject);

         // drawOneBill's own coordinate system is a ~595x785 portrait
         // canvas. Scaling it down and translating it twice — once per
         // half of the landscape page — prints two copies without a
         // second, parallel layout to keep in sync with the first.
         const pageW = doc.page.width;
         const pageH = doc.page.height;
         const halfW = pageW / 2;
         const billW = 595;
         const billH = 785;
         const scale = 0.68;
         const xOffset = (halfW - billW * scale) / 2;
         const yOffset = (pageH - billH * scale) / 2;

         [0, 1].forEach(i => {
            doc.save();
            doc.translate(i * halfW + xOffset, yOffset);
            doc.scale(scale);
            drawOneBill(doc, cashBill, company);
            doc.restore();
         });

         // Cut guide between the two copies
         doc.dash(4, { space: 3 }).lineWidth(0.75).strokeColor('#94A3B8');
         doc.moveTo(halfW, 12).lineTo(halfW, pageH - 12).stroke();
         doc.undash();

         doc.end();
      } catch (error) {
         reject(error);
      }
   });
}
