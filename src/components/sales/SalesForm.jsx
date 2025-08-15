import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatInTimeZone } from 'date-fns-tz';
import SalesFormHeader from './SalesFormHeader';
import SalesFormItems from './SalesFormItems';
import SalesFormFooter from './SalesFormFooter';

const SalesForm = ({ sale, onClose }) => {
  const { data, updateData, getProfitOfSale, requestPasscode } = useData();
  const { customers, items, banks, cashInHand, sales, purchases, onlineOrders, payments } = data;
  const { toast } = useToast();

  const [saleNumber, setSaleNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(formatInTimeZone(new Date(), 'Asia/Dubai', 'yyyy-MM-dd\'T\'HH:mm'));
  const [saleItems, setSaleItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('flat');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [bankId, setBankId] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [isOnlineOrder, setIsOnlineOrder] = useState(false);

  const generateSaleNumber = useCallback(() => {
    const validSales = (sales || [])
      .filter(s => s && s.saleNumber && typeof s.saleNumber === 'string' && s.saleNumber.startsWith('S-'))
      .map(s => parseInt(s.saleNumber.split('-')[1] || '0', 10))
      .sort((a, b) => a - b);
      
    if (validSales.length === 0) return 'S-0001';
    const lastNum = validSales[validSales.length - 1];
    return `S-${(lastNum + 1).toString().padStart(4, '0')}`;
  }, [sales]);

  useEffect(() => {
    if (sale) {
      setSaleNumber(sale.saleNumber);
      setCustomerId(sale.customerId);
      setDate(sale.date);
      setSaleItems(sale.items || []);
      setNotes(sale.notes || '');
      setDiscount(sale.discount?.value || '');
      setDiscountType(sale.discount?.type || 'flat');
      setPaymentMethod(sale.payment?.method || 'cash');
      setPaidAmount(sale.paidAmount?.toString() || '');
      setBankId(sale.payment?.bankId || '');
      setPaymentRef(sale.payment?.ref || '');
      setIsOnlineOrder(!!sale.isOnlineOrder);
    } else {
      setSaleNumber(generateSaleNumber());
      setDate(formatInTimeZone(new Date(), 'Asia/Dubai', 'yyyy-MM-dd\'T\'HH:mm'));
      setSaleItems([{ itemId: '', quantity: 1, price: 0, serials: [] }]);
      setIsOnlineOrder(false);
      setPaidAmount('');
    }
  }, [sale, generateSaleNumber]);

  const { subTotal, totalDiscount, totalCost, totalQuantity, balance, unit, profit, itemProfits } = useMemo(() => {
    const currentSaleItems = Array.isArray(saleItems) ? saleItems : [];
    const subTotal = currentSaleItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    const enteredDiscount = parseFloat(discount) || 0;
    let totalDiscount = discountType === 'flat' ? enteredDiscount : subTotal * (enteredDiscount / 100);
    if(isNaN(totalDiscount)) totalDiscount = 0;

    const totalCost = subTotal - totalDiscount;
    const totalQuantity = currentSaleItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const balance = totalCost - (parseFloat(paidAmount) || 0);
    
    const firstItem = currentSaleItems.length > 0 ? (items || []).find(i => i.id === currentSaleItems[0].itemId) : null;
    const unit = firstItem ? firstItem.unit : '';

    const draftSale = {
      id: sale?.id || 'draft-sale',
      date,
      items: saleItems,
      subTotal,
      discount: { value: parseFloat(discount) || 0, type: discountType },
      totalCost,
    };
    const { totalProfit, itemProfits } = getProfitOfSale(draftSale);

    return { subTotal, totalDiscount, totalCost, totalQuantity, balance, unit, profit: totalProfit, itemProfits };
  }, [saleItems, discount, discountType, paidAmount, items, getProfitOfSale, date, sale]);

  useEffect(() => {
    if (!sale) {
      setPaidAmount(totalCost > 0 ? totalCost.toFixed(2) : '');
    }
  }, [totalCost, sale]);

  const handleSave = () => {
    if (!customerId || saleItems.some(i => !i.itemId)) {
      toast({ title: 'Error', description: 'Customer and all items must be selected.', variant: 'destructive' });
      return;
    }
    if (saleItems.some(item => !item.price || parseFloat(item.price) <= 0)) {
        toast({ title: 'Error', description: 'Please ensure all items have a unit price greater than zero.', variant: 'destructive' });
        return;
    }
    if ((sales || []).some(s => s.saleNumber === saleNumber && s.id !== sale?.id)) {
      toast({ title: 'Error', description: 'Sale number must be unique.', variant: 'destructive' });
      return;
    }
    const enteredPaidAmount = parseFloat(paidAmount) || 0;
    if (enteredPaidAmount > totalCost) {
      toast({ title: 'Error', description: 'Paid amount cannot be greater than the total bill.', variant: 'destructive' });
      return;
    }
    
    const saleId = sale ? sale.id : Date.now().toString();
    const saleData = {
      id: saleId, saleNumber, customerId, date, notes, isOnlineOrder,
      items: saleItems.map(i => ({...i, quantity: parseInt(i.quantity) || 0, price: parseFloat(i.price) || 0})),
      subTotal, totalQuantity, totalCost,
      discount: { value: parseFloat(discount) || 0, type: discountType },
      paidAmount: enteredPaidAmount,
      profit,
      payment: { method: paymentMethod, bankId, ref: paymentRef }
    };
    
    const newPayments = [];
    const oldPayment = sale ? (payments || []).find(p => p.invoiceId === sale.id) : null;

    if (enteredPaidAmount > 0) {
      newPayments.push({
        id: oldPayment?.id || `${Date.now()}_${saleId}`,
        partyId: customerId, partyType: 'customer', type: 'in', invoiceId: saleId,
        amount: enteredPaidAmount, date: date, method: paymentMethod,
        bankId: paymentMethod === 'bank' ? bankId : undefined, notes: `Payment for Sale #${saleNumber}`
      });
    }

    let updatedCashInHand = cashInHand;
    let updatedBanks = JSON.parse(JSON.stringify(banks || []));
    if (oldPayment) {
      if (oldPayment.method === 'cash') updatedCashInHand -= oldPayment.amount;
      else if (oldPayment.bankId) {
        const oldBankIndex = updatedBanks.findIndex(b => b.id === oldPayment.bankId);
        if (oldBankIndex > -1) updatedBanks[oldBankIndex].balance -= oldPayment.amount;
      }
    }

    if (enteredPaidAmount > 0) {
      if (paymentMethod === 'cash') updatedCashInHand += enteredPaidAmount;
      else if (bankId) {
        const newBankIndex = updatedBanks.findIndex(b => b.id === bankId);
        if (newBankIndex > -1) updatedBanks[newBankIndex].balance += enteredPaidAmount;
      }
    }
    
    const otherPayments = (payments || []).filter(p => p.invoiceId !== saleId);
    const updatedPayments = [...otherPayments, ...newPayments];
    const newSales = sale ? (sales || []).map(s => s.id === sale.id ? saleData : s) : [...(sales || []), saleData];
    
    let updatedOnlineOrders = [...(data.onlineOrders || [])];
    if (isOnlineOrder) {
      const existingOrderIndex = updatedOnlineOrders.findIndex(o => o.saleId === saleId);
      if (existingOrderIndex === -1) {
        updatedOnlineOrders.push({
          id: Date.now().toString(), saleId, status: 'Pending',
          statusHistory: [{ status: 'Pending', date: new Date().toISOString() }],
        });
        toast({ title: 'Online Order Created', description: 'This sale is now tracked in Online Orders.' });
      }
    } else {
      updatedOnlineOrders = updatedOnlineOrders.filter(o => o.saleId !== saleId);
    }
    
    updateData({ sales: newSales, onlineOrders: updatedOnlineOrders, banks: updatedBanks, cashInHand: updatedCashInHand, payments: updatedPayments });
    toast({ title: 'Success', description: `Sale ${sale ? 'updated' : 'saved'}.` });
    onClose();
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sale) {
      requestPasscode(handleSave, { isEdit: true });
    } else {
      handleSave();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <SalesFormHeader
            saleNumber={saleNumber}
            onSaleNumberChange={setSaleNumber}
            customerId={customerId}
            onCustomerChange={setCustomerId}
            customers={customers}
            date={date}
            onDateChange={setDate}
          />
          <SalesFormItems
            saleItems={saleItems}
            onItemsChange={setSaleItems}
            allItems={items}
            sale={sale}
            itemProfits={itemProfits}
            purchases={purchases}
            sales={sales}
          />
        </div>
        
        <SalesFormFooter
          paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod}
          paidAmount={paidAmount} onPaidAmountChange={setPaidAmount}
          notes={notes} onNotesChange={setNotes}
          bankId={bankId} onBankIdChange={setBankId}
          banks={banks}
          paymentRef={paymentRef} onPaymentRefChange={setPaymentRef}
          isOnlineOrder={isOnlineOrder} onIsOnlineOrderChange={setIsOnlineOrder}
          totalQuantity={totalQuantity}
          unit={unit}
          subTotal={subTotal}
          discount={discount} onDiscountChange={setDiscount}
          discountType={discountType} onDiscountTypeChange={setDiscountType}
          totalDiscount={totalDiscount}
          totalCost={totalCost}
          balance={balance}
          profit={profit}
          onClose={onClose}
          isEdit={!!sale}
        />
      </form>
    </div>
  );
};

export default SalesForm;