import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as CustomTableFooter } from "@/components/ui/table";
import { Edit, Eye, Wallet, TrendingUp, ShoppingCart, CreditCard, ArrowLeftRight, ChevronDown, Filter, X, Search, RefreshCw } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays, parseISO } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const allTransactionTypes = ['Cash In', 'Cash Out', 'Expenses', 'Sales Receipts', 'Purchase Payments', 'Cash Transfers', 'Cash Adjustments', 'Refunds'];

const TransactionIcon = ({ type }) => {
    const icons = {
      'Sales Receipts': <TrendingUp className="h-5 w-5 text-green-500" />,
      'Purchase Payments': <ShoppingCart className="h-5 w-5 text-red-500" />,
      'Expenses': <CreditCard className="h-5 w-5 text-orange-500" />,
      'Cash In': <ArrowLeftRight className="h-5 w-5 text-blue-500" />,
      'Cash Out': <ArrowLeftRight className="h-5 w-5 text-purple-500" />,
      'Cash Adjustments': <Wallet className="h-5 w-5 text-yellow-500" />,
    };
    return icons[type] || <Wallet className="h-5 w-5 text-gray-500" />;
};

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};


const CashTransactionLog = ({ onEditTransaction }) => {
    const { data, setTransactionToView, requirePasscodeForAction } = useData();
    const { sales, purchases, expenses, payments, cashInHand, cashTransactions, customers, suppliers } = data;
    const timeZone = 'Asia/Dubai';

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        types: [...allTransactionTypes],
        searchTerm: '',
    });

    const debouncedSearchTerm = useDebounce(filters.searchTerm, 200);

    const setDatePreset = useCallback((preset) => {
        const now = toDate(new Date(), { timeZone });
        let start, end;
        switch (preset) {
            case 'today': start = startOfDay(now); end = endOfDay(now); break;
            case 'yesterday': const y = subDays(now, 1); start = startOfDay(y); end = endOfDay(y); break;
            case 'last7': start = startOfDay(subDays(now, 6)); end = endOfDay(now); break;
            case 'lastMonth': const lm = subMonths(now, 1); start = startOfMonth(lm); end = endOfMonth(lm); break;
            default: start = startOfMonth(now); end = endOfMonth(now); break;
        }
        setFilters(prev => ({
            ...prev,
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        }));
    }, [timeZone]);

    useEffect(() => {
        setDatePreset('thisMonth');
    }, [setDatePreset]);
    
    const resetFilters = () => {
        setDatePreset('thisMonth');
        setFilters(prev => ({ ...prev, types: [...allTransactionTypes], searchTerm: '' }));
    }

    const combinedTransactions = useMemo(() => {
        let allTransactions = [];
        (sales || []).forEach(s => {
            if (s.paidAmount > 0 && s.payment?.method === 'cash') allTransactions.push({
                id: `sale-${s.id}`, date: s.date, type: 'Sales Receipts',
                party: customers.find(c => c.id === s.customerId)?.name || 'N/A',
                description: `Invoice #${s.saleNumber}`,
                amount: s.paidAmount, flow: 'in', ref: s, refType: 'sale'
            });
        });
        (purchases || []).forEach(p => {
            if (p.paidAmount > 0 && p.payment?.method === 'cash') allTransactions.push({
                id: `purchase-${p.id}`, date: p.date, type: 'Purchase Payments',
                party: suppliers.find(sup => sup.id === p.supplierId)?.name || 'N/A',
                description: `Bill #${p.purchaseNumber}`,
                amount: p.paidAmount, flow: 'out', ref: p, refType: 'purchase'
            });
        });
        (expenses || []).forEach(e => {
            if (e.paymentMethod === 'cash') allTransactions.push({
                id: `expense-${e.id}`, date: e.date, type: 'Expenses',
                party: e.category, description: e.notes,
                amount: e.amount, flow: 'out', ref: e, refType: 'expense'
            });
        });
        (payments || []).forEach(p => {
            if (p.method === 'cash') {
                const partyName = p.partyType === 'customer' ? customers.find(c => c.id === p.partyId)?.name : suppliers.find(s => s.id === p.partyId)?.name;
                allTransactions.push({
                    id: `payment-${p.id}`, date: p.date, type: p.type === 'in' ? 'Cash In' : 'Cash Out',
                    party: partyName || 'N/A', description: `Payment ref: ${p.id}`,
                    amount: p.amount, flow: p.type, ref: p, refType: 'payment'
                });
            }
        });
        (cashTransactions || []).forEach(tx => {
            allTransactions.push({
                id: `cash-${tx.id}`, date: tx.date, type: 'Cash Adjustments',
                party: 'Manual Adjustment', description: tx.description,
                amount: tx.amount, flow: tx.type === 'add' ? 'in' : 'out', ref: tx, refType: 'cash'
            });
        });

        return allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [sales, purchases, expenses, payments, cashTransactions, customers, suppliers]);

    const { transactionsWithBalance, openingBalance, closingBalance, totalInflow, totalOutflow } = useMemo(() => {
        const filteredByDateAndType = combinedTransactions.filter(tx => {
            const txDate = toDate(tx.date, { timeZone });
            const startDate = filters.startDate ? toDate(`${filters.startDate}T00:00:00`, { timeZone }) : null;
            const endDate = filters.endDate ? toDate(`${filters.endDate}T23:59:59`, { timeZone }) : null;

            const searchMatch = debouncedSearchTerm ? (
                tx.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                tx.party?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (tx.ref?.saleNumber || tx.ref?.purchaseNumber || tx.ref?.id)?.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            ) : true;

            return txDate >= startDate && txDate <= endDate && filters.types.includes(tx.type) && searchMatch;
        });
        
        const calcOpeningBalance = () => {
            let balance = cashInHand || 0;
            const startDate = filters.startDate ? toDate(`${filters.startDate}T00:00:00`, { timeZone }) : null;
            [...combinedTransactions].reverse().forEach(tx => {
                const txDate = toDate(tx.date, { timeZone });
                if (txDate >= startDate) {
                    if (tx.flow === 'in') balance -= tx.amount;
                    else balance += tx.amount;
                }
            });
            return balance;
        };
        
        const opening = calcOpeningBalance();
        let runningBalance = opening;
        const transactionsWithBalance = filteredByDateAndType.map(tx => {
            runningBalance += tx.flow === 'in' ? tx.amount : -tx.amount;
            return { ...tx, runningBalance };
        });

        const totalIn = transactionsWithBalance.reduce((sum, tx) => tx.flow === 'in' ? sum + tx.amount : sum, 0);
        const totalOut = transactionsWithBalance.reduce((sum, tx) => tx.flow === 'out' ? sum + tx.amount : sum, 0);
        
        return { 
            transactionsWithBalance, 
            openingBalance: opening, 
            closingBalance: runningBalance,
            totalInflow: totalIn,
            totalOutflow: totalOut,
        };
    }, [combinedTransactions, filters, cashInHand, debouncedSearchTerm, timeZone]);

    const handleSecureEdit = (tx) => {
        requirePasscodeForAction(() => onEditTransaction(tx));
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-2 justify-between">
                    <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                        <div className="flex gap-2">
                            <Input type="date" value={filters.startDate} onChange={e => setFilters(p=>({...p, startDate: e.target.value}))} className="w-auto"/>
                            <Input type="date" value={filters.endDate} onChange={e => setFilters(p=>({...p, endDate: e.target.value}))} className="w-auto"/>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            <Button variant="outline" size="sm" onClick={()=>setDatePreset('today')}>Today</Button>
                            <Button variant="outline" size="sm" onClick={()=>setDatePreset('last7')}>Last 7</Button>
                            <Button variant="outline" size="sm" onClick={()=>setDatePreset('thisMonth')}>This Month</Button>
                            <Button variant="outline" size="sm" onClick={()=>setDatePreset('lastMonth')}>Last Month</Button>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                         <div className="relative flex-grow">
                             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input placeholder="Search..." className="pl-8" value={filters.searchTerm} onChange={e=>setFilters(p=>({...p,searchTerm: e.target.value}))}/>
                         </div>
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
                                    <DropdownMenuCheckboxItem key={type} checked={filters.types.includes(type)} onCheckedChange={() => setFilters(p => ({...p, types: p.types.includes(type) ? p.types.filter(t => t !== type) : [...p.types, type] }))}>
                                        {type}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <Button variant="ghost" onClick={resetFilters}><RefreshCw className="h-4 w-4"/></Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead className="w-[150px]">Time</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Inflow</TableHead>
                                <TableHead className="text-right">Outflow</TableHead>
                                <TableHead className="text-right">Running Balance</TableHead>
                                <TableHead className="text-center w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow className="font-semibold bg-muted/50">
                                <TableCell colSpan={4}>Opening Balance</TableCell>
                                <TableCell className="text-right">RS {openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                            {transactionsWithBalance.length > 0 ? transactionsWithBalance.map((tx) => (
                                <TableRow key={tx.id} className="hover:bg-muted/50">
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatInTimeZone(new Date(tx.date), timeZone, 'PP p')}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <TransactionIcon type={tx.type} />
                                            <div>
                                                <span className="font-medium">{tx.description}</span>
                                                <p className="text-sm text-muted-foreground">{tx.party}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-right text-green-600">{tx.flow === 'in' ? `+${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                                    <TableCell className="font-mono text-right text-red-600">{tx.flow === 'out' ? `-${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                                    <TableCell className="font-mono text-right text-muted-foreground">{tx.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="text-center">
                                        {tx.refType === 'cash' && (
                                            <Button variant="ghost" size="icon" onClick={() => handleSecureEdit(tx)}>
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => setTransactionToView({ transaction: tx.ref, type: tx.refType })}>
                                            <Eye className="h-4 w-4 text-purple-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan="6" className="text-center text-gray-500 py-8">No cash transactions match the current filters.</TableCell></TableRow>
                            )}
                        </TableBody>
                        <CustomTableFooter>
                            <TableRow className="font-bold bg-muted">
                                <TableCell colSpan={2}>Closing Balance & Totals</TableCell>
                                <TableCell className="text-right text-green-600">RS {totalInflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right text-red-600">RS {totalOutflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell className="text-right">RS {closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </CustomTableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default CashTransactionLog;