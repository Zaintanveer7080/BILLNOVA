import React, { useMemo, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import ReportWrapper from './ReportWrapper';
import FilterToolbar from '../FilterToolbar';
import { useFilters } from '@/hooks/useFilters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DailyBook = () => {
  const { data, getStockValue, getProfitOfSale, setTransactionToView } = useData();
  const { sales, purchases, expenses, payments, cashTransactions, customers, suppliers, banks } = data;
  const { toast } = useToast();
  
  const { filters, handleDateRangeChange, setDatePreset } = useFilters('dailyBook', []);
  const selectedDate = filters.dateRange.from || new Date();

  const dailyData = useMemo(() => {
    const date = new Date(selectedDate);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const prevDayEnd = endOfDay(subDays(date, 1));
    
    const openingStockValue = getStockValue({ asOfDate: prevDayEnd });
    const openingCash = (data.cashInHand || 0) - (cashTransactions || []).filter(t => new Date(t.date) >= dayStart).reduce((sum, t) => t.type === 'add' ? sum + t.amount : sum - t.amount, 0);
    const openingBankBalances = (banks || []).map(bank => {
        const todaysMovements = (payments || [])
            .filter(p => p.bankId === bank.id && new Date(p.date) >= dayStart)
            .reduce((sum, p) => p.type === 'in' ? sum + p.amount : sum - p.amount, 0);
        return { ...bank, balance: bank.balance - todaysMovements };
    });

    const closingStockValue = getStockValue({ asOfDate: dayEnd });
    const closingCash = data.cashInHand || 0;
    const closingBankBalances = data.banks || [];
    
    const dailyTransactions = [];

    (sales || []).filter(s => new Date(s.date) >= dayStart && new Date(s.date) <= dayEnd).forEach(s => {
      const { totalProfit } = getProfitOfSale(s);
      dailyTransactions.push({ time: new Date(s.date), type: 'Sale', ref: s.saleNumber, party: customers.find(c => c.id === s.customerId)?.name, amount: s.totalCost, notes: `Profit: RS ${totalProfit.toFixed(2)}`, raw: s, rawType: 'sale' });
    });
    (purchases || []).filter(p => new Date(p.date) >= dayStart && new Date(p.date) <= dayEnd).forEach(p => {
      dailyTransactions.push({ time: new Date(p.date), type: 'Purchase', ref: p.purchaseNumber, party: suppliers.find(sup => sup.id === p.supplierId)?.name, amount: p.totalCost, notes: '', raw: p, rawType: 'purchase' });
    });
    (payments || []).filter(p => new Date(p.date) >= dayStart && new Date(p.date) <= dayEnd).forEach(p => {
      dailyTransactions.push({ time: new Date(p.date), type: p.type === 'in' ? 'Payment In' : 'Payment Out', ref: p.id.slice(-6), party: p.type === 'in' ? customers.find(c=>c.id === p.partyId)?.name : suppliers.find(sup=>sup.id === p.partyId)?.name, amount: p.amount, notes: `${p.method === 'bank' ? banks.find(b=>b.id===p.bankId)?.name : 'Cash'}`, raw: p, rawType: 'payment' });
    });
    (expenses || []).filter(e => new Date(e.date) >= dayStart && new Date(e.date) <= dayEnd).forEach(e => {
        dailyTransactions.push({ time: new Date(e.date), type: 'Expense', ref: e.id.slice(-6), party: e.category, amount: e.amount, notes: e.description, raw: e, rawType: 'expense' })
    });
    dailyTransactions.sort((a,b) => a.time - b.time);

    return {
        opening: { stock: openingStockValue, cash: openingCash, banks: openingBankBalances },
        closing: { stock: closingStockValue, cash: closingCash, banks: closingBankBalances },
        transactions: dailyTransactions,
    };
  }, [selectedDate, data, getStockValue, getProfitOfSale]);

  const handleExport = () => {
    toast({ description: "PDF/CSV export for Daily Book is not yet available." });
  };

  const onDateChange = (range) => {
    if (range?.from) {
      handleDateRangeChange({from: range.from, to: endOfDay(range.from)});
    }
  }

  const toolbar = (
    <FilterToolbar
        filters={filters}
        onDateRangeChange={onDateChange}
        onSetDatePreset={setDatePreset}
        moduleName="daily book"
        showSearch={false}
    >
        <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
    </FilterToolbar>
  );
  
  return (
    <ReportWrapper title="Daily Book" filterToolbar={toolbar}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card><CardHeader><CardTitle className="text-base">Opening Balances</CardTitle></CardHeader><CardContent className="text-sm space-y-1"><p><strong>Stock Value:</strong> RS {dailyData.opening.stock.toFixed(2)}</p><p><strong>Cash in Hand:</strong> RS {dailyData.opening.cash.toFixed(2)}</p>{dailyData.opening.banks.map(b => <p key={b.id}><strong>{b.name}:</strong> RS {b.balance.toFixed(2)}</p>)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Closing Balances</CardTitle></CardHeader><CardContent className="text-sm space-y-1"><p><strong>Stock Value:</strong> RS {dailyData.closing.stock.toFixed(2)}</p><p><strong>Cash in Hand:</strong> RS {dailyData.closing.cash.toFixed(2)}</p>{dailyData.closing.banks.map(b => <p key={b.id}><strong>{b.name}:</strong> RS {b.balance.toFixed(2)}</p>)}</CardContent></Card>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Type</TableHead><TableHead>Ref #</TableHead><TableHead>Party/Details</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Notes</TableHead><TableHead className="text-center">View</TableHead></TableRow></TableHeader>
          <TableBody>
            {dailyData.transactions.map((tx, idx) => (
              <TableRow key={idx}><TableCell>{format(tx.time, 'p')}</TableCell><TableCell className="font-medium">{tx.type}</TableCell><TableCell className="font-mono text-xs">{tx.ref}</TableCell><TableCell>{tx.party}</TableCell><TableCell className="text-right font-semibold">RS {tx.amount.toFixed(2)}</TableCell><TableCell className="text-xs text-muted-foreground">{tx.notes}</TableCell><TableCell className="text-center"><Button variant="ghost" size="icon" onClick={() => setTransactionToView({ transaction: tx.raw, type: tx.rawType })}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
        {dailyData.transactions.length === 0 && <p className="text-center p-8 text-muted-foreground">No transactions recorded for this day.</p>}
      </div>
    </ReportWrapper>
  );
};

export default DailyBook;