import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { formatInTimeZone } from 'date-fns-tz';
import PurchaseFormHeader from './PurchaseFormHeader';
import PurchaseItems from './PurchaseItems';
import PurchaseFormFooter from './PurchaseFormFooter';

const PurchaseForm = ({ purchase, onClose }) => {
  const { data, updateData, requestPasscode } = useData();
  const { items, purchases, payments, cashInHand, banks, suppliers } = data;
  const { toast } = useToast();

  const [purchaseNumber, setPurchaseNumber] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(formatInTimeZone(new Date(), 'Asia/Dubai', 'yyyy-MM-dd\'T\'HH:mm'));
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountType, setDiscountType] = useState('flat');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [bankId, setBankId] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const generatePurchaseNumber = useCallback(() => {
    const validPurchases = (purchases || [])
      .filter(p => p && p.purchaseNumber && typeof p.purchaseNumber === 'string' && p.purchaseNumber.startsWith('P-'))
      .map(p => parseInt(p.purchaseNumber.split('-')[1] || '0', 10))
      .sort((a, b) => a - b);
    if (validPurchases.length === 0) return 'P-0001';
    const lastNum = validPurchases[validPurchases.length - 1];
    return `P-${(lastNum + 1).toString().padStart(4, '0')}`;
  }, [purchases]);
  
  useEffect(() => {
    if (purchase) {
      setPurchaseNumber(purchase.purchaseNumber);
      setSupplierId(purchase.supplierId);
      setDate(purchase.date);
      setPurchaseItems(purchase.items || []);
      setNotes(purchase.notes || '');
      setDiscount(purchase.discount?.value || '');
      setDiscountType(purchase.discount?.type || 'flat');
      setPaymentMethod(purchase.payment?.method || 'cash');
      setPaidAmount(purchase.paidAmount?.toString() || '');
      setBankId(purchase.payment?.bankId || '');
      setPaymentRef(purchase.payment?.ref || '');
    } else {
      setPurchaseNumber(generatePurchaseNumber());
      setDate(formatInTimeZone(new Date(), 'Asia/Dubai', 'yyyy-MM-dd\'T\'HH:mm'));
      setPurchaseItems([{ itemId: '', quantity: 1, price: 0, serials: [] }]);
    }
  }, [purchase, generatePurchaseNumber]);

  const { subTotal, totalDiscount, totalCost, totalQuantity, balance, unit } = useMemo(() => {
    const currentItems = Array.isArray(purchaseItems) ? purchaseItems : [];
    const subTotal = currentItems.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    const discountVal = parseFloat(discount) || 0;
    const totalDiscount = discountType === 'flat' ? discountVal : subTotal * (discountVal / 100);
    const totalCost = subTotal - totalDiscount;
    const totalQuantity = currentItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    const balance = totalCost - (parseFloat(paidAmount) || 0);

    const firstItem = currentItems.length > 0 ? items.find(i => i.id === currentItems[0].itemId) : null;
    const unit = firstItem ? firstItem.unit : 'pcs';

    return { subTotal, totalDiscount, totalCost, totalQuantity, balance, unit };
  }, [purchaseItems, discount, discountType, paidAmount, items]);

  useEffect(() => {
    if (!purchase) {
      setPaidAmount(totalCost > 0 ? totalCost.toFixed(2) : '');
    }
  }, [totalCost, purchase]);

  const handleSave = () => {
    if (!supplierId || purchaseItems.some(i => !i.itemId)) {
      toast({ title: 'Error', description: 'Supplier and all items must be selected.', variant: 'destructive' });
      return;
    }
    if ((purchases || []).some(p => p.purchaseNumber === purchaseNumber && p.id !== purchase?.id)) {
      toast({ title: 'Error', description: 'Purchase number must be unique.', variant: 'destructive' });
      return;
    }
    if (purchaseItems.some(item => !item.price || parseFloat(item.price) <= 0)) {
        toast({ title: 'Error', description: 'Please ensure all items have a unit cost greater than zero.', variant: 'destructive' });
        return;
    }
    
    for (const item of purchaseItems) {
        const itemInfo = items.find(i => i.id === item.itemId);
        if (itemInfo?.hasImei && item.quantity !== item.serials.length) {
            toast({ title: "Validation Error", description: `Please provide ${item.quantity} unique serial numbers for ${itemInfo.name}.`, variant: "destructive" });
            return;
        }
    }

    const enteredPaidAmount = parseFloat(paidAmount) || 0;
    if (enteredPaidAmount > totalCost) {
      toast({ title: 'Error', description: 'Paid amount cannot be greater than the total bill.', variant: 'destructive' });
      return;
    }

    const purchaseId = purchase ? purchase.id : Date.now().toString();

    const purchaseData = {
      id: purchaseId,
      purchaseNumber,
      supplierId,
      date,
      items: purchaseItems.map(i => ({ ...i, quantity: parseInt(i.quantity) || 0, price: parseFloat(i.price) || 0 })),
      notes,
      subTotal,
      totalQuantity,
      discount: { value: parseFloat(discount) || 0, type: discountType },
      totalCost,
      paidAmount: enteredPaidAmount,
      payment: {
        method: paymentMethod,
        bankId: bankId,
        ref: paymentRef,
      }
    };
    
    const newPayments = [];
    const oldPayment = purchase ? (payments || []).find(p => p.invoiceId === purchase.id) : null;

    if (enteredPaidAmount > 0) {
        newPayments.push({
            id: oldPayment?.id || `${Date.now()}_${purchaseId}`,
            partyId: supplierId,
            partyType: 'supplier',
            type: 'out',
            invoiceId: purchaseId,
            amount: enteredPaidAmount,
            date: date,
            method: paymentMethod,
            bankId: paymentMethod === 'bank' ? bankId : undefined,
            notes: `Payment for Purchase #${purchaseNumber}`
        });
    }

    let updatedCashInHand = cashInHand;
    let updatedBanks = JSON.parse(JSON.stringify(banks || []));

    if (oldPayment) {
        if(oldPayment.method === 'cash') updatedCashInHand += oldPayment.amount;
        else if (oldPayment.bankId) {
            const oldBankIndex = updatedBanks.findIndex(b => b.id === oldPayment.bankId);
            if(oldBankIndex > -1) updatedBanks[oldBankIndex].balance += oldPayment.amount;
        }
    }

    if (enteredPaidAmount > 0) {
        if (paymentMethod === 'cash') updatedCashInHand -= enteredPaidAmount;
        else if (bankId) {
            const newBankIndex = updatedBanks.findIndex(b => b.id === bankId);
            if(newBankIndex > -1) updatedBanks[newBankIndex].balance -= enteredPaidAmount;
        }
    }

    const otherPayments = (payments || []).filter(p => p.invoiceId !== purchaseId);
    const updatedPayments = [...otherPayments, ...newPayments];
    const newPurchases = purchase 
      ? (purchases || []).map(p => p.id === purchase.id ? purchaseData : p)
      : [...(purchases || []), purchaseData];

    updateData({ purchases: newPurchases, banks: updatedBanks, cashInHand: updatedCashInHand, payments: updatedPayments });
    toast({ title: 'Success', description: `Purchase ${purchase ? 'updated' : 'saved'}.` });
    onClose();
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (purchase) {
      requestPasscode(handleSave, { isEdit: true });
    } else {
      handleSave();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <PurchaseFormHeader
            purchaseNumber={purchaseNumber}
            onPurchaseNumberChange={setPurchaseNumber}
            supplierId={supplierId}
            onSupplierChange={setSupplierId}
            suppliers={suppliers}
            date={date}
            onDateChange={setDate}
          />
          <PurchaseItems
            items={purchaseItems}
            onItemsChange={setPurchaseItems}
            allItems={items}
          />
        </div>
        
        <PurchaseFormFooter
          paymentMethod={paymentMethod} onPaymentMethodChange={setPaymentMethod}
          paidAmount={paidAmount} onPaidAmountChange={setPaidAmount}
          notes={notes} onNotesChange={setNotes}
          bankId={bankId} onBankIdChange={setBankId}
          banks={banks}
          paymentRef={paymentRef} onPaymentRefChange={setPaymentRef}
          totalQuantity={totalQuantity}
          unit={unit}
          subTotal={subTotal}
          discount={discount} onDiscountChange={setDiscount}
          discountType={discountType} onDiscountTypeChange={setDiscountType}
          totalDiscount={totalDiscount}
          totalCost={totalCost}
          balance={balance}
          onClose={onClose}
          isEdit={!!purchase}
        />
      </form>
    </div>
  );
};

export default PurchaseForm;