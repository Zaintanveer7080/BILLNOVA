import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PurchaseFormHeader = ({ purchaseNumber, onPurchaseNumberChange, supplierId, onSupplierChange, suppliers, date, onDateChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="purchaseNumber">Bill Number</Label>
        <Input id="purchaseNumber" value={purchaseNumber} onChange={e => onPurchaseNumberChange(e.target.value)} readOnly/>
      </div>
      <div>
        <Label htmlFor="supplier">Supplier</Label>
        <Select value={supplierId} onValueChange={onSupplierChange}>
          <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
          <SelectContent>{(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="date">Date & Time</Label>
        <Input id="date" type="datetime-local" value={date} onChange={e => onDateChange(e.target.value)} />
      </div>
    </div>
  );
};

export default PurchaseFormHeader;