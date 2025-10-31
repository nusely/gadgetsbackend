import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface OrderData {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  tax: number;
  delivery_fee: number;
  total: number;
  delivery_address: any;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  order_items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    selected_variants?: any;
  }>;
}

class PDFService {
  async generateOrderPDF(orderData: OrderData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new (PDFDocument as any)({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        this.addHeader(doc);
        
        // Order Information
        this.addOrderInfo(doc, orderData);
        
        // Customer Information
        this.addCustomerInfo(doc, orderData);
        
        // Order Items
        this.addOrderItems(doc, orderData);
        
        // Order Summary
        this.addOrderSummary(doc, orderData);
        
        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addHeader(doc: any) {
    // Company Logo/Title
    doc.fontSize(24)
       .fillColor('#FF7A19')
       .text('VENTECH', 50, 50)
       .fontSize(12)
       .fillColor('#3A3A3A')
       .text('Gadgets & Electronics', 50, 80);

    // Document Title
    doc.fontSize(18)
       .fillColor('#1A1A1A')
       .text('ORDER INVOICE', 50, 120);

    // Line separator
    doc.moveTo(50, 150)
       .lineTo(550, 150)
       .stroke('#EDEDED');
  }

  private addOrderInfo(doc: any, orderData: OrderData) {
    const y = 170;
    
    doc.fontSize(12)
       .fillColor('#1A1A1A')
       .text('Order Information', 50, y)
       .fontSize(10)
       .fillColor('#3A3A3A');

    const orderInfo = [
      ['Order Number:', orderData.order_number],
      ['Order Date:', new Date(orderData.created_at).toLocaleDateString()],
      ['Status:', orderData.status.toUpperCase()],
      ['Payment Status:', orderData.payment_status.toUpperCase()],
    ];

    let currentY = y + 20;
    orderInfo.forEach(([label, value]) => {
      doc.text(label, 50, currentY)
         .text(value, 200, currentY);
      currentY += 15;
    });
  }

  private addCustomerInfo(doc: any, orderData: OrderData) {
    const y = 280;
    
    doc.fontSize(12)
       .fillColor('#1A1A1A')
       .text('Customer Information', 50, y)
       .fontSize(10)
       .fillColor('#3A3A3A');

    const customerName = `${orderData.user.first_name || ''} ${orderData.user.last_name || ''}`.trim() || 'Unknown';
    
    const customerInfo = [
      ['Name:', customerName],
      ['Email:', orderData.user.email || 'No email'],
      ['Address:', this.formatAddress(orderData.delivery_address)],
    ];

    let currentY = y + 20;
    customerInfo.forEach(([label, value]) => {
      doc.text(label, 50, currentY)
         .text(value, 200, currentY);
      currentY += 15;
    });
  }

  private addOrderItems(doc: any, orderData: OrderData) {
    const y = 380;
    
    doc.fontSize(12)
       .fillColor('#1A1A1A')
       .text('Order Items', 50, y);

    // Table header
    const tableY = y + 20;
    doc.fontSize(10)
       .fillColor('#3A3A3A')
       .text('Product', 50, tableY)
       .text('Qty', 300, tableY)
       .text('Unit Price', 350, tableY)
       .text('Total', 450, tableY);

    // Table line
    doc.moveTo(50, tableY + 15)
       .lineTo(550, tableY + 15)
       .stroke('#EDEDED');

    // Order items
    let currentY = tableY + 25;
    orderData.order_items.forEach((item) => {
      doc.fillColor('#1A1A1A')
         .text(item.product_name, 50, currentY)
         .text(item.quantity.toString(), 300, currentY)
         .text(`GHS ${item.unit_price.toFixed(2)}`, 350, currentY)
         .text(`GHS ${item.subtotal.toFixed(2)}`, 450, currentY);
      
      currentY += 20;
    });
  }

  private addOrderSummary(doc: any, orderData: OrderData) {
    const y = 500;
    
    doc.fontSize(12)
       .fillColor('#1A1A1A')
       .text('Order Summary', 400, y);

    const summaryY = y + 20;
    const summaryItems = [
      ['Subtotal:', `GHS ${orderData.subtotal.toFixed(2)}`],
      ['Discount:', `-GHS ${orderData.discount.toFixed(2)}`],
      ['Tax:', `GHS ${orderData.tax.toFixed(2)}`],
      ['Delivery Fee:', `GHS ${orderData.delivery_fee.toFixed(2)}`],
    ];

    let currentY = summaryY;
    summaryItems.forEach(([label, value]) => {
      doc.fontSize(10)
         .fillColor('#3A3A3A')
         .text(label, 400, currentY)
         .text(value, 500, currentY);
      currentY += 15;
    });

    // Total line
    doc.moveTo(400, currentY + 5)
       .lineTo(550, currentY + 5)
       .stroke('#EDEDED');

    // Total
    doc.fontSize(12)
       .fillColor('#FF7A19')
       .text('TOTAL:', 400, currentY + 15)
       .text(`GHS ${orderData.total.toFixed(2)}`, 500, currentY + 15);
  }

  private addFooter(doc: any) {
    const y = 650;
    
    doc.fontSize(10)
       .fillColor('#3A3A3A')
       .text('Thank you for choosing VENTECH!', 50, y)
       .text('For support, contact us at support@ventechgadgets.com', 50, y + 15)
       .text('Phone: +233 55 134 4310', 50, y + 30)
       .text('Website: www.ventechgadgets.com', 50, y + 45);
  }

  private formatAddress(address: any): string {
    if (typeof address === 'string') return address;
    if (!address) return 'No address provided';
    
    const parts = [
      address.street,
      address.city,
      address.region,
      address.postal_code,
      address.country
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}

export default new PDFService();
