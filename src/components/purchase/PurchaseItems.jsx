import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, PackagePlus, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/contexts/DataContext';
import { Badge } from '@/components/ui/badge';

const SerialNumberManager = ({ item, onSerialsChange }) => {
  const [currentSerial, setCurrentSerial] = useState('');

  const handleAddSerial = () => {
    if (currentSerial && !item.serials.includes(currentSerial)) {
      onSerialsChange([...item.serials, currentSerial.trim()]);
      setCurrentSerial('');
    }
  };

  const handleRemoveSerial = (serialToRemove) => {
    onSerialsChange(item.serials.filter(s => s !== serialToRemove));
  };
  
  return (
    <div className="space-y-2 pt-2">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter Serial Number"
          value={currentSerial}
          onChange={e => setCurrentSerial(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSerial(); } }}
        />
        <Button type="button" onClick={handleAddSerial}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {item.serials.map(serial => (
          <Badge key={serial} variant="secondary" className="flex items-center gap-1">
            {serial}
            <button type="button" onClick={() => handleRemoveSerial(serial)} className="rounded-full hover:bg-destructive/80 p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

const AddNewItemDialog = ({ onAddNewItem }) => {
    const { data, updateData } = useData();
    const { items } = data;
    const { toast } = useToast();
    const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
    const [newItemData, setNewItemData] = useState({ sku: '', name: '', purchasePrice: '', unit: 'pcs' });

    const handleCreateNewItem = (e) => {
        e.preventDefault();
        if (!newItemData.sku || !newItemData.name) {
            toast({ title: 'Error', description: 'SKU and Name are required for new item.', variant: 'destructive' });
            return;
        }
        if (items.some(i => i.sku.toLowerCase() === newItemData.sku.toLowerCase())) {
            toast({ title: 'Error', description: 'This SKU already exists.', variant: 'destructive' });
            return;
        }
        const newItem = {
            id: Date.now().toString(),
            sku: newItemData.sku,
            name: newItemData.name,
            purchasePrice: parseFloat(newItemData.purchasePrice) || 0,
            salePrice: 0,
            openingStock: 0,
            category: '',
            unit: newItemData.unit || 'pcs'
        };
        updateData({ items: [...items, newItem] });
        toast({ title: 'Success', description: `Item "${newItem.name}" added.` });
        setIsAddItemDialogOpen(false);
        onAddNewItem(newItem);
        setNewItemData({ sku: '', name: '', purchasePrice: '', unit: 'pcs' });
    };

    return (
        <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="secondary"><PackagePlus className="h-4 w-4 mr-2"/>Create New Item</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Create New Item</DialogTitle></DialogHeader>
                <form onSubmit={handleCreateNewItem} className="py-4 space-y-4">
                    <div><Label htmlFor="newItemSku">SKU</Label><Input id="newItemSku" value={newItemData.sku} onChange={e => setNewItemData({...newItemData, sku: e.target.value})} /></div>
                    <div><Label htmlFor="newItemName">Name</Label><Input id="newItemName" value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} /></div>
                    <div><Label htmlFor="newItemPrice">Purchase Price</Label><Input id="newItemPrice" type="number" value={newItemData.purchasePrice} onChange={e => setNewItemData({...newItemData, purchasePrice: e.target.value})} /></div>
                    <div><Label htmlFor="newItemUnit">Unit</Label><Input id="newItemUnit" value={newItemData.unit} onChange={e => setNewItemData({...newItemData, unit: e.target.value})} /></div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Create and Add</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

const PurchaseItems = ({ items, onItemsChange, allItems }) => {

  const addItem = () => {
    onItemsChange([...(items || []), { itemId: '', quantity: 1, price: 0, serials: [] }]);
  };
  
  const removeItem = (index) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };
  
  const updatePurchaseItem = (index, updatedItem) => {
    const newPurchaseItems = [...items];
    newPurchaseItems[index] = updatedItem;
    onItemsChange(newPurchaseItems);
  };
  
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    const currentItem = updatedItems[index];

    if (field === 'quantity') {
      const itemInfo = allItems.find(i => i.id === currentItem.itemId);
      if (!itemInfo?.hasImei) currentItem.quantity = parseInt(value, 10) || 0;
    } else if (field === 'itemId') {
      const selectedItem = allItems.find(i => i.id === value);
      if (selectedItem) {
        currentItem.itemId = value;
        currentItem.price = selectedItem.purchasePrice || 0;
        currentItem.quantity = 1;
        currentItem.serials = [];
      }
    } else {
        currentItem[field] = value;
    }
    onItemsChange(updatedItems);
  };

  const handleSerialsChange = (itemIndex, newSerials) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].serials = newSerials;
    updatedItems[itemIndex].quantity = newSerials.length;
    onItemsChange(updatedItems);
  };
  
  const handleAddNewItem = (newItem) => {
    onItemsChange([...items, { itemId: newItem.id, quantity: 1, price: newItem.purchasePrice, serials:[] }]);
  };
  
  return (
    <div className="space-y-4 border-t border-b py-6">
      <Label>Items</Label>
      {(items || []).map((item, index) => {
        const itemInfo = allItems.find(i => i.id === item.itemId);
        return (
          <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-grow">
                <Select value={item.itemId} onValueChange={v => handleItemChange(index, 'itemId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>{(allItems || []).map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.sku})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-24"><Input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} readOnly={itemInfo?.hasImei} /></div>
              <div className="w-32"><Input type="number" placeholder="Unit Cost" value={item.price} onChange={e => handleItemChange(index, 'price', e.target.value)} /></div>
              <div><Button type="button" variant="destructive" size="icon" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4" /></Button></div>
            </div>
            {itemInfo?.hasImei && (
              <SerialNumberManager item={item} onSerialsChange={(newSerials) => handleSerialsChange(index, newSerials)} />
            )}
          </div>
        )
      })}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />Add Item
        </Button>
        <AddNewItemDialog onAddNewItem={handleAddNewItem} />
      </div>
    </div>
  );
};

export default PurchaseItems;