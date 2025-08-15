import { useCallback } from 'react';

export const useProfitLogic = (data) => {
  const getProfitOfSale = useCallback((sale) => {
    if (!sale || !sale.items) return { totalProfit: 0, itemProfits: {} };

    const { purchases: allPurchases, items: allItems, sales: allSales } = data;
    const itemProfits = {};

    const totalProfitFromItems = (sale.items || []).reduce((sum, saleItem) => {
        if (!saleItem || !saleItem.itemId || !saleItem.quantity) {
            itemProfits[saleItem.itemId] = { cogs: 0, profit: 0 };
            return sum;
        }
        
        const itemInfo = (allItems || []).find(i => i.id === saleItem.itemId);
        const salePricePerUnit = saleItem.price || 0;
        const quantity = saleItem.quantity || 0;
        let totalCostOfGoods = 0;

        if (itemInfo?.hasImei) {
            const allPurchaseItemsWithSerials = (allPurchases || []).flatMap(p => 
                (p.items || [])
                .filter(i => i.itemId === saleItem.itemId && Array.isArray(i.serials))
                .flatMap(i => i.serials.map(s => ({ serial: s, price: i.price })))
            );
            
            totalCostOfGoods = (saleItem.serials || []).reduce((itemSum, serial) => {
                const foundPurchase = allPurchaseItemsWithSerials.find(p => p.serial === serial);
                return itemSum + (foundPurchase?.price || itemInfo?.purchasePrice || 0);
            }, 0);
        } else {
            const purchaseLots = (allPurchases || [])
                .flatMap(p => (p.items || []).filter(i => i.itemId === saleItem.itemId).map(i => ({...i, date: p.date })))
                .sort((a,b) => new Date(a.date) - new Date(b.date));

            const consumedLots = {};

            const salesBeforeThis = (allSales || [])
                .filter(s => s.id !== sale.id && new Date(s.date) < new Date(sale.date))
                .sort((a,b) => new Date(a.date) - new Date(b.date));
            
            for (const prevSale of salesBeforeThis) {
                for (const prevSaleItem of (prevSale.items || [])) {
                    if (prevSaleItem.itemId === saleItem.itemId) {
                        let qtyToDeplete = prevSaleItem.quantity;
                        for (let i = 0; i < purchaseLots.length; i++) {
                            const lotId = `${purchaseLots[i].date}-${i}`;
                            const consumed = consumedLots[lotId] || 0;
                            const available = purchaseLots[i].quantity - consumed;
                            const fromThisLot = Math.min(qtyToDeplete, available);
                            
                            if (fromThisLot > 0) {
                                consumedLots[lotId] = consumed + fromThisLot;
                                qtyToDeplete -= fromThisLot;
                            }
                            if (qtyToDeplete <= 0) break;
                        }
                    }
                }
            }

            let qtyToAccountFor = quantity;
            for (let i = 0; i < purchaseLots.length; i++) {
                if (qtyToAccountFor <= 0) break;
                const lotId = `${purchaseLots[i].date}-${i}`;
                const consumed = consumedLots[lotId] || 0;
                const available = purchaseLots[i].quantity - consumed;
                const fromThisLot = Math.min(qtyToAccountFor, available);
                
                if (fromThisLot > 0) {
                    totalCostOfGoods += fromThisLot * purchaseLots[i].price;
                    qtyToAccountFor -= fromThisLot;
                }
            }

            if (qtyToAccountFor > 0) {
              totalCostOfGoods += qtyToAccountFor * (itemInfo?.purchasePrice || 0);
            }
        }
        
        const lineRevenue = salePricePerUnit * quantity;
        const lineProfit = lineRevenue - totalCostOfGoods;
        itemProfits[saleItem.itemId] = { cogs: totalCostOfGoods, profit: lineProfit, revenue: lineRevenue };
        return sum + lineProfit;
    }, 0);

    const saleDiscount = sale.discount?.type === 'flat' ? (sale.discount.value || 0) : ((sale.subTotal || 0) * (sale.discount?.value || 0) / 100);
    return { totalProfit: totalProfitFromItems - saleDiscount, itemProfits };

  }, [data]);

  return { getProfitOfSale };
};