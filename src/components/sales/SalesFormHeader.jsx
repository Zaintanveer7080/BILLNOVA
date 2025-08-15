import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SalesFormHeader = ({ saleNumber, onSaleNumberChange, customerId, onCustomerChange, customers, date, onDateChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="saleNumber">Sale Number</Label>
        <Input id="saleNumber" value={saleNumber} onChange={e => onSaleNumberChange(e.target.value)} readOnly />
      </div>
      <div>
        <Label htmlFor="customer">Customer</Label>
        <Select value={customerId} onValueChange={onCustomerChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {(customers || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="date">Date & Time</Label>
        <Input id="date" type="datetime-local" value={date} onChange={e => onDateChange(e.target.value)} />
      </div>
    </div>
  );
};

export default SalesFormHeader;