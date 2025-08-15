import { useCallback } from 'react';

export const useStockLogic = (data) => {
  const getStockValue = useCallback(({ asOfDate = new Date() } = {}) => {
    let totalValue = 0;
    const { items, purchases, sales } = data;

    if (!items) return 0;

    items.forEach(item => {
        const itemInfo = items.find(i => i.id === item.id);
        const allSales = (sales || []).filter(s => new Date(s.date) <= asOfDate);
        const allPurchases = (purchases || []).filter(p => new Date(p.date) <= asOfDate);

        if (itemInfo?.hasImei) {
            const purchasedSerials = allPurchases
                .flatMap(p => p.items || [])
                .filter(i => i.itemId === item.id && Array.isArray(i.serials))
                .flatMap(i => i.serials.map(s => ({ serial: s, price: i.price })));

            const soldSerials = allSales
                .flatMap(s => s.items || [])
                .filter(i => i.itemId === item.id && Array.isArray(i.serials))
                .flatMap(i => i.serials);
            
            const availableSerials = purchasedSerials.filter(p => !soldSerials.includes(p.serial));
            totalValue += availableSerials.reduce((sum, s) => sum + s.price, 0);
        } else {
            const purchaseLots = allPurchases
                .flatMap(p => (p.items || []).filter(i => i.itemId === item.id).map(i => ({...i, date: p.date, remaining: i.quantity })))
                .sort((a,b) => new Date(a.date) - new Date(b.date));

            const salesForFifo = allSales
                .flatMap(s => (s.items || []).filter(i => i.itemId === item.id))
                .sort((a,b) => new Date(a.date) - new Date(b.date));

            for(const saleItem of salesForFifo) {
                let qtyToDeplete = saleItem.quantity;
                for (const lot of purchaseLots) {
                    if (qtyToDeplete <= 0) break;
                    const fromThisLot = Math.min(qtyToDeplete, lot.remaining);
                    lot.remaining -= fromThisLot;
                    qtyToDeplete -= fromThisLot;
                }
            }

            const openingStockValue = (item.openingStock || 0) * (item.purchasePrice || 0);
            const remainingValue = purchaseLots.reduce((sum, lot) => sum + (lot.remaining * lot.price), 0);
            totalValue += openingStockValue + remainingValue;
        }
    });

    return totalValue;
  }, [data]);

  return { getStockValue };
};