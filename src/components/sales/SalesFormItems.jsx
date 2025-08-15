import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, AlertTriangle } from 'lucide-react';
import SaleItemRow from './SaleItemRow';

const SalesFormItems = ({ saleItems, onItemsChange, allItems, sale, itemProfits, purchases, sales }) => {
  const addItem = () => {
    onItemsChange([...(saleItems || []), { itemId: '', quantity: 1, price: 0, serials: [] }]);
  };
  
  const removeItem = (index) => {
    onItemsChange(saleItems.filter((_, i) => i !== index));
  };

  const updateSaleItem = (index, updatedItem) => {
    const newSaleItems = [...saleItems];
    newSaleItems[index] = updatedItem;
    onItemsChange(newSaleItems);
  };

  const getAvailableSerials = React.useCallback((itemId) => {
    if (!itemId) return [];
    
    const purchasedSerials = (purchases || [])
      .flatMap(p => p.items || [])
      .filter(item => item.itemId === itemId && Array.isArray(item.serials))
      .flatMap(item => item.serials.filter(s => s));
      
    const soldSerials = (sales || [])
      .filter(s => !sale || s.id !== sale.id)
      .flatMap(s => s.items || [])
      .filter(item => item.itemId === itemId && Array.isArray(item.serials))
      .flatMap(item => item.serials);

    return purchasedSerials.filter(ps => !soldSerials.includes(ps));
  }, [purchases, sales, sale]);

  const getItemStock = React.useCallback((itemId) => {
    if (!itemId) return 0;
    const itemData = (allItems || []).find(i => i.id === itemId);
    if (itemData?.hasImei) {
      return getAvailableSerials(itemId).length;
    }
    const openingStock = itemData?.openingStock || 0;
    const totalPurchased = (purchases || []).reduce((sum, p) => sum + ((p?.items || []).find(pi => pi.itemId === itemId)?.quantity || 0), 0);
    const totalSold = (sales || []).reduce((sum, s) => {
      if (sale && s.id === sale.id) return sum;
      return sum + ((s?.items || []).find(si => si.itemId === itemId)?.quantity || 0);
    }, 0);
    return openingStock + totalPurchased - totalSold;
  }, [allItems, getAvailableSerials, purchases, sales, sale]);

  const isAnyItemOutOfStock = saleItems.some(i => i.itemId && (parseInt(i.quantity) || 0) > getItemStock(i.itemId));

  return (
    <div className="space-y-4 border-t border-b py-6">
      <Label>Items</Label>
      {(saleItems || []).map((item, index) => (
        <SaleItemRow
          key={index}
          item={item}
          index={index}
          onItemChange={updateSaleItem}
          onRemove={removeItem}
          items={allItems}
          getItemStock={getItemStock}
          getAvailableSerials={getAvailableSerials}
          sale={sale}
          itemProfit={itemProfits[item.itemId]}
        />
      ))}
      {isAnyItemOutOfStock && (
        <div className="text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Not enough stock for one or more items.
        </div>
      )}
      <Button type="button" variant="outline" onClick={addItem} className="mt-2">
        <Plus className="h-4 w-4 mr-2" />Add Item
      </Button>
    </div>
  );
};

export default SalesFormItems;