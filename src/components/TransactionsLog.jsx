import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Landmark, Wallet, TrendingUp, ShoppingCart, CreditCard, ArrowLeftRight, PackageCheck, ChevronDown, Filter, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const TransactionIcon = ({ type }) => {
    const icons = {
      'Sale': <TrendingUp className="h-5 w-5 text-green-500" />,
      'Purchase': <ShoppingCart className="h-5 w-5 text-red-500" />,
      'Expense': <CreditCard className="h-5 w-5 text-orange-500" />,
      'Payment': <ArrowLeftRight className="h-5 w-5 text-blue-500" />,
      'Cash Adjustment': <Wallet className="h-5 w-5 text-yellow-500" />,
      'Online Order': <PackageCheck className="h-5 w-5 text-indigo-500" />,
    };
    return icons[type] || <Wallet className="h-5 w-5 text-gray-500" />;
};

const allTransactionTypes = ['Sale', 'Purchase', 'Expense', 'Payment', 'Cash Adjustment', 'Online Order'];

const TransactionsLog = () => {
    const { data, setTransactionToView } = useData();
    const { sales, purchases, expenses, payments, cashTransactions, customers, suppliers, banks, onlineOrders } = data;

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        types: [...allTransactionTypes],
    });

    useEffect(() => {
        const timeZone = 'Asia/Dubai';
        const now = toDate(new Date(), { timeZone });
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        setFilters(prev => ({
            ...prev,
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        }));
    }, []);

    const setDatePreset = (preset) => {
        const timeZone = 'Asia/Dubai';
        const now = toDate(new Date(), { timeZone });
        let start, end;

        switch (preset) {
            case 'today':
                start = startOfDay(now);
                end = endOfDay(now);
                break;
            case 'yesterday':
                const yesterday = subDays(now, 1);
                start = startOfDay(yesterday);
                end = endOfDay(yesterday);
                break;
            case 'last7':
                start = startOfDay(subDays(now, 6));
                end = endOfDay(now);
                break;
            case 'lastMonth':
                const lastMonth = subMonths(now, 1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                break;
            case 'thisMonth':
            default:
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
        }
        setFilters(prev => ({
            ...prev,
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        }));
    };
    
    const resetFilters = () => {
        setDatePreset('thisMonth');
        setFilters(prev => ({ ...prev, types: [...allTransactionTypes] }));
    }

    const combinedTransactions = useMemo(() => {
        let allTransactions = [];

        (sales || []).forEach(sale => {
            allTransactions.push({
                id: `sale-${sale.id}`, date: sale.date, type: 'Sale',
                description: `Invoice #${sale.saleNumber} to ${customers.find(c => c.id === sale.customerId)?.name || 'N/A'}`,
                amount: sale.totalCost, flow: 'in',
                method: sale.paidAmount > 0 ? (sale.payment.method === 'bank' ? `Bank: ${banks.find(b=>b.id === sale.payment.bankId)?.name || ''}` : 'Cash') : 'Credit',
                ref: sale, refType: 'sale'
            });
        });
        (purchases || []).forEach(p => {
             allTransactions.push({
                id: `purchase-${p.id}`, date: p.date, type: 'Purchase',
                description: `Bill #${p.purchaseNumber} from ${suppliers.find(s => s.id === p.supplierId)?.name || 'N/A'}`,
                amount: p.totalCost, flow: 'out',
                method: p.paidAmount > 0 ? (p.payment.method === 'bank' ? `Bank: ${banks.find(b=>b.id === p.payment.bankId)?.name || ''}` : 'Cash') : 'Credit',
                ref: p, refType: 'purchase'
            });
        });
        (payments || []).forEach(p => {
            const partyName = p.partyType === 'customer' ? customers.find(c => c.id === p.partyId)?.name : suppliers.find(s => s.id === p.partyId)?.name;
            allTransactions.push({
                id: `payment-${p.id}`, date: p.date, type: 'Payment',
                description: `${p.type === 'in' ? 'From' : 'To'}: ${partyName || 'N/A'}`,
                amount: p.amount, flow: p.type,
                method: p.method === 'bank' ? `Bank: ${banks.find(b=>b.id === p.bankId)?.name || 'N/A'}` : 'Cash',
                ref: p, refType: 'payment'
            });
        });
        (expenses || []).forEach(expense => {
            allTransactions.push({
                id: `expense-${expense.id}`, date: expense.date, type: 'Expense',
                description: `${expense.category}: ${expense.notes || ''}`, amount: expense.amount, flow: 'out',
                method: expense.paymentMethod === 'bank' ? `Bank: ${banks.find(b=>b.id === expense.bankId)?.name || 'N/A'}` : 'Cash',
                ref: expense, refType: 'expense'
            });
        });
        (cashTransactions || []).forEach(tx => {
            allTransactions.push({
                id: `cash-${tx.id}`, date: tx.date, type: 'Cash Adjustment',
                description: tx.description, amount: tx.amount, flow: tx.type === 'add' ? 'in' : 'out',
                method: 'Cash', ref: tx, refType: 'cash'
            });
        });
        (onlineOrders || []).forEach(order => {
            const sale = (sales || []).find(s => s.id === order.saleId);
            if (!sale) return;
            const customerName = (customers || []).find(c => c.id === sale.customerId)?.name || 'N/A';
            if (order.status !== 'Pending') {
                 allTransactions.push({
                    id: `online-order-${order.id}`, date: order.statusHistory.slice(-1)[0].date, type: 'Online Order',
                    description: `Order #${sale.saleNumber} for ${customerName} set to ${order.status}`,
                    amount: order.status === 'Delivered' ? sale.totalCost : 0, flow: order.status === 'Delivered' ? 'in' : 'neutral',
                    method: order.paymentMethod || 'COD', ref: order, refType: 'onlineOrder'
                });
            }
        });

        return allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [sales, purchases, expenses, payments, cashTransactions, onlineOrders, customers, suppliers, banks]);
    
    const filteredTransactions = useMemo(() => {
        return combinedTransactions.filter(tx => {
            const txDate = toDate(tx.date, { timeZone: 'Asia/Dubai' });
            const startDate = filters.startDate ? toDate(`${filters.startDate}T00:00:00`, { timeZone: 'Asia/Dubai' }) : null;
            const endDate = filters.endDate ? toDate(`${filters.endDate}T23:59:59`, { timeZone: 'Asia/Dubai' }) : null;
            
            if(startDate && txDate < startDate) return false;
            if(endDate && txDate > endDate) return false;
            if (!filters.types.includes(tx.type)) return false;

            return true;
        });
    }, [combinedTransactions, filters]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold gradient-text">Transactions Log</h1>
                <p className="text-muted-foreground mt-1">A unified view of all financial activities.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-2 justify-between">
                         <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                            <div className="flex gap-2">
                                <Input type="date" value={filters.startDate} onChange={e => setFilters(p=>({...p, startDate: e.target.value}))} className="w-auto"/>
                                <Input type="date" value={filters.endDate} onChange={e => setFilters(p=>({...p, endDate: e.target.value}))} className="w-auto"/>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                <Button variant="outline" size="sm" onClick={()=>setDatePreset('today')}>Today</Button>
                                <Button variant="outline" size="sm" onClick={()=>setDatePreset('yesterday')}>Yesterday</Button>
                                <Button variant="outline" size="sm" onClick={()=>setDatePreset('last7')}>Last 7 Days</Button>
                                <Button variant="outline" size="sm" onClick={()=>setDatePreset('thisMonth')}>This Month</Button>
                                <Button variant="outline" size="sm" onClick={()=>setDatePreset('lastMonth')}>Last Month</Button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto">
                                        <Filter className="mr-2 h-4 w-4"/>
                                        Types ({filters.types.length})
                                        <ChevronDown className="ml-2 h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {allTransactionTypes.map(type => (
                                        <DropdownMenuCheckboxItem
                                            key={type}
                                            checked={filters.types.includes(type)}
                                            onCheckedChange={() => {
                                                setFilters(prev => ({...prev, types: prev.types.includes(type) ? prev.types.filter(t => t !== type) : [...prev.types, type] }))
                                            }}
                                        >
                                            {type}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="ghost" onClick={resetFilters}><X className="mr-2 h-4 w-4"/>Reset</Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                    <TableHead className="w-[180px]">Time</TableHead>
                                    <TableHead className="w-[180px]">Type</TableHead>
                                    <TableHead>Details</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-center w-[80px]">View</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-muted/50">
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap align-top">{formatInTimeZone(new Date(tx.date), 'Asia/Dubai', 'PP p')}</TableCell>
                                        <TableCell className="align-top">
                                            <div className="flex items-center gap-2">
                                                <TransactionIcon type={tx.type} />
                                                <span className="font-medium whitespace-nowrap">{tx.type}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground pl-7 mt-1 whitespace-nowrap">{tx.method}</div>
                                        </TableCell>
                                        <TableCell className="break-words align-top">{tx.description}</TableCell>
                                        <TableCell className={`font-bold text-right align-top ${tx.flow === 'in' ? 'text-green-500' : tx.flow === 'out' ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {tx.flow !== 'neutral' && `RS ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        </TableCell>
                                        <TableCell className="text-center align-top">
                                            <Button variant="ghost" size="icon" onClick={() => setTransactionToView({ transaction: tx.ref, type: tx.refType })}>
                                                <Eye className="h-4 w-4 text-purple-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan="5" className="text-center text-gray-500 py-8">No transactions match the current filters.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TransactionsLog;