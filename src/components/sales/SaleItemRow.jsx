import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import SaleSerialsManager from '@/components/sales/SaleSerialsManager';

const SaleItemRow = ({ item, index, onItemChange, onRemove, items, getItemStock, getAvailableSerials, sale, itemProfit }) => {
  const itemInfo = items.find(i => i.id === item.itemId);

  const handleFieldChange = (field, value) => {
    const newItem = { ...item, [field]: value };
    
    if (field === 'itemId') {
      const selectedItem = items.find(i => i.id === value);
      if (selectedItem) {
        newItem.price = selectedItem.salePrice || 0;
        newItem.quantity = selectedItem.hasImei ? 0 : 1;
        newItem.serials = [];
      }
    } else if (field === 'quantity') {
       if (!itemInfo?.hasImei) {
          newItem.quantity = parseInt(value, 10) || 0;
       }
    } else if (field === 'price') {
        newItem.price = parseFloat(value) || 0;
    }
    
    onItemChange(index, newItem);
  };

  const handleSerialsChange = (newSerials) => {
    const newItem = { ...item, serials: newSerials, quantity: newSerials.length };
    onItemChange(index, newItem);
  };

  const cogs = itemProfit?.cogs || 0;
  const profit = itemProfit?.profit || 0;
  const profitMargin = cogs > 0 ? (profit / cogs) * 100 : 0;

  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-grow">
          <Select value={item.itemId} onValueChange={v => handleFieldChange('itemId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {(items || []).map(i => (
                <SelectItem 
                  key={i.id} 
                  value={i.id} 
                  disabled={getItemStock(i.id) <= 0 && (!sale || !sale.items.find(si => si.itemId === i.id))}
                >
                  {i.name} (Stock: {getItemStock(i.id)} {i.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Input 
            type="number" 
            placeholder="Qty" 
            value={item.quantity} 
            onChange={e => handleFieldChange('quantity', e.target.value)} 
            min="1" 
            readOnly={itemInfo?.hasImei} 
          />
        </div>
        <div className="w-32">
          <Input 
            type="number" 
            placeholder="Price" 
            value={item.price} 
            onChange={e => handleFieldChange('price', e.target.value)} 
          />
        </div>
        <div>
          <Button type="button" variant="destructive" size="icon" onClick={() => onRemove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {itemInfo?.hasImei && (
        <SaleSerialsManager
          item={item}
          onSerialsChange={handleSerialsChange}
          getAvailableSerials={getAvailableSerials}
          sale={sale}
        />
      )}
      {item.itemId && item.quantity > 0 && (
        <div className="flex justify-end items-center gap-4 text-xs text-muted-foreground pt-1">
          <span>COGS: RS {cogs.toFixed(2)}</span>
          <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
            Profit: RS {profit.toFixed(2)} ({profitMargin.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  );
};

export default SaleItemRow;