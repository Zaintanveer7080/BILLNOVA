import { useCallback } from 'react';

export const useInvoiceLogic = (data) => {
  const getInvoiceStatus = useCallback((invoice, allPayments = data.payments) => {
    if (!invoice || !invoice.id) {
      return { status: 'Credit', paidAmount: invoice?.paidAmount || 0, balance: invoice?.totalCost || 0 };
    }
    
    // Use the stored paidAmount if available, as it's the source of truth from form submission
    const totalPaidForInvoice = invoice.paidAmount || 0;
    
    const totalCost = invoice.totalCost || 0;
    const balance = totalCost - totalPaidForInvoice;

    let status = 'Credit';
    if (balance <= 0.01) {
      status = 'Paid';
    } else if (totalPaidForInvoice > 0.01) {
      status = 'Partial';
    }

    return {
      status,
      paidAmount: totalPaidForInvoice,
      balance: balance > 0.01 ? balance : 0,
    };
  }, [data.payments]);

  const recalculateAndSyncInvoices = useCallback((invoiceIds, allPayments) => {
    const currentSales = [...(data.sales || [])];
    const currentPurchases = [...(data.purchases || [])];
    let salesUpdated = false;
    let purchasesUpdated = false;

    invoiceIds.forEach(invoiceId => {
        const saleIndex = currentSales.findIndex(s => s.id === invoiceId);
        if (saleIndex > -1) {
            const originalSale = currentSales[saleIndex];
            const paymentsForThisInvoice = allPayments.filter(p => p.invoiceId === invoiceId);
            const totalPaid = paymentsForThisInvoice.reduce((sum, p) => sum + p.amount + (p.discount || 0), 0);
            currentSales[saleIndex] = { ...originalSale, paidAmount: totalPaid };
            salesUpdated = true;
        }

        const purchaseIndex = currentPurchases.findIndex(p => p.id === invoiceId);
        if (purchaseIndex > -1) {
            const originalPurchase = currentPurchases[purchaseIndex];
            const paymentsForThisInvoice = allPayments.filter(p => p.invoiceId === invoiceId);
            const totalPaid = paymentsForThisInvoice.reduce((sum, p) => sum + p.amount + (p.discount || 0), 0);
            currentPurchases[purchaseIndex] = { ...originalPurchase, paidAmount: totalPaid };
            purchasesUpdated = true;
        }
    });

    const updatePayload = {};
    if (salesUpdated) updatePayload.sales = currentSales;
    if (purchasesUpdated) updatePayload.purchases = currentPurchases;
    
    return updatePayload;
  }, [data.sales, data.purchases, getInvoiceStatus]);

  return { getInvoiceStatus, recalculateAndSyncInvoices };
};